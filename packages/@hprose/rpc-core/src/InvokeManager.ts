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
| LastModified: Feb 16, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { PluginManager } from './PluginManager';

export type NextInvokeHandler = (name: string, args: any[], context: Context) => Promise<any>;
export type InvokeHandler = (name: string, args: any[], context: Context, next: NextInvokeHandler) => Promise<any>;
export class InvokeManager extends PluginManager<InvokeHandler, NextInvokeHandler> {
    protected getNextHandler(handler: InvokeHandler, next: NextInvokeHandler): NextInvokeHandler {
        return (name, args, context) => handler(name, args, context, next);
    }
}