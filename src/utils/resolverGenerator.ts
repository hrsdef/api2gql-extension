import { ApiDoc } from './types';

export class ResolverGenerator {
    public generate(yamlDoc: ApiDoc): string {
        const { API_NAME, METHOD, PARAMETERS } = yamlDoc;
        const paramNames = PARAMETERS.map(param => param.split(' ')[0]);
        const paramsObj = paramNames.join(', ');

        return `@Resolver((of) => Res${API_NAME})
export class ${API_NAME}Resolver {
  @Query((returns) => Res${API_NAME})
  async ${API_NAME.toLowerCase()}(
    @Ctx() ctx: Context,
    @Args() { ${paramsObj} }: ${API_NAME}Params
  ): Promise<Res${API_NAME} | undefined> {
    const res = await requestAPI(ctx, '${API_NAME}', '${METHOD}', { ${paramsObj} });
    return res.data;
  }
}`;
    }
}