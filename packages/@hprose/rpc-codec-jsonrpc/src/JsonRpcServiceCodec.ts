/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| JsonRpcServiceCodec.ts                                   |
|                                                          |
| JsonRpc ServiceCodec for TypeScript.                     |
|                                                          |
| LastModified: Mar 28, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream, Tags } from '@hprose/io';
import { ServiceCodec, ServiceContext, MethodLike, DefaultServiceCodec } from '@hprose/rpc-core';

export class JsonRpcServiceCodec implements ServiceCodec {
    public static instance: ServiceCodec = new JsonRpcServiceCodec();
    public encode(result: any, context: ServiceContext): Uint8Array {
        if (!context['jsonrpc']) {
            return DefaultServiceCodec.instance.encode(result, context);
        }
        const response: any = {
            jsonrpc: '2.0',
            id: context['jsonrpc.id']
        };
        if (Object.keys(context.responseHeaders).length > 0) {
            response.headers = context.responseHeaders;
        }
        if (result instanceof SyntaxError) {
            response.error = { code: -32700, message: 'Parse error' };
        } else if (result instanceof Error) {
            switch (result.message) {
                case 'Invalid Request':
                    response.error = { code: -32600, message: 'Invalid Request' };
                    break;
                case 'Method not found':
                    response.error = { code: -32601, message: 'Method not found' };
                    break;
                case 'Invalid params':
                    response.error = { code: -32602, message: 'Invalid params' };
                    break;
                default:
                    response.error = { code: 0, message: result.message, data: result.stack };
            }
        } else {
            response.result = result;
        }
        return new ByteStream(JSON.stringify(response)).takeBytes();
    }
    private decodeMethod(name: string, context: ServiceContext): MethodLike {
        const service = context.service;
        const method: MethodLike | undefined = service.get(name);
        if (method === undefined) {
            throw new Error('Method not found');
        }
        context.method = method;
        return method;
    }
    decode(request: Uint8Array, context: ServiceContext): [string, any[]] {
        context['jsonrpc'] = (request.length > 0 && request[0] === Tags.TagOpenbrace);
        if (!context['jsonrpc']) {
            return DefaultServiceCodec.instance.decode(request, context);
        }
        const call = JSON.parse(ByteStream.toString(request));
        if (call.jsonrpc !== '2.0' || !('method' in call) || !('id' in call)) {
            throw new Error('Invalid Request');
        }
        if ('headers' in call) {
            const headers = call.headers;
            for (const name in headers) {
                context.requestHeaders[name] = headers[name];
            }
        }
        context['jsonrpc.id'] = call.id;
        const name = call.method;
        const method = this.decodeMethod(name, context);
        const args = call.params ? call.params : [];
        if (!method.missing) {
            if (method.passContext) args.push(context);
            if (method.method.length > args.length) {
                throw new Error('Invalid params');
            }
        }
        return [name, args];
    }
}