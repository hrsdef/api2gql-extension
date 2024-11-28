import { Query, Ctx, Args, Resolver } from 'type-graphql';
import { RequestParams, ResDescribeLocalVolumes  } from './typeDefs';
import { requestAPI, } from '../../utils/request';
import { Context } from 'overlord-server';

@Resolver((of) => ResDescribeLocalVolumes)
export class DescribeLocalVolumesResolver {
    @Query((returns) => ResDescribeLocalVolumes)
    async describelocalvolumes(
        @Ctx() ctx: Context,
        @Args() { Action, Version, InstanceName, Marker, MaxResults, test }: RequestParams
    ): Promise<ResDescribeLocalVolumes | undefined> {
        const res = await requestAPI(ctx, 'DescribeLocalVolumes', 'GET', { Action, Version, InstanceName, Marker, MaxResults, test });
        return res.data;
    }
}