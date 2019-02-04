/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ProviderContext.ts                                       |
|                                                          |
| ProviderContext for TypeScript.                          |
|                                                          |
| LastModified: Feb 5, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client, Context, MethodLike } from '@hprose/rpc-core';

export class ProviderContext extends Context {
    constructor(public readonly client: Client, public readonly method: MethodLike) { super(); }
}