/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ServiceContext.ts                                        |
|                                                          |
| ServiceContext for TypeScript.                           |
|                                                          |
| LastModified: Dec 30, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { Service } from './Service';
import { MethodLike } from './Method';

export interface AddressInfo {
    family?: string;
    address?: string;
    port?: number;
}

export class ServiceContext extends Context {
    public method!: MethodLike;
    public remoteAddress!: AddressInfo;
    public localAddress!: AddressInfo;
    constructor(public readonly service: Service) { super(); }
}