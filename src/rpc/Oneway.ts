/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/rpc/Oneway.ts                                     |
|                                                          |
| hprose Oneway Handler for TypeScript.                    |
|                                                          |
| LastModified: Jan 7, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { NextInvokeHandler } from './HandlerManager';

export async function onewayHandler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
    const result = next(name, args, context);
    if (context.oneway) {
        return undefined;
    }
    return result;
}