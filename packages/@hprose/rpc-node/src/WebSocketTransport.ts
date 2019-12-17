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
| LastModified: Dec 17, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import * as http from 'http';
import * as https from 'https';
import WebSocket from 'ws';
import { Client, Context, Transport, TimeoutError, Deferred, defer } from '@hprose/rpc-core';
import { writeInt32BE, ByteStream, fromUint8Array } from '@hprose/io';

export class WebSocketTransport implements Transport {
    public static readonly schemes: string[] = ['ws', 'wss'];
    private counter: number = 0;
    private results: Map<WebSocket, { [index: number]: Deferred<Uint8Array> }> = new Map();
    private websockets: { [uri: string]: Promise<WebSocket> } = Object.create(null);
    public httpAgent: http.Agent = new http.Agent({ keepAlive: true });
    public httpsAgent: https.Agent = new https.Agent({ keepAlive: true });
    public options: WebSocket.ClientOptions = Object.create(null);
    public compress: boolean = false;
    private async connect(uri: string): Promise<WebSocket> {
        let websocket = await this.websockets[uri];
        if (websocket !== undefined
            && websocket.readyState !== WebSocket.CLOSING
            && websocket.readyState !== WebSocket.CLOSED) {
            return websocket;
        }
        const ws = defer<WebSocket>();
        this.options.perMessageDeflate = false;
        this.options.protocol = 'hprose';
        if (this.options.agent === undefined) {
            if (uri.toLowerCase().startsWith('https://')) {
                this.options.agent = this.httpsAgent;
            } else {
                this.options.agent = this.httpAgent;
            }
        }
        websocket = new WebSocket(uri, this.options);
        websocket.binaryType = 'arraybuffer';
        websocket.on('open', () => {
            ws.resolve(websocket);
        });
        websocket.on('message', async (data: ArrayBuffer) => {
            const instream = new ByteStream(data);
            let index = instream.readInt32BE();
            const response = instream.remains;
            const has_error = (index & 0x80000000) !== 0;
            index &= 0x7FFFFFFF;
            const results = this.results.get(websocket);
            if (results) {
                const result = results[index];
                delete results[index];
                if (has_error) {
                    if (result) {
                        result.reject(new Error(fromUint8Array(response)));
                    }
                    websocket.close();
                }
                else if (result) {
                    result.resolve(response);
                }
            }
        });
        const onerror = async (error?: Error) => {
            const results = this.results.get(websocket);
            if (results) {
                for (const index in results) {
                    const result = results[index];
                    result.reject(error);
                    delete results[index];
                }
            }
            if ((await this.websockets[uri]) === websocket) {
                delete this.websockets[uri];
            }
        };
        websocket.on('error', onerror);
        websocket.on('close', (code, reason) => {
            if (reason) {
                onerror(new Error(`${code}:${reason}`));
            } else {
                onerror(new Error(`${code}`));
            }
        });
        this.websockets[uri] = ws.promise;
        return ws.promise;
    }
    public async transport(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const uri: string = context.uri;
        const index = (this.counter < 0x7FFFFFFF) ? ++this.counter : this.counter = 0;
        const result = defer<Uint8Array>();
        const websocket = await this.connect(uri);
        if (this.results.get(websocket) === undefined) {
            this.results.set(websocket, Object.create(null));
        }
        const results = this.results.get(websocket)!;
        results[index] = result;
        if (context.timeout > 0) {
            const timeoutId = setTimeout(() => {
                delete results[index];
                result.reject(new TimeoutError());
            }, context.timeout);
            result.promise.then(() => {
                clearTimeout(timeoutId);
            }, () => {
                clearTimeout(timeoutId);
            });
        }
        const header = new Uint8Array(4);
        writeInt32BE(header, 0, index);
        websocket.send(header, {
            binary: true,
            compress: this.compress,
            fin: false,

        }, (error?: Error) => {
            if (error) {
                result.reject(error);
                delete results[index];
            }
        });
        websocket.send(request, {
            binary: true,
            compress: this.compress
        }, (error?: Error) => {
            if (error) {
                result.reject(error);
                delete results[index];
            }
        });
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

Client.register('websocket', WebSocketTransport);

declare module '@hprose/rpc-core' {
    export interface WebSocketTransport {
        httpAgent: http.Agent;
        httpsAgent: https.Agent;
        options: WebSocket.ClientOptions;
        compress: boolean;
        transport(request: Uint8Array, context: Context): Promise<Uint8Array>;
        abort(): Promise<void>;
    }
    export interface Client {
        websocket: WebSocketTransport;
    }
}