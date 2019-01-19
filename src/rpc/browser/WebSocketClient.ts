/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/rpc/browser/WebSocketClient.ts                    |
|                                                          |
| hprose WebSocketClient for TypeScript.                   |
|                                                          |
| LastModified: Jan 19, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client } from '../Client';
import { Context } from '../Context';
import { ByteStream } from '../../hprose.io';
import { defer, Deferred } from '../Deferred';

export class WebSocketClient extends Client {
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
                    result.reject(error);
                    delete results[index];
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
        const outstream = new ByteStream(4 + request.length);
        outstream.writeInt32BE(index);
        outstream.write(request);
        const message = outstream.takeBytes();
        if (ArrayBuffer.isView) {
            websocket.send(message);
        } else if (message.buffer.slice) {
            websocket.send(message.buffer.slice(0, message.length));
        } else {
            websocket.send(message);
        }
        return result.promise;
    }
    public async abort(): Promise<void> {
        for (const uri in this.websockets) {
            if (this.websockets[uri]) {
                (await this.websockets[uri]).close(1000);
            }
            delete this.websockets[uri];
        }
    }
}