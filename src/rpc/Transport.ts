/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/rpc/Transport.ts                                  |
|                                                          |
| Transport for TypeScript.                                |
|                                                          |
| LastModified: Jan 21, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';

export interface Transport {
    transport(request: Uint8Array, context: Context): Promise<Uint8Array>;
    abort(): Promise<void>;
}

export interface TransportConstructor {
    new(): Transport
}