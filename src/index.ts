import { Api1GqlGenerator } from './generator';

// 测试数据
const testApiDoc = {
    "API_NAME": "DescribeLocalVolumes",
    "METHOD": "POST",
    "PARAMETERS": [
      "Action (string, required)",
      "Version (string, required)",
      "InstanceName (string, optional)",
      "Marker (number, optional)",
      "MaxResults (number, optional)",
      "test (boolean, optional)"
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
            "arrayObjName": "string",
            "arrayObjAge": "number"
          },
          "arrayList": [
            {
              "arrayListName": "string",
              "arrayListAge": "number",
            }
          ]
        }
      ],
      "DBList": [
        {
          "DBname": "string",
          "DBstatus": "string"
        }
      ],
      "UserInfo": {
        "name": "string",
        "age": "number"
      }
    }
}

// 运行生成器
const generator = new Api1GqlGenerator();
try {
    const result = generator.generate(JSON.stringify(testApiDoc));
    
    console.log('\n=== Generated GraphQL Query ===\n');
    console.log(result.gql);
    
    console.log('\n=== Generated TypeDefs ===\n');
    console.log(result.typeDefs);
    
    console.log('\n=== Generated Resolver ===\n');
    console.log(result.resolver);
} catch (error) {
    console.error('Generation failed:', error);
}