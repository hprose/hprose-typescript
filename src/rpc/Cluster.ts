/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/rpc/Cluster.ts                                    |
|                                                          |
| hprose Cluster for TypeScript.                           |
|                                                          |
| LastModified: Jan 7, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { ClientContext } from './ClientContext';
import { IOHandler, NextIOHandler, NextInvokeHandler } from './HandlerManager';

export interface ClusterSettings {
    retry?: number;
    idempotent?: boolean;
    onsuccess?: (context: Context) => void;
    onfailure?: (context: Context) => void;
    onretry?: (context: Context) => number;
}

export class FailoverSettings implements ClusterSettings {
    static readonly default: ClusterSettings = new FailoverSettings();
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

export class FailbackSettings implements ClusterSettings {
    static readonly default: ClusterSettings = new FailbackSettings();
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

export class FailfastSettings implements ClusterSettings {
    public retry: number = 0;
    constructor(public onfailure: (context: Context) => void) { }
}

export function getClusterHandler(settings: ClusterSettings = FailoverSettings.default): IOHandler {
    if (settings.retry === undefined) settings.retry = 10;
    if (settings.idempotent === undefined) settings.idempotent = false;
    async function handler(request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> {
        try {
            const result = await next(request, context);
            if (settings.onsuccess) {
                settings.onsuccess(context);
            }
            return result;
        }
        catch (e) {
            if (settings.onfailure) {
                settings.onfailure(context);
            }
            if (settings.onretry) {
                const idempotent = context.idempotent === undefined ? settings.idempotent : context.idempotent;
                const retry = context.retry === undefined ? settings.retry : context.retry;
                if (context.retried === undefined) {
                    context.retried = 0;
                }
                if (idempotent && context.retried < retry) {
                    const interval = settings.onretry(context);
                    if (interval > 0) {
                        return new Promise<Uint8Array>((resolve, reject) => {
                            setTimeout(() => {
                                handler(request, context, next)
                                    .then((result) => resolve(result))
                                    .catch((reason) => reject(reason));
                            }, interval);
                        });
                    } else {
                        return handler(request, context, next);
                    }
                }
            }
            throw e;
        }
    }
    return handler;
}

export function forkingClusterHandler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
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

export function broadcastClusterHandler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
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