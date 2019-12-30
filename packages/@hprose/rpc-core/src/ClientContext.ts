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
| LastModified: Dec 30, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context } from './Context';
import { Client } from './Client';

export class ClientContext extends Context {
    public client!: Client;
    public uri!: string;
    public returnType?: Function | null;
    public timeout!: number;
    constructor(items?: { [name: string]: any }) {
        super();
        if (!!items) {
            this.copy(items, this);
            if ('requestHeaders' in items) {
                this.copy(items['requestHeaders'], this.requestHeaders);
            }
        }
    }
    public init(client: Client, returnType?: Function | null): void {
        this.client = client;
        if (client.uris.length > 0) this.uri = client.uris[0];
        if (this.returnType === undefined) this.returnType = returnType;
        if (this.timeout === undefined) this.timeout = client.timeout;
        this.copy(client.requestHeaders, this.requestHeaders);
    }
}