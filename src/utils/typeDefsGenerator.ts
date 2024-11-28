import { ApiDoc } from './types';

export class TypeDefsGenerator {
    private indent: string;

    constructor(indent: string = '    ') {
        this.indent = indent;
    }

    private generateNestedTypes(obj: Record<string, any>, baseName: string): string {
        let classDef = `@ObjectType()\nexport class ${baseName} {\n`;
        const typeDefinitions: string[] = [];

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                const nestedTypeName = `${baseName}${key}`;
                typeDefinitions.push(this.generateNestedTypes(value, nestedTypeName));
                classDef += `${this.indent}@Field(() => ${nestedTypeName}, { nullable: true })\n${this.indent}${key}?: ${nestedTypeName};\n\n`;
            } else if (Array.isArray(value)) {
                if (typeof value[0] === 'object') {
                    const nestedTypeName = `${baseName}${key}Item`;
                    typeDefinitions.push(this.generateNestedTypes(value[0], nestedTypeName));
                    classDef += `${this.indent}@Field(() => [${nestedTypeName}], { nullable: true })\n${this.indent}${key}?: ${nestedTypeName}[];\n\n`;
                } else {
                    const tsType = typeof value[0];
                    classDef += `${this.indent}@Field(() => [${tsType}], { nullable: true })\n${this.indent}${key}?: ${tsType}[];\n\n`;
                }
            } else {
                const tsType = typeof value;
                classDef += `${this.indent}@Field({ nullable: true })\n${this.indent}${key}?: ${tsType};\n\n`;
            }
        }

        // 移除最后一个多余的换行符
        classDef = classDef.replace(/\n\n$/, '\n');
        classDef += '}\n';
        
        // 如果有嵌套类型定义，确保它们之间有换行符
        return typeDefinitions.length > 0 
            ? typeDefinitions.join('\n') + '\n' + classDef 
            : classDef;
    }

    private generateGqlType(paramType: string): string {
        const typeMapping: Record<string, string> = {
            'string': 'string',
            'number': 'number',
            'boolean': 'boolean',
            'String': 'string',
            'Number': 'number',
            'Boolean': 'boolean'
        };
        
        const normalizedType = paramType.toLowerCase().trim();
        return typeMapping[normalizedType] || 'string';
    }

    public generate(yamlDoc: ApiDoc): string {
        const { API_NAME, PARAMETERS, RESPONSE } = yamlDoc;

        // Generate response classes
        const responseClass = this.generateNestedTypes(RESPONSE, `Res${API_NAME}`);

        // Generate params class
        let paramClass = `@ArgsType()\nexport class RequestParams {\n`;
        for (const param of PARAMETERS) {
            const [paramName, paramType] = param.split('(');
            const isRequired = param.includes('required');
            const tsType = this.generateGqlType(paramType.split(',')[0].trim());
            
            paramClass += `${this.indent}@Field(${isRequired ? '' : '{ nullable: true }'})\n`;
            paramClass += `${this.indent}${paramName.trim()}${isRequired ? '!' : '?'}: ${tsType};\n\n`;
        }

        // 移除最后一个多余的换行符
        paramClass = paramClass.replace(/\n\n$/, '\n');
        paramClass += '}\n\n';

        return responseClass + '\n' + paramClass;
    }
}