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
| hprose/rpc/onewayHandler.ts                              |
|                                                          |
| hprose onewayHandler for TypeScript.                     |
|                                                          |
| LastModified: Jan 4, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Context from './Context'
import { NextInvokeHandler } from './HandlerManager';

export default async function onewayHandler(name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> {
    const result = next(name, args, context);
    if (context.oneway) {
        return undefined;
    }
    return result;
}