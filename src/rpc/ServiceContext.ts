/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: http://www.hprose.com/                 |
|                   http://www.hprose.org/                 |
|                                                          |
\*________________________________________________________*/
/*--------------------------------------------------------*\
|                                                          |
| hprose/rpc/ServiceContext.ts                             |
|                                                          |
| ServiceContext for TypeScript.                           |
|                                                          |
| LastModified: Jan 9, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { Service } from './Service';
import { copy } from './Utils';

export class ServiceContext implements Context {
    public debug: boolean;
    public simple: boolean;
    public utc: boolean;
    public missing: boolean = false;
    public method: Function = ()=>{};
    public obj: any;
    public requestHeaders: { [name: string]: any } = Object.create(null);
    public responseHeaders: { [name: string]: any } = Object.create(null);
    [name: string]: any;
    constructor(public service: Service) {
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