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
| LastModified: Jan 26, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { Service } from './Service';
import { copy } from './Utils';

export class ServiceContext implements Context {
    public readonly requestHeaders: { [name: string]: any } = Object.create(null);
    public readonly responseHeaders: { [name: string]: any } = Object.create(null);
    public debug: boolean;
    public simple: boolean;
    public utc: boolean;
    public missing: boolean = false;
    public method: Function = ()=>{};
    public target: any;
    [name: string]: any;
    constructor(public readonly service: Service) {
        this.debug = service.debug;
        this.simple = service.simple;
        this.utc = service.utc;
    }
    public clone(): ServiceContext {
        let result: ServiceContext = Object.create(ServiceContext.prototype);
        copy(this, result);
        return result;
    }
}