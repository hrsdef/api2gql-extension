import { Field, ObjectType, ArgsType, InputType } from 'type-graphql';

@ArgsType()
export class RequestParams {
    @Field()
    Action!: string;

    @Field()
    Version!: string;

    @Field({ nullable: true })
    InstanceName?: string;

    @Field({ nullable: true })
    Marker?: number;

    @Field({ nullable: true })
    MaxResults?: number;

    @Field({ nullable: true })
    test?: boolean;

}

@ObjectType()
export class ResDescribeLocalVolumesInstanceListItemarrayObj {
    @Field({ nullable: true })
    arrayObjName?: string;

    @Field({ nullable: true })
    arrayObjAge?: string;

}

@ObjectType()
export class ResDescribeLocalVolumesInstanceListItemarrayListItem {
    @Field({ nullable: true })
    arrayListName?: string;

    @Field({ nullable: true })
    arrayListAge?: string;

}
@ObjectType()
export class ResDescribeLocalVolumesInstanceListItem {
    @Field({ nullable: true })
    InstanceName?: string;

    @Field({ nullable: true })
    InstanceStatus?: string;

    @Field({ nullable: true })
    Memory?: string;

    @Field({ nullable: true })
    CPU?: string;

    @Field({ nullable: true })
    Tag?: string;

    @Field(() => ResDescribeLocalVolumesInstanceListItemarrayObj, { nullable: true })
    arrayObj?: ResDescribeLocalVolumesInstanceListItemarrayObj;

    @Field(() => [ResDescribeLocalVolumesInstanceListItemarrayListItem], { nullable: true })
    arrayList?: ResDescribeLocalVolumesInstanceListItemarrayListItem[];

}

@ObjectType()
export class ResDescribeLocalVolumesDBListItem {
    @Field({ nullable: true })
    DBname?: string;

    @Field({ nullable: true })
    DBstatus?: string;

}

@ObjectType()
export class ResDescribeLocalVolumesUserInfo {
    @Field({ nullable: true })
    name?: string;

    @Field({ nullable: true })
    age?: string;

}
@ObjectType()
export class ResDescribeLocalVolumes {
    @Field({ nullable: true })
    RequestId?: string;

    @Field({ nullable: true })
    Marker?: string;

    @Field({ nullable: true })
    MarkerCount?: string;

    @Field(() => [ResDescribeLocalVolumesInstanceListItem], { nullable: true })
    InstanceList?: ResDescribeLocalVolumesInstanceListItem[];

    @Field(() => [ResDescribeLocalVolumesDBListItem], { nullable: true })
    DBList?: ResDescribeLocalVolumesDBListItem[];

    @Field(() => ResDescribeLocalVolumesUserInfo, { nullable: true })
    UserInfo?: ResDescribeLocalVolumesUserInfo;

}
