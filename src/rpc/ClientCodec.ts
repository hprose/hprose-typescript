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
| hprose/rpc/ClientCodec.ts                                |
|                                                          |
| ClientCodec for TypeScript.                              |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ClientContext } from './ClientContext';

export interface ClientCodec {
    encode(name: string, args: any[], context: ClientContext): Uint8Array;
    decode(response: Uint8Array, context: ClientContext): any;
}