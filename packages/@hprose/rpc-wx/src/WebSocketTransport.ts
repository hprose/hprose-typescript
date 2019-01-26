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
| LastModified: Jan 26, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client, Context, Transport, TimeoutError, Deferred, defer } from '@hprose/rpc-core';
import { ByteStream } from '@hprose/io';

declare const wx: any;

interface SocketTask {
    send(object: any): void;
    close(object: any): void;
    onOpen(callback: (res: { header: any }) => void): void;
    onClose(callback: () => void): void;
    onError(callback: (res: { errMsg: string }) => void): void;
    onMessage(callback: (res: { data: ArrayBuffer }) => void): void;
}

export class WebSocketTransport implements Transport {
    private counter: number = 0;
    private results: { [uri: string]: { [index: number]: Deferred<Uint8Array> } } = Object.create(null);
    private websockets: { [uri: string]: Promise<SocketTask> } = Object.create(null);
    public timeout: number = 30000;
    private async connect(uri: string): Promise<SocketTask> {
        let websocket = await this.websockets[uri];
        if (websocket !== undefined) {
            return websocket;
        }
        const ws = defer<SocketTask>();
        websocket = wx.connectSocket(uri);
        websocket.onOpen(() => ws.resolve(websocket));
        websocket.onMessage((res: { data: ArrayBuffer }) => {
            const instream = new ByteStream(res.data);
            const index = instream.readInt32BE();
            const result = this.results[uri][index];
            delete this.results[uri][index];
            if (result) {
                result.resolve(instream.remains);
            }
        });
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
        websocket.onError((res: { errMsg: string }) => onerror(new Error(res.errMsg)));
        websocket.onClose(() => onerror(new Error('websocket closed')));
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
        if (this.timeout > 0) {
            const timeoutId = setTimeout(() => {
                delete this.results[uri][index];
                result.reject(new TimeoutError());
            }, this.timeout);
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
        websocket.send({
            data: message.buffer,
            fail: (res: { errMsg: string }) => {
                delete this.results[uri][index];
                result.reject(new Error(res.errMsg));
            }
        });
        return result.promise;
    }
    public async abort(): Promise<void> {
        for (const uri in this.websockets) {
            const websocket = this.websockets[uri];
            delete this.websockets[uri];
            if (websocket) {
                (await websocket).close({code: 1000, reason: 'abort'});
            }
        }
    }
}

Client.register('websocket', WebSocketTransport, ['wss:']);

declare module '@hprose/rpc-core' {
    export interface Client {
        websocket: WebSocketTransport;
    }
}