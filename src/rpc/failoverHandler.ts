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
| hprose/rpc/failoverHandler.ts                            |
|                                                          |
| hprose failoverHandler for TypeScript.                   |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client } from './Client';
import { Context } from './Context';
import { NextIOHandler, IOHandler } from './HandlerManager';
import { ClientContext } from './ClientContext';

export interface FailOverSettings {
    retry: number;
    failswitch: boolean;
    idempotent: boolean;
}

const defaultFailOverSettings: FailOverSettings = {
    retry: 10,
    failswitch: true,
    idempotent: false,
};

export function failoverHandler(
    client: Client,
    settings: FailOverSettings = defaultFailOverSettings,
    onfailure?: (round: number) => void
): IOHandler {
    let index: number = 0;
    let round: number = 0;
    let handler: IOHandler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        try {
            const result = await next(request, context);
            round = 0;
            return result;
        }
        catch (e) {
            const uris = client.uris;
            const failswitch = context.failswitch === undefined ? settings.failswitch : context.failswitch;
            const n = uris.length;
            if (failswitch) {
                if (n > 1) {
                    let i = index + 1;
                    if (i >= n) {
                        i = 0;
                        round++;
                    }
                    index = i;
                    (context as ClientContext).uri = uris[index];
                } else {
                    round++;
                }
            }
            if (onfailure) {
                onfailure(round);
            }
            const idempotent = context.idempotent === undefined ? settings.idempotent : context.idempotent;
            const retry = context.retry === undefined ? settings.retry : context.retry;
            if (context.retried === undefined) {
                context.retried = 0;
            }
            if (idempotent && context.retried < retry) {
                let interval = ++context.retried * 500;
                if (failswitch) {
                    interval -= (n - 1) * 500;
                }
                if (interval > 5000) {
                    interval = 5000;
                }
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
            throw e;
        }
    };
    return handler;
}