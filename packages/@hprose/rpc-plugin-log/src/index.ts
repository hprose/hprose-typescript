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
| LastModified: Jan 30, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from '@hprose/io';
import { Context, NextIOHandler, NextInvokeHandler } from '@hprose/rpc-core';

export class Log {
    public static async ioHandler(request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> {
        console.log(ByteStream.toString(request));
        const response = await next(request, context);
        console.log(ByteStream.toString(response));
        return response;
    }
    public static async invokeHandler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
        const a = JSON.stringify(args);
        const result = await next(name, args, context);
        console.log(`${name}(${a.substring(1, a.length - 1)}) = ${JSON.stringify(result)}`);
        return result;
    }
}