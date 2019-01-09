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
| hprose/rpc/ServiceCodec.ts                               |
|                                                          |
| ServiceCodec for TypeScript.                             |
|                                                          |
| LastModified: Jan 8, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ServiceContext } from './ServiceContext';

export interface ServiceCodec {
    encode(result: any, context: ServiceContext): Uint8Array;
    decode(request: Uint8Array, context: ServiceContext): [ string, any[] ];
}