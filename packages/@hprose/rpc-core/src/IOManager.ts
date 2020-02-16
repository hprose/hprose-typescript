/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| IOManager.ts                                             |
|                                                          |
| IOManager for TypeScript.                                |
|                                                          |
| LastModified: Feb 16, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { PluginManager } from './PluginManager';

export type NextIOHandler = (request: Uint8Array, context: Context) => Promise<Uint8Array>;
export type IOHandler = (request: Uint8Array, context: Context, next: NextIOHandler) => Promise<Uint8Array>;
export class IOManager extends PluginManager<IOHandler, NextIOHandler> {
    protected getNextHandler(handler: IOHandler, next: NextIOHandler): NextIOHandler {
        return (request, context) => handler(request, context, next);
    }
}