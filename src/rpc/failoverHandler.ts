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

export default function failoverHandler(
    client: Client,
    retry: number = 10,
    failswitch: boolean = true,
    idempotent: boolean = false,
    onFailure?: (round: number) => void
): IOHandler {
    let round: number = 0;
    let handler: IOHandler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        try {
            const result = await next(request, context);
            round = 0;
            return result;
        }
        catch (e) {
            const uriList = client.uriList;
            const uriIndex = client.uriIndex;
            const _failswitch = context.failswitch === undefined ? failswitch : context.failswitch;
            const n = uriList.length;
            if (_failswitch) {
                if (n > 1) {
                    let i = uriIndex + 1;
                    if (i >= n) {
                        i = 0;
                        round++;
                    }
                    client.uriIndex = i;
                } else {
                    round++;
                }
            }
            if (onFailure) {
                onFailure(round);
            }
            const _idempotent = context.idempotent === undefined ? idempotent : context.idempotent;
            const _retry = context.retry === undefined ? retry : context.retry;
            if (context.retried === undefined) {
                context.retried = 0;
            }
            if (_idempotent && context.retried < _retry) {
                let interval = ++context.retried * 500;
                if (_failswitch) {
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