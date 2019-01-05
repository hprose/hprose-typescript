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
| hprose/rpc/HandlerManager.ts                             |
|                                                          |
| hprose HandlerManager for TypeScript.                    |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';

export type NextInvokeHandler = (name: string, args: any[], context: Context) => Promise<any>;
export type NextIOHandler = (request: Uint8Array, context: Context) => Promise<Uint8Array>;
export type InvokeHandler = (name: string, args: any[], context: Context, next: NextInvokeHandler) => Promise<any>;
export type IOHandler = (request: Uint8Array, context: Context, next: NextIOHandler) => Promise<Uint8Array>;
export class HandlerManager {
    private invokeHandlers: InvokeHandler[] = [];
    private ioHandlers: IOHandler[] = [];
    private firstInvokeHandler: NextInvokeHandler;
    private firstIOHandler: NextIOHandler;
    constructor(public defaultInvokeHandler: NextInvokeHandler, public defaultIOHandler: NextIOHandler) {
        this.firstInvokeHandler = defaultInvokeHandler;
        this.firstIOHandler = defaultIOHandler;
    }
    private getNextInvokeHandler(handler: InvokeHandler, next: NextInvokeHandler): NextInvokeHandler {
        return (name, args, context) => handler(name, args, context, next);
    }
    private getNextIOHandler(handler: IOHandler, next: NextIOHandler): NextIOHandler {
        return (request, context) => handler(request, context, next);
    }
    private rebuildInvokeHandler(): void {
        const invokeHandlers = this.invokeHandlers;
        let next = this.defaultInvokeHandler;
        const n = invokeHandlers.length;
        for (let i = n - 1; i >= 0; --i) {
            next = this.getNextInvokeHandler(invokeHandlers[i], next);
        }
        this.firstInvokeHandler = next;
    }
    private rebuildIOHandler(): void {
        const ioHandlers = this.ioHandlers;
        let next = this.defaultIOHandler;
        const n = ioHandlers.length;
        for (let i = n - 1; i >= 0; --i) {
            next = this.getNextIOHandler(ioHandlers[i], next);
        }
        this.firstIOHandler = next;
    }
    public get invokeHandler(): NextInvokeHandler {
        return this.firstInvokeHandler;
    }
    public get ioHandler(): NextIOHandler {
        return this.firstIOHandler;
    }
    public addInvokeHandler(handler: InvokeHandler): void {
        this.invokeHandlers.push(handler);
        this.rebuildInvokeHandler();
    }
    public addIOHandler(handler: IOHandler): void {
        this.ioHandlers.push(handler);
        this.rebuildIOHandler();
    }
    public removeInvokeHandler(handler: InvokeHandler): void {
        const index = this.invokeHandlers.indexOf(handler);
        if (index >= 0) {
            this.invokeHandlers.splice(index, 1);
            this.rebuildInvokeHandler();
        }
    }
    public removeIOHandler(handler: IOHandler): void {
        const index = this.ioHandlers.indexOf(handler);
        if (index >= 0) {
            this.ioHandlers.splice(index, 1);
            this.rebuildIOHandler();
        }
    }
}