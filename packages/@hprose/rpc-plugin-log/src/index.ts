/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| index.ts                                                 |
|                                                          |
| @hprose/rpc-plugin-log for TypeScript.                   |
|                                                          |
| LastModified: Feb 3, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from '@hprose/io';
import { Context, NextIOHandler, NextInvokeHandler } from '@hprose/rpc-core';

export class Log {
    private static readonly instance: Log = new Log();
    public constructor(public enabled: boolean = true) {}
    public static ioHandler(request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> {
        return Log.instance.ioHandler(request, context, next);
    }
    public static invokeHandler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
        return Log.instance.invokeHandler(name, args, context, next);
    }
    public async ioHandler(request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> {
        const enabled = (context.log === undefined) ? this.enabled : context.log;
        if (!enabled) return next(request, context);
        try {
            console.log(ByteStream.toString(request));
        }
        catch(e) {
            console.error(e);
        }
        const response = next(request, context);
        response.then(
            (value) => console.log(ByteStream.toString(value))
        ).catch(
            (reason) => console.error(reason)
        );
        return response;
    }
    public async invokeHandler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
        const enabled = (context.log === undefined) ? this.enabled : context.log;
        if (!enabled) return next(name, args, context);
        let a: string = '';
        try {
            a = JSON.stringify((args.length > 0 && context.method && context.method.passContext && !context.method.missing) ? args.slice(0, args.length - 1) : args);
        }
        catch(e) {
            console.error(e);
        }
        const result = next(name, args, context);
        result.then(
            (value) => console.log(`${name}(${a.substring(1, a.length - 1)}) = ${JSON.stringify(value)}`)
        ).catch(
            (reason) => console.error(reason)
        );
        return result;
    }
}