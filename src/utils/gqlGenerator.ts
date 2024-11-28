import { ApiDoc, ArrayObject } from './types';

export class GqlGenerator {
    private indent: string;

    constructor(indent: string = '    ') {
        this.indent = indent;
    }

    private generateGqlType(paramType: string): string {
        const typeMapping: { [key: string]: string } = {
            'string': 'String',
            'number': 'Float',
            'boolean': 'Boolean'
        };
        return typeMapping[paramType.toLowerCase()] || 'String';
    }

    private findArrayObjects(obj: Record<string, any>, parentKey: string = ""): ArrayObject[] {
        const arrayObjects: ArrayObject[] = [];
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                arrayObjects.push(...this.findArrayObjects(value, key));
            } else if (Array.isArray(value) && typeof value[0] === 'object') {
                arrayObjects.push({
                    name: key,
                    parent: parentKey,
                    fields: value[0]
                });
                arrayObjects.push(...this.findArrayObjects(value[0], key));
            }
        }
        return arrayObjects;
    }

    private generateFragment(arrayObj: ArrayObject, apiName: string): string {
        const baseName = `Res${apiName}`;
        const fragmentName = `${arrayObj.name}Data`;
        const typeName = `${baseName}${arrayObj.name}Item`;
        
        const fields: string[] = [];
        
        for (const [key, value] of Object.entries(arrayObj.fields)) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                // 处理嵌套对象
                const subFields = Object.keys(value).map(subKey => `${this.indent}${this.indent}${subKey}`);
                fields.push(`${this.indent}${key} {\n${subFields.join('\n')}\n${this.indent}}`);
            } else if (Array.isArray(value) && typeof value[0] === 'object') {
                // 处理数组对象，使用fragment引用
                fields.push(`${this.indent}${key} {\n${this.indent}${this.indent}...${key}Data\n${this.indent}}`);
            } else {
                // 处理基本类型
                fields.push(`${this.indent}${key}`);
            }
        }
        
        return `fragment ${fragmentName} on ${typeName} {
${fields.join('\n')}
}`;
    }

    private generateResponseFields(resp: Record<string, any>, indentLevel: number = 2): string {
        const fields: string[] = [];
        const currentIndent = this.indent.repeat(indentLevel);
        
        for (const [key, value] of Object.entries(resp)) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                const subFields = this.generateResponseFields(value, indentLevel + 1);
                fields.push(`${currentIndent}${key} {\n${subFields}\n${currentIndent}}`);
            } else if (Array.isArray(value)) {
                if (typeof value[0] === 'object') {
                    fields.push(`${currentIndent}${key} {\n${currentIndent}${this.indent}...${key}Data\n${currentIndent}}`);
                } else {
                    fields.push(`${currentIndent}${key}`);
                }
            } else {
                fields.push(`${currentIndent}${key}`);
            }
        }
        
        return fields.join('\n');
    }

    public generate(yamlDoc: ApiDoc): string {
        const apiName = yamlDoc.API_NAME.toLowerCase();
        const params: string[] = [];
        const args: string[] = [];

        // 根据 HTTP 方法决定使用 query 还是 mutation
        const operationType = yamlDoc.METHOD.toUpperCase() === 'GET' ? 'query' : 'mutation';
        
        // 查找所有数组对象并生成Fragment
        const arrayObjects = this.findArrayObjects(yamlDoc.RESPONSE);
        const fragments = arrayObjects.map(obj => this.generateFragment(obj, apiName));

        // 生成参数部分
        for (const param of yamlDoc.PARAMETERS) {
            const [paramDef] = param.split('(');
            const paramName = paramDef.trim();
            const paramType = param.match(/\((.*?),/)?.[1].trim() || 'string';
            const isRequired = param.includes('required');

            let gqlType = this.generateGqlType(paramType);
            if (isRequired) {
                gqlType += '!';
            }

            params.push(`${this.indent}$${paramName}: ${gqlType}`);
            args.push(`${this.indent}${paramName}: $${paramName}`);
        }

        // 构建主查询
        const query = `${operationType} ${apiName}(
${params.join(',\n')}
) {
${this.indent}${apiName}(
${args.join(',\n')}
${this.indent}) {
${this.generateResponseFields(yamlDoc.RESPONSE)}
${this.indent}}
}`;

         // 如果有Fragment定义，添加到查询后面
        if (fragments.length > 0) {
            return `${query}\n\n${fragments.join('\n\n')}`;
        }

            return query;
        }
}