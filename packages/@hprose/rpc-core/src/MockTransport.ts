/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| MockTransport.ts                                         |
|                                                          |
| MockTransport for TypeScript.                            |
|                                                          |
| LastModified: Feb 27, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { Client, Transport } from './Client';
import { parseURI } from './Utils';
import { MockAgent } from './MockAgent';

export class MockTransport implements Transport {
    public static readonly schemes: string[] = ['mock'];
    async transport(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const uri = parseURI(context.uri);
        return MockAgent.handler(uri.hostname, request);
    }
    async abort(): Promise<void> { }
}

Client.register('mock', MockTransport);

declare module '@hprose/rpc-core' {
    export interface Client {
        mock: MockTransport;
    }
}