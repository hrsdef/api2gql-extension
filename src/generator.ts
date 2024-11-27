import { ApiDoc, GeneratedCode } from './utils/types';
import { GqlGenerator } from './utils/gqlGenerator';
import { TypeDefsGenerator } from './utils/typeDefsGenerator';
import { ResolverGenerator } from './utils/resolverGenerator';

export class Api1GqlGenerator {
    private gqlGenerator: GqlGenerator;
    private typeDefsGenerator: TypeDefsGenerator;
    private resolverGenerator: ResolverGenerator;

    constructor() {
        this.gqlGenerator = new GqlGenerator();
        this.typeDefsGenerator = new TypeDefsGenerator();
        this.resolverGenerator = new ResolverGenerator();
    }

    public generate(yamlContent: string): GeneratedCode {
        try {
            const apiDoc = JSON.parse(yamlContent);
            
            return {
                gql: this.gqlGenerator.generate(apiDoc),
                typeDefs: this.typeDefsGenerator.generate(apiDoc),
                resolver: this.resolverGenerator.generate(apiDoc)
            };
        } catch (error) {
            throw new Error(`Failed to generate: ${error}`);
        }
    }
}