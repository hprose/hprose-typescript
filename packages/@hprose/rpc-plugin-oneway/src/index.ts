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
| LastModified: Mar 25, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context, NextInvokeHandler } from '@hprose/rpc-core';

export class Oneway {
    public static async handler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
        const result = next(name, args, context);
        if (context.oneway) {
            result.catch(()=>{});
            return undefined;
        }
        return result;
    }
}