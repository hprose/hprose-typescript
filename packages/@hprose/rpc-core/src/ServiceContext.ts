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
| LastModified: Jan 27, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { Service } from './Service';
import { copy } from './Utils';
import { MethodLike } from './Method';

export class ServiceContext implements Context {
    public readonly requestHeaders: { [name: string]: any } = Object.create(null);
    public readonly responseHeaders: { [name: string]: any } = Object.create(null);
    public method!: MethodLike;
    [name: string]: any;
    constructor(public readonly service: Service) { }
    public clone(): ServiceContext {
        let result: ServiceContext = Object.create(ServiceContext.prototype);
        copy(this, result);
        return result;
    }
}