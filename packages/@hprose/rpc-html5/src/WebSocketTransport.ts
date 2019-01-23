/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| WebSocketTransport.ts                                    |
|                                                          |
| WebSocketTransport for TypeScript.                       |
|                                                          |
| LastModified: Jan 23, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client, Context, Transport, TimeoutError, Deferred, defer } from '@hprose/rpc-core';
import { ByteStream } from '@hprose/io';

export class WebSocketTransport implements Transport {
    private counter: number = 0;
    private results: { [uri: string]: { [index: number]: Deferred<Uint8Array> } } = Object.create(null);
    private websockets: { [uri: string]: Promise<WebSocket> } = Object.create(null);
    private async connect(uri: string): Promise<WebSocket> {
        let websocket = await this.websockets[uri];
        if (websocket !== undefined
            && websocket.readyState !== WebSocket.CLOSING
            && websocket.readyState !== WebSocket.CLOSED) {
            return websocket;
        }
        const ws = defer<WebSocket>();
        websocket = new WebSocket(uri);
        websocket.binaryType = 'arraybuffer';
        websocket.onopen = () => ws.resolve(websocket);
        websocket.onmessage = async (event: MessageEvent) => {
            const instream = new ByteStream(event.data);
            const index = instream.readInt32BE();
            const result = this.results[uri][index];
            delete this.results[uri][index];
            if (result) {
                result.resolve(instream.remains);
            }
        };
        const onerror = (error: Error) => {
            const results = this.results[uri];
            if (results) {
                for (const index in results) {
                    const result = results[index];
                    delete results[index];
                    result.reject(error);
                }
            }
            delete this.websockets[uri];
        };
        websocket.onerror = (event: Event) => onerror(new Error('error'));
        websocket.onclose = (event: CloseEvent) => {
            if (event.reason) {
                onerror(new Error(`${event.code}:${event.reason}`));
            } else {
                onerror(new Error(`${event.code}`));
            }
        };
        this.websockets[uri] = ws.promise;
        return ws.promise;
    }
    public async transport(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const uri: string = context.uri;
        const index = (this.counter < 0x7FFFFFFF) ? ++this.counter : this.counter = 0;
        const result = defer<Uint8Array>();
        const websocket = await this.connect(uri);
        if (this.results[uri] === undefined) {
            this.results[uri] = Object.create(null);
        }
        this.results[uri][index] = result;
        if (context.timeout > 0) {
            const timeoutId = setTimeout(() => {
                delete this.results[uri][index];
                result.reject(new TimeoutError());
            }, context.timeout);
            result.promise.then(() => {
                clearTimeout(timeoutId);
            }, () => {
                clearTimeout(timeoutId);
            });
        }
        const outstream = new ByteStream(4 + request.length);
        outstream.writeInt32BE(index);
        outstream.write(request);
        const message = outstream.takeBytes();
        if (ArrayBuffer.isView) {
            websocket.send(message);
        } else {
            websocket.send(message.buffer);
        }
        return result.promise;
    }
    public async abort(): Promise<void> {
        for (const uri in this.websockets) {
            const websocket = this.websockets[uri];
            delete this.websockets[uri];
            if (websocket) {
                (await websocket).close(1000);
            }
        }
    }
}

Client.register('websocket', WebSocketTransport, ['ws:', 'wss:']);

declare module '@hprose/rpc-core' {
    export interface Client {
        websocket: WebSocketTransport;
    }
}