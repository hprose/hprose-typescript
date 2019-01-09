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
| LastModified: Jan 8, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { Service } from './Service';
import { copy } from './Utils';

export class ServerContext implements Context {
    public headers: { [name: string]: any } = Object.create(null);
    [name: string]: any;
    constructor(public service: Service) {}
    public clone(): ServerContext {
        let result: ServerContext = Object.create(ServerContext.prototype);
        copy(this, result);
        return result;
    }
}

export interface ServiceContext extends ServerContext {
    debug: boolean;
    simple: boolean;
    utc: boolean;
    missing: boolean;
    method: Function;
    obj: any;
}