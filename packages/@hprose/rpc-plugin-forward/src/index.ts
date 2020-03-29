/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| index.ts                                                 |
|                                                          |
| @hprose/rpc-plugin-forward for TypeScript.               |
|                                                          |
| LastModified: Mar 29, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Context, NextIOHandler, NextInvokeHandler, ClientContext, Client, IOHandler, InvokeHandler } from '@hprose/rpc-core';

export class Forward {
    private readonly client: Client;
    public timeout?: number;
    public constructor(uri?: string | string[]) {
        this.client = new Client(uri)
    }
    public ioHandler = (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const clientContext = new ClientContext({ timeout: this.timeout });
        clientContext.init(this.client);
        return this.client.request(request, clientContext);
    }
    public invokeHandler = async (name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        const clientContext = new ClientContext({ timeout: this.timeout });
        clientContext.requestHeaders = context.requestHeaders;
        const result = await this.client.invoke(name, args, clientContext);
        context.responseHeaders = clientContext.responseHeaders;
        return result;
    }
    public use(...handlers: InvokeHandler[] | IOHandler[]): this {
        this.client.use(...handlers);
        return this;
    }
    public unuse(...handlers: InvokeHandler[] | IOHandler[]): this {
        this.client.unuse(...handlers);
        return this;
    }
}