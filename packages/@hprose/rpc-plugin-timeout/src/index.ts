/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| index.ts                                                 |
|                                                          |
| @hprose/rpc-plugin-timeout for TypeScript.               |
|                                                          |
| LastModified: Mar 28, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context, NextInvokeHandler, ServiceContext, TimeoutError } from '@hprose/rpc-core';

export class Timeout {
    public constructor(public timeout: number = 30000) { }
    public handler = (name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        const method = (context as ServiceContext).method;
        const timeout = method.timeout !== undefined && method.timeout > 0
            ? method.timeout
            : this.timeout;
        if (timeout <= 0) {
            return next(name, args, context);
        }
        return new Promise<any>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new TimeoutError());
            }, timeout);
            next(name, args, context).then(
                (value) => {
                    clearTimeout(timeoutId);
                    resolve(value);
                },
                (reason) => {
                    clearTimeout(timeoutId);
                    reject(reason);
                }
            );
        });
    }
}