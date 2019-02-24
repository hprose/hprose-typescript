/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| JsonRpcClientCodec.ts                                    |
|                                                          |
| JsonRpc ClientCodec for TypeScript.                      |
|                                                          |
| LastModified: Jan 24, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from '@hprose/io';
import { ClientCodec, ClientContext } from '@hprose/rpc-core';

export class JsonRpcClientCodec implements ClientCodec {
    public static instance: ClientCodec = new JsonRpcClientCodec();
    private counter: number = 0;
    public encode(name: string, args: any[], context: ClientContext): Uint8Array {
        const request: any = {
            jsonrpc: '2.0',
            id: this.counter++,
            method: name
        };
        if (args.length > 0) {
            request.params = args;
        }
        return new ByteStream(JSON.stringify(request)).takeBytes();
    }
    public decode(response: Uint8Array, context: ClientContext): any {
        const result = JSON.parse(ByteStream.toString(response));
        if ('result' in result) {
            return result.result;
        }
        if ('error' in result) {
            const error = result.error;
            if ('code' in error) {
                throw new Error(error.code + ':' + error.message);
            }
            throw new Error(error.message);
        }
        return context.returnType === null ? null : undefined;
    }
}