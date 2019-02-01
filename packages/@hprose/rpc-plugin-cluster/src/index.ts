/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| index.ts                                                 |
|                                                          |
| @hprose/rpc-plugin-cluster for TypeScript.               |
|                                                          |
| LastModified: Feb 1, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context, ClientContext, NextIOHandler, NextInvokeHandler } from '@hprose/rpc-core';

export interface ClusterConfig {
    retry?: number;
    idempotent?: boolean;
    onsuccess?: (context: Context) => void;
    onfailure?: (context: Context) => void;
    onretry?: (context: Context) => number;
}

export class FailoverConfig implements ClusterConfig {
    public static readonly instance: ClusterConfig = new FailoverConfig();
    public onfailure: (context: Context) => void;
    public onretry: (context: Context) => number;
    constructor(public retry: number = 10, minInterval: number = 500, maxInterval: number = 5000) {
        let index = 0;
        this.onfailure = (context: Context) => {
            const uris = context.client.uris;
            const n = uris.length;
            if (n > 1) {
                index = (index + 1) % n;
                context.uri = uris[index];
            }
        };
        this.onretry = (context: Context) => {
            context.retried++;
            let interval = (context.retried - context.client.uris.length) * minInterval;
            if (interval > maxInterval) {
                interval = maxInterval;
            }
            return interval;
        };
    }
}

export class FailtryConfig implements ClusterConfig {
    public static readonly instance: ClusterConfig = new FailtryConfig();
    public onretry: (context: Context) => number;
    constructor(public retry: number = 10, minInterval: number = 500, maxInterval: number = 5000) {
        this.onretry = (context: Context) => {
            let interval = ++context.retried * minInterval;
            if (interval > maxInterval) {
                interval = maxInterval;
            }
            return interval;
        };
    }
}

export class FailfastConfig implements ClusterConfig {
    public retry: number = 0;
    constructor(public onfailure: (context: Context) => void) { }
}

export class Cluster {
    public constructor(public config: ClusterConfig = FailoverConfig.instance) {
        if (config.retry === undefined) config.retry = 10;
        if (config.idempotent === undefined) config.idempotent = false;
    }
    public handler = async(request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const config = this.config;
        try {
            const result = await next(request, context);
            if (config.onsuccess) {
                config.onsuccess(context);
            }
            return result;
        }
        catch (e) {
            if (config.onfailure) {
                config.onfailure(context);
            }
            if (config.onretry) {
                const idempotent = context.idempotent === undefined ? config.idempotent : context.idempotent;
                const retry = context.retry === undefined ? config.retry : context.retry;
                if (context.retried === undefined) {
                    context.retried = 0;
                }
                if (idempotent && context.retried < retry) {
                    const interval = config.onretry(context);
                    if (interval > 0) {
                        return new Promise<Uint8Array>((resolve, reject) => {
                            setTimeout(() => {
                                this.handler(request, context, next)
                                    .then((result) => resolve(result))
                                    .catch((reason) => reject(reason));
                            }, interval);
                        });
                    } else {
                        return this.handler(request, context, next);
                    }
                }
            }
            throw e;
        }
    }
    public static forking(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
        const clientContext = context as ClientContext;
        const uris = clientContext.client.uris;
        const n = uris.length;
        const results: Promise<any>[] = new Array(n);
        for (let i = 0; i < n; i++) {
            const forkingContext = clientContext.clone();
            forkingContext.uri = uris[i];
            results[i] = next(name, args, forkingContext);
        }
        return new Promise<any>((resolve, reject) => {
            const reasons: Error[] = new Array(n);
            let count = n;
            results.forEach((result, index) => {
                result.then(resolve, (reason) => {
                    reasons[index] = reason;
                    if (--count === 0) {
                        reject(reasons[0]);
                    }
                });
            });
        });
    }
    public static broadcast(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
        const clientContext = context as ClientContext;
        const uris = clientContext.client.uris;
        const n = uris.length;
        const results: Promise<any>[] = new Array(n);
        for (let i = 0; i < n; i++) {
            const forkingContext = clientContext.clone();
            forkingContext.uri = uris[i];
            results[i] = next(name, args, forkingContext);
        }
        return Promise.all(results);
    }
}