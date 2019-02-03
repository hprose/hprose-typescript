/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| InvokeManager.ts                                         |
|                                                          |
| InvokeManager for TypeScript.                            |
|                                                          |
| LastModified: Feb 3, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { HandlerManager } from './HandlerManager';

export type NextInvokeHandler = (name: string, args: any[], context: Context) => Promise<any>;
export type InvokeHandler = (name: string, args: any[], context: Context, next: NextInvokeHandler) => Promise<any>;
export class InvokeManager extends HandlerManager<InvokeHandler, NextInvokeHandler> {
    protected getNextHandler(handler: InvokeHandler, next: NextInvokeHandler): NextInvokeHandler {
        return (name, args, context) => handler(name, args, context, next);
    }
}