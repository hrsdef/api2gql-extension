export interface ApiDoc {
    API_NAME: string;
    METHOD: string;
    PARAMETERS: string[];
    RESPONSE: Record<string, any>;
}

export interface ArrayObject {
    name: string;
    parent: string;
    fields: Record<string, any>;
}

export interface GeneratedCode {
    gql: string;
    typeDefs: string;
    resolver: string;
}