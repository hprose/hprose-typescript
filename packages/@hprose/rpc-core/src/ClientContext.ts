/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ClientContext.ts                                         |
|                                                          |
| ClientContext for TypeScript.                            |
|                                                          |
| LastModified: Feb 24, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { Client } from './Client';

export class ClientContext extends Context {
    public client!: Client;
    public uri!: string;
    public returnType?: Function | null;
    public readonly requestHeaders: { [name: string]: any } = Object.create(null);
    public readonly responseHeaders: { [name: string]: any } = Object.create(null);
    public init(client: Client, returnType?: Function | null): void {
        this.client = client;
        const uris = client.uris;
        this.uri = (uris.length > 0) ? uris[0] : '';
        this.returnType = returnType;
        this.copy(client.requestHeaders, this.requestHeaders);
    }
}