import { ApiDoc } from './types';

export class TypeDefsGenerator {
    private generateNestedTypes(obj: Record<string, any>, baseName: string): string {
        let classDef = `@ObjectType()\nexport class ${baseName} {\n`;
        const typeDefinitions: string[] = [];

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                const nestedTypeName = `${baseName}${key}`;
                typeDefinitions.push(this.generateNestedTypes(value, nestedTypeName));
                classDef += `  @Field(() => ${nestedTypeName}, { nullable: true })\n  ${key}?: ${nestedTypeName};\n\n`;
            } else if (Array.isArray(value)) {
                if (typeof value[0] === 'object') {
                    const nestedTypeName = `${baseName}${key}Item`;
                    typeDefinitions.push(this.generateNestedTypes(value[0], nestedTypeName));
                    classDef += `  @Field(() => [${nestedTypeName}], { nullable: true })\n  ${key}?: ${nestedTypeName}[];\n\n`;
                } else {
                    const tsType = typeof value[0];
                    classDef += `  @Field(() => [${tsType}], { nullable: true })\n  ${key}?: ${tsType}[];\n\n`;
                }
            } else {
                const tsType = typeof value;
                classDef += `  @Field({ nullable: true })\n  ${key}?: ${tsType};\n\n`;
            }
        }
        
        return typeDefinitions.join('\n') + classDef + '}\n';
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

        // Generate params class
        let paramClass = `@ArgsType()\nexport class ${API_NAME}Params {\n`;
        for (const param of PARAMETERS) {
            const [paramName, paramType] = param.split('(');
            const isRequired = param.includes('required');
            const tsType = this.generateGqlType(paramType.split(',')[0].trim());
            
            paramClass += `  @Field(${isRequired ? '' : '{ nullable: true }'})\n`;
            paramClass += `  ${paramName.trim()}${isRequired ? '!' : '?'}: ${tsType};\n\n`;
        }
        paramClass += '}\n\n';

        // Generate response classes
        const responseClass = this.generateNestedTypes(RESPONSE, `Res${API_NAME}`);

        return paramClass + responseClass;
    }
}