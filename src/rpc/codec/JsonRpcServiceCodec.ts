/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/rpc/codec/JsonRpcServiceCodec.ts                  |
|                                                          |
| JsonRpc ServiceCodec for TypeScript.                     |
|                                                          |
| LastModified: Jan 21, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from '../../hprose.io';
import { ServiceContext } from '../ServiceContext';
import { ServiceCodec } from '../ServiceCodec';
import { MethodLike } from '../Method';

export class JsonRpcServiceCodec implements ServiceCodec {
    public static instance: ServiceCodec = new JsonRpcServiceCodec();
    public encode(result: any, context: ServiceContext): Uint8Array {
        const response: any = {
            jsonrpc: '2.0',
            id: context['jsonrpc.id']
        };
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
    private decodeMethod(fullname: string, context: ServiceContext): MethodLike {
        const service = context.service;
        const methods = service.methods;
        const method: MethodLike | undefined = (fullname in methods) ? methods[fullname] : methods['*'];
        if (method === undefined) {
            throw new Error('Method not found');
        }
        context.missing = !!method.missing;
        context.method = method.method;
        context.obj = method.obj;
        return method;
    }
    decode(request: Uint8Array, context: ServiceContext): [ string, any[] ] {
        const call = JSON.parse(ByteStream.toString(request));
        if (call.jsonrpc !== '2.0' || !('method' in call) || !('id' in call)) {
            throw new Error('Invalid Request');
        }
        context['jsonrpc.id'] = call.id;
        const fullname = call.method;
        const method = this.decodeMethod(fullname, context);
        const args = call.params ? call.params : [];
        if (method.passContext) args.push(context);
        if (method.method.length > args.length) {
            throw new Error('Invalid params');
        }
        return [fullname, args];
    }
}