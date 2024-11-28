import { ApiDoc } from './types';

export class ResolverGenerator {
  private indent: string;

  constructor(indent: string = '    ') {
      this.indent = indent;
  }

    public generate(yamlDoc: ApiDoc): string {
        const { API_NAME, METHOD, PARAMETERS } = yamlDoc;
        const paramNames = PARAMETERS.map(param => param.split(' ')[0]);
        const paramsObj = paramNames.join(', ');

        // 根据 HTTP 方法决定使用 Query 还是 Mutation
        const decoratorType = METHOD.toUpperCase() === 'GET' ? 'Query' : 'Mutation';

        return `@Resolver((of) => Res${API_NAME})
export class ${API_NAME}Resolver {
${this.indent}@${decoratorType}((returns) => Res${API_NAME})
${this.indent}async ${API_NAME.toLowerCase()}(
${this.indent}${this.indent}@Ctx() ctx: Context,
${this.indent}${this.indent}@Args() { ${paramsObj} }: RequestParams
${this.indent}): Promise<Res${API_NAME} | undefined> {
${this.indent}${this.indent}const res = await requestAPI(ctx, '${API_NAME}', '${METHOD}', { ${paramsObj} });
${this.indent}${this.indent}return res.data;
${this.indent}}
}\n`;
    }
}