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
| LastModified: Mar 28, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context, NextIOHandler, NextInvokeHandler, Deferred, defer, TimeoutError } from '@hprose/rpc-core';

export class RateLimiter {
    private readonly interval: number;
    private next: number = Date.now();
    constructor(public readonly permitsPerSecond: number, public readonly maxPermits: number = Infinity, public readonly timeout: number = 0) {
        this.interval = 1000 / permitsPerSecond;
    }
    public async acquire(tokens: number = 1): Promise<number> {
        const now = Date.now();
        const last = this.next;
        let permits = (now - last) / this.interval - tokens;
        if (permits > this.maxPermits) {
            permits = this.maxPermits;
        }
        this.next = now - permits * this.interval;
        const delay = last - now;
        if (delay <= 0) return last;
        if (this.timeout > 0 && delay > this.timeout) {
            throw new TimeoutError();
        }
        return new Promise<number>(function (resolve) {
            setTimeout(resolve, delay, last);
        });
    }
    public ioHandler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        await this.acquire(request.length);
        return next(request, context);
    }
    public invokeHandler = async (name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        await this.acquire();
        return next(name, args, context);
    }
}

export class ConcurrentLimiter {
    private counter: number = 0;
    private tasks: Deferred<void>[] = [];
    constructor(public readonly maxConcurrentRequests: number, public readonly timeout: number = 0) { }
    public async acquire(): Promise<void> {
        if (++this.counter <= this.maxConcurrentRequests) return;
        const task = defer<void>();
        this.tasks.push(task);
        if (this.timeout > 0) {
            const timeoutId = setTimeout(() => {
                const index = this.tasks.indexOf(task);
                if (index > -1) {
                    --this.counter;
                    this.tasks.splice(index, 1);
                }
                task.reject(new TimeoutError());
            }, this.timeout);
            task.promise.then(() => {
                clearTimeout(timeoutId);
            }, () => {
                clearTimeout(timeoutId);
            });
        }
        return task.promise;
    }
    public release(): void {
        --this.counter;
        const task = this.tasks.shift();
        if (task) task.resolve();
    }
    public handler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        await this.acquire();
        try {
            return await next(request, context);
        }
        finally {
            this.release();
        }
    }
}