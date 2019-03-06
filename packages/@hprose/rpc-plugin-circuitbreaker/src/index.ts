/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| index.ts                                                 |
|                                                          |
| @hprose/rpc-plugin-circuitbreaker for TypeScript.        |
|                                                          |
| LastModified: Mar 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context, NextIOHandler, NextInvokeHandler } from '@hprose/rpc-core';

export interface MockService {
    invoke(name: string, args: any[], context: Context): Promise<any>;
}

export class BreakerError extends Error {
    constructor(message: string = 'Service breaked') { super(message); }
}

export class CircuitBreaker {
    private lastFailTime: number = 0;
    private failCount: number = 0;
    public constructor(
        public readonly threshold: number = 5,
        public readonly recoverTime: number = 30000,
        public readonly mock?: MockService) {
    }
    public ioHandler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        if (this.failCount > this.threshold) {
            const interval = Date.now() - this.lastFailTime;
            if (interval < this.recoverTime) {
                throw new BreakerError();
            }
            this.failCount = this.threshold >> 1;
        }
        const response = next(request, context);
        response.then(() => {
            if (this.failCount > 0) this.failCount = 0;
        }, () => {
            this.failCount++;
            this.lastFailTime = Date.now();
        });
        return response;
    }
    public invokeHandler = async (name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        if (this.mock) {
            const mock = this.mock;
            return next(name, args, context).catch((e) => {
                if (e instanceof BreakerError) {
                    return mock.invoke(name, args, context);
                } else {
                    throw e;
                }
            });
        }
        else {
            return next(name, args, context);
        }
    }
}