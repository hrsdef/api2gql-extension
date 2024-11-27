import { Api1GqlGenerator } from './generator';

// 测试数据
const testApiDoc = {
    "API_NAME": "DescribeLocalVolumes",
    "METHOD": "GET",
    "PARAMETERS": [
        "Action (string, required)",
        "Version (string, required)",
        "InstanceName (string, optional)",
        "Marker (number, optional)",
        "MaxResults (number, optional)"
    ],
    "RESPONSE": {
        "RequestId": "string",
        "Marker": "number",
        "InstanceList": [
            {
                "InstanceName": "string",
                "InstanceStatus": "string",
                "Memory": "number",
                "CPU": "string",
                "Tag": "string",
                "Details": {
                    "Name": "string",
                    "Age": "number"
                }
            }
        ]
    }
};

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