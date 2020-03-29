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
    private forwardHttpRequestHeaders(context: Context, clientContext: ClientContext): void {
        if ('httpRequestHeaders' in context) {
            clientContext['httpRequestHeaders'] = context['httpRequestHeaders'];
        }
    }
    private forwardHttpResponseHeaders(context: Context, clientContext: ClientContext): void {
        if ('httpResponseHeaders' in clientContext) {
            context['httpResponseHeaders'] = clientContext['httpResponseHeaders'];
        }
        if ('httpStatusCode' in clientContext) {
            context['httpStatusCode'] = clientContext['httpStatusCode'];
        }
    }
    public ioHandler = async (request: Uint8Array, context: Context, next: NextIOHandler): Promise<Uint8Array> => {
        const clientContext = new ClientContext({ timeout: this.timeout });
        clientContext.init(this.client);
        this.forwardHttpRequestHeaders(context, clientContext);
        const response = await this.client.request(request, clientContext);
        this.forwardHttpResponseHeaders(context, clientContext);
        return response;
    }
    public invokeHandler = async (name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        const clientContext = new ClientContext({ timeout: this.timeout });
        this.forwardHttpRequestHeaders(context, clientContext);
        clientContext.requestHeaders = context.requestHeaders;
        const result = await this.client.invoke(name, args, clientContext);
        context.responseHeaders = clientContext.responseHeaders;
        this.forwardHttpResponseHeaders(context, clientContext);
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