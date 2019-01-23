/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| index.ts                                                 |
|                                                          |
| @hprose/rpc-plugin-oneway for TypeScript.                |
|                                                          |
| LastModified: Jan 23, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context, NextInvokeHandler } from '@hprose/rpc-core';

export async function onewayHandler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
    const result = next(name, args, context);
    if (context.oneway) {
        return undefined;
    }
    return result;
}