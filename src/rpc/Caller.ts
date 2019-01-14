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
| hprose/rpc/Caller.ts                                     |
|                                                          |
| hprose Caller for TypeScript.                            |
|                                                          |
| LastModified: Jan 14, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Service } from './Service';
import { Deferred, defer } from './Deferred';
import { Context } from './Context';
import { NextInvokeHandler } from './HandlerManager';
import { Method } from './Method';

export interface CallerContext extends Context {
    invoke<T>(fullname: string, args?: any[]): Promise<T>;
}

export class Caller {
    private counter: number = 0;
    protected calls: { [id: string]: [number, string, any[]][] } = Object.create(null);
    protected results: { [id: string]: { [index: number]: Deferred<any> } } = Object.create(null);
    protected responders: { [id: string]: Deferred<[number, string, any[]][]> } = Object.create(null);
    protected timers: { [id: string]: Deferred<void> } = Object.create(null);
    public messageQueueMaxLength: number = 10;
    public timeout: number = 120000;
    constructor(public service: Service) {
        const invokeBegin = new Method(this.invokeBegin, '!', this);
        invokeBegin.passContext = true;
        this.service.add(invokeBegin);

        const invokeEnd = new Method(this.invokeEnd, '=', this);
        invokeEnd.passContext = true;
        this.service.add(invokeEnd);
    }
    protected id(context: Context): string {
        if (context.requestHeaders['id']) {
            return context.requestHeaders['id'].toString();
        }
        throw new Error('client unique id not found');
    }
    protected send(id: string, responder: Deferred<[number, string, any[]][]>): boolean {
        const calls = this.calls[id];
        if (calls) {
            if (calls.length === 0) {
                return false;
            }
            this.calls[id] = [];
            responder.resolve(calls);
        } else {
            return false;
        }
        return true;
    }
    protected response(id: string): void {
        if (this.responders[id]) {
            const responder = this.responders[id];
            if (this.send(id, responder)) {
                delete this.responders[id];
            }
        }
    }
    protected async invokeBegin(context: Context): Promise<[number, string, any[]][]> {
        const id = this.id(context);
        if (this.responders[id]) {
            const responder = this.responders[id];
            delete this.responders[id];
            responder.resolve();
        }
        const responder = defer<[number, string, any[]][]>();
        if (!this.send(id, responder)) {
            if (this.timeout > 0) {
                const timeoutId = setTimeout(() => {
                    responder.resolve([]);
                }, this.timeout);
                responder.promise.then(() => {
                    clearTimeout(timeoutId);
                });
            }
            this.responders[id] = responder;
        }
        return responder.promise;
    }
    protected invokeEnd(...args: any[]): void {
        const results: ([number, any] | [number, undefined, string])[] = args.slice(0, -1);
        const context: Context = args[args.length - 1];
        setTimeout(() => {
            const id = this.id(context);
            for (let i = 0, n = results.length; i < n; ++i) {
                const result = results[i];
                switch (result.length) {
                    case 2: {
                        const [index, returnValue] = result;
                        if (this.results[id] && this.results[id][index]) {
                            this.results[id][index].resolve(returnValue);
                            delete this.results[id][index];
                        }
                        break;
                    }
                    case 3: {
                        const [index, , error] = result;
                        if (this.results[id] && this.results[id][index]) {
                            this.results[id][index].reject(new Error(error));
                            delete this.results[id][index];
                        }
                        break;
                    }
                }
            }
        }, 0);
    }
    public async invoke<T>(id: string, fullname: string, args: any[] = []): Promise<T> {
        if (args.length > 0) {
            args = await Promise.all(args);
        }
        ++this.counter;
        if (this.counter > 0x7FFFFFFF) {
            this.counter = 0;
        }
        const index = this.counter;
        const result = defer<T>();
        if (this.calls[id] === undefined) {
            this.calls[id] = [];
        }
        this.calls[id].push([index, fullname, args]);
        if (this.results[id] === undefined) {
            this.results[id] = Object.create(null);
        }
        this.results[id][index] = result;
        this.response(id);
        return result.promise;
    }
    public handler = async (name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        (context as CallerContext).invoke = <T>(fullname: string, args: any[] = []): Promise<T> => {
            return this.invoke<T>(this.id(context), fullname, args);
        };
        return next(name, args, context);
    }
}