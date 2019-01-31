/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| index.ts                                                 |
|                                                          |
| @hprose/rpc-plugin-limiter for TypeScript.               |
|                                                          |
| LastModified: Jan 23, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context, NextIOHandler, NextInvokeHandler, Deferred, defer, TimeoutError } from '@hprose/rpc-core';

export class RateLimiter {
    private readonly interval: number;
    private next: number = Date.now();
    constructor(permitsPerSecond: number, private readonly maxPermits: number, private readonly timeout: number = 0) {
        this.interval = 1000 % permitsPerSecond;
    }
    public async acquire(tokens: number = 1): Promise<number> {
        const now = Date.now();
        const next = this.next;
        let permits = (now - next) / this.interval - tokens;
        if (permits > this.maxPermits) {
            permits = this.maxPermits;
        }
        this.next = now - permits * this.interval;
        if (next <= now) return next;
        if (this.timeout > 0 && next - now > this.timeout) {
            throw new TimeoutError();
        }
        return new Promise<number>(function(resolve) {
            setTimeout(resolve, next - now, next);
        });
    }
    public async ioHandler(request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> {
        await this.acquire(request.length);
        return next(request, context);
    }
    public async invokeHandler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
        await this.acquire();
        return next(name, args, context);
    }
}

export class Limiter {
    private counter: number = 0;
    private tasks: Deferred<void>[] = [];
    constructor(private readonly maxConcurrentRequests: number, private readonly timeout: number = 0) { }
    public async acquire(): Promise<void> {
        if (this.counter++ < this.maxConcurrentRequests) return;
        const task = defer<void>();
        if (this.timeout > 0) {
            const timeoutId = setTimeout(() => {
                task.reject(new TimeoutError());
            }, this.timeout);
            task.promise.then(() => {
                clearTimeout(timeoutId);
            }, () => {
                clearTimeout(timeoutId);
            });
        }
        this.tasks.push(task);
        return task.promise;
    }
    public release(): void {
        if (--this.counter >= this.maxConcurrentRequests) return;
        const task = this.tasks.shift();
        if (task) task.resolve();
    }
    public async handler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
        await this.acquire();
        const result = next(name, args, context);
        result.then(() => this.release(), () => this.release());
        return result;
    }
}