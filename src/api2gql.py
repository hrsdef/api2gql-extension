from typing import Dict, List
import json
from pygments import highlight
from pygments.lexers import JsonLexer, GraphQLLexer, TypeScriptLexer
from pygments.formatters import TerminalFormatter 

def generate_gql_type(param_type: str) -> str:
    """Convert parameter type to GraphQL type"""
    type_mapping = {
        'string': 'String',
        'number': 'Float',
        'boolean': 'Boolean'
    }
    return type_mapping.get(param_type.lower(), 'String')

def find_array_objects(obj: Dict, parent_key: str = "") -> List[Dict]:
    """递归查找数组对象并生成Fragment"""
    array_objects = []
    for key, value in obj.items():
        if isinstance(value, dict):
            array_objects.extend(find_array_objects(value, key))
        elif isinstance(value, list) and isinstance(value[0], dict):
            # 找到数组对象，生成Fragment信息
            array_objects.append({
                'name': key,
                'parent': parent_key,
                'fields': value[0]
            })
            # 递归处理数组对象的内部结构
            array_objects.extend(find_array_objects(value[0], key))
    return array_objects

def generate_fragment(array_obj: Dict, api_name: str) -> str:
    """生成Fragment定义"""
    base_name = f"Res{api_name}"
    fragment_name = f"{array_obj['name']}Data"
    type_name = f"{base_name}{array_obj['name']}Item"  # 匹配 TypeDefs 中的类名
    
    fields = []
    for key, value in array_obj['fields'].items():
        if isinstance(value, dict):
            # 修改这里：直接生成嵌套对象的字段
            sub_fields = []
            for sub_key in value.keys():
                sub_fields.append(f"      {sub_key}")
            fields.append(f"    {key} {{\n{chr(10).join(sub_fields)}\n    }}")
        elif isinstance(value, list) and isinstance(value[0], dict):
            fields.append(f"    {key} {{\n      ...{key}Data\n    }}")
        else:
            fields.append(f"    {key}")
            
    fields_str = '\n'.join(fields)
    return f"""fragment {fragment_name} on {type_name} {{
{fields_str}
}}"""

def generate_gql(api_doc: Dict) -> str:
    """生成GraphQL查询，包含Fragment定义"""
    api_name = api_doc["API_NAME"].lower()
    params = []
    args = []
    fragments = []

    # 查找所有数组对象并生成Fragment
    array_objects = find_array_objects(api_doc["RESPONSE"])
    # 传入 api_name 参数
    fragments = [generate_fragment(obj, api_name) for obj in array_objects]
    
    # 生成参数部分
    for param in api_doc["PARAMETERS"]:
        param_name = param.split()[0]
        param_type = param.split('(')[1].split(',')[0]
        is_required = "required" in param
        
        gql_type = generate_gql_type(param_type)
        if is_required:
            gql_type += "!"
            
        params.append(f"${param_name}: {gql_type}")
        args.append(f"{param_name}: ${param_name}")

    def generate_response_fields(resp: Dict, indent: int = 2) -> str:
        """生成响应字段，包含Fragment引用"""
        fields = []
        for key, value in resp.items():
            if isinstance(value, dict):
                # 修改这里，直接递归生成子字段，不需要Fragment引用
                sub_fields = generate_response_fields(value, indent + 2)
                fields.append(f"{'  ' * indent}{key} {{\n{sub_fields}\n{'  ' * indent}}}")
            elif isinstance(value, list):
                if isinstance(value[0], dict):
                    fields.append(f"{'  ' * indent}{key} {{\n{'  ' * (indent + 1)}...{key}Data\n{'  ' * indent}}}")
                else:
                    fields.append(f"{'  ' * indent}{key}")
            else:
                fields.append(f"{'  ' * indent}{key}")
        return '\n'.join(fields)

    # 生成主查询
    response_fields = generate_response_fields(api_doc["RESPONSE"])
    
    # 先准备好参数和参数列表的字符串
    params_str = ',\n  '.join(params)
    args_str = ',\n    '.join(args)
    
    query = f"""query {api_name}(
  {params_str}
) {{
  {api_name}(
    {args_str}
  ) {{
{response_fields}
  }}
}}"""

    # 如果有Fragment定义，添加到查询后面
    if fragments:
        query += "\n\n" + "\n\n".join(fragments)
    
    return query

def generate_typedefs(api_doc: Dict) -> str:
    """生成TypeScript类型定义"""
    api_name = api_doc["API_NAME"]
    params = api_doc["PARAMETERS"]
    response = api_doc["RESPONSE"]
    
    # 生成参数类
    param_class = f"""@ArgsType()
export class {api_name}Params {{
"""
    for param in params:
        param_name = param.split('(')[0].strip()
        param_type = param.split('(')[1].split(',')[0].strip()
        is_required = "required" in param
        ts_type = 'string' if param_type == 'string' else 'number' if param_type == 'number' else 'boolean'
        
        param_class += f"""  @Field({'' if is_required else '{ nullable: true }'})
  {param_name}{'!' if is_required else '?'}: {ts_type};

"""
    param_class += "}\n"

    # 用于存储所有需要生成的类定义
    type_definitions = []
    
    def generate_nested_types(obj: Dict, base_name: str) -> str:
        """递归生成嵌套的类型定义"""
        class_def = f"""@ObjectType()
export class {base_name} {{
"""
        for key, value in obj.items():
            if isinstance(value, dict):
                # 为嵌套对象生成新的类型名
                nested_type_name = f"{base_name}{key}"
                # 递归生成嵌套类型
                type_definitions.append(generate_nested_types(value, nested_type_name))
                # 在当前类中引用嵌套类型
                class_def += f"""  @Field(() => {nested_type_name}, {{ nullable: true }})
  {key}?: {nested_type_name};

"""
            elif isinstance(value, list):
                if isinstance(value[0], dict):
                    # 数组中的对象类型
                    nested_type_name = f"{base_name}{key}Item"
                    type_definitions.append(generate_nested_types(value[0], nested_type_name))
                    class_def += f"""  @Field(() => [{nested_type_name}], {{ nullable: true }})
  {key}?: {nested_type_name}[];

"""
                else:
                    # 简单类型的数组
                    ts_type = 'string' if value[0] == 'string' else 'number' if value[0] == 'number' else 'boolean'
                    class_def += f"""  @Field(() => [String], {{ nullable: true }})
  {key}?: {ts_type}[];

"""
            else:
                # 简单型
                ts_type = 'string' if value == 'string' else 'number' if value == 'number' else 'boolean'
                class_def += f"""  @Field({{ nullable: true }})
  {key}?: {ts_type};

"""
        class_def += "}\n"
        return class_def

    # 生成主响应类和所有嵌套类型
    main_class = generate_nested_types(response, f"Res{api_name}")
    
    # 组合所有类型定义
    all_type_defs = param_class + "\n" + "\n".join(type_definitions) + main_class
    
    return all_type_defs

def generate_resolver(api_doc: Dict) -> str:
    """生成Resolver实现"""
    api_name = api_doc["API_NAME"]
    method = api_doc["METHOD"]
    
    # 从参数列表中提取参数名
    param_names = [param.split()[0] for param in api_doc["PARAMETERS"]]
    # 生成参数对象字符串
    params_obj = ", ".join(param_names)
    
    return f"""@Resolver((of) => Res{api_name})
export class {api_name}Resolver {{

  @Query((returns) => Res{api_name})
  async {api_name}(
    @Ctx() ctx: Context,
    @Args() {{ {params_obj} }}: RequestParams
  ): Promise<Res{api_name} | undefined> {{
    const res = await requestAPI(ctx, '{api_name}', '{method}', {{ {params_obj} }});
    return res.data;
  }}
}}"""

def generate_mock_dataset() -> Dict:
    """生成指定数量的模拟数据集"""
    api_doc = {
        "API_NAME": "DescribeLocalVolumes",
        "METHOD": "GET",
        "PARAMETERS": [
            "Action (string, required)",
            "Version (string, required)",
            "InstanceName (string, optional)",
            "Marker (number, optional)",
            "MaxResults (number, optional)",
            "test (boolean, optional)",
        ],
        "RESPONSE": {
            "RequestId": "string",
            "Marker": "number",
            "MarkerCount": "number",
            "InstanceList": [
                {
                    "InstanceName": "string",
                    "InstanceStatus": "string",
                    "Memory": "number",
                    "CPU": "string",
                    "Tag": "string",
                    "arrayObj": {
                        "arrayObjName": 'string',
                        "arrayObjAge": 'number'
                    },
                    "arrayList": [
                        {
                            "arrayListName": 'string',
                            "arrayListAge": 'number',
                        }
                    ]
                }
            ],
            "DBList": [
                {
                    "DBname": "string",
                    "DBstatus": "string",
                }
            ],
            "UserInfo": {
                'name': 'string',
                'age': 'number',
            }
        }
    }
    
    # 生成基础数据
    gql = generate_gql(api_doc)
    typedefs = generate_typedefs(api_doc)
    resolver = generate_resolver(api_doc)
    
    # 创建带格式的输出
    sample = {
        "source": api_doc,
        "target": {
            "gql": gql,
            "typedefs": typedefs,
            "resolver": resolver
        }
    }
    
    return sample

if __name__ == "__main__":
    source = generate_mock_dataset()
    
    # 格式化并高亮 source
    source_json = json.dumps(source["source"], indent=2, ensure_ascii=False)
    colored_source = highlight(source_json, JsonLexer(), TerminalFormatter())
    
    # 格式化并高亮 GraphQL
    colored_gql = highlight(
        source["target"]["gql"], 
        GraphQLLexer(), 
        TerminalFormatter()
    )
    
    # 格式化并高亮 TypeScript (typedefs 和 resolver)
    colored_typedefs = highlight(
        source["target"]["typedefs"], 
        TypeScriptLexer(), 
        TerminalFormatter()
    )
    
    colored_resolver = highlight(
        source["target"]["resolver"], 
        TypeScriptLexer(), 
        TerminalFormatter()
    )
    
    # 打印结果
    print("\n=== Source ===")
    print(colored_source)
    
    print("\n=== GraphQL Query ===")
    print(colored_gql)
    
    print("\n=== TypeScript Type Definitions ===")
    print(colored_typedefs)
    
    print("\n=== Resolver ===")
    print(colored_resolver)