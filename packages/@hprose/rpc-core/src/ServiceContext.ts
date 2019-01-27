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

export class ServiceContext implements Context {
  public readonly requestHeaders: { [name: string]: any } = Object.create(null);
  public readonly responseHeaders: { [name: string]: any } = Object.create(null);
  public missing: boolean = false;
  public method: Function = () => {};
  public target: any;
  [name: string]: any;
  constructor(public readonly service: Service) {}
  public clone(): ServiceContext {
    let result: ServiceContext = Object.create(ServiceContext.prototype);
    copy(this, result);
    return result;
  }
}
