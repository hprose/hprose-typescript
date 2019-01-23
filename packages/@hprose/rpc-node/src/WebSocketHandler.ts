/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| WebSocketHandler.ts                                      |
|                                                          |
| WebSocketHandler for TypeScript.                         |
|                                                          |
| LastModified: Jan 23, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import WebSocket from 'ws';
import * as http from 'http';
import { Service, ServiceContext } from '@hprose/rpc-core';
import { ByteStream } from '@hprose/io';

export class WebSocketServiceContext extends ServiceContext {
    constructor(service: Service, public websocket: WebSocket, public request: http.IncomingMessage) {
        super(service);
    }
}

export class WebSocketHandler {
    public onaccept?: () => void;
    public onclose?: () => void;
    public onerror?: (error: Error) => void;
    constructor(public readonly service: Service) { }
    public bind(server: WebSocket.Server): void {
        server.options.perMessageDeflate = false;
        server.options.maxPayload = this.service.maxRequestLength + 4;
        server.on('connection', this.handler);
        server.on('error', (error: Error) => {
            if (this.onerror) this.onerror(error);
        });
    }
    public handler = (websocket: WebSocket, request: http.IncomingMessage): void => {
        try {
            websocket.binaryType = 'arraybuffer';
            if (this.onaccept) this.onaccept();
        }
        catch {
            websocket.close();
            return;
        }
        websocket.on('close', () => {
            if (this.onclose) this.onclose();
        });
        websocket.on('error', (error) => {
            if (this.onerror) this.onerror(error);
        });
        websocket.on('message', async (data: ArrayBuffer) => {
            const instream = new ByteStream(data);
            const index = instream.readInt32BE();
            const context = new WebSocketServiceContext(this.service, websocket, request);
            const result = await this.service.handle(instream.remains, context);
            const outstream = new ByteStream(4 + result.length);
            outstream.writeInt32BE(index);
            outstream.write(result);
            websocket.send(outstream.toBytes(), {
                binary: true,
                compress: false
            }, (error) => {
                if (error) {
                    if (this.onerror) this.onerror(error);
                }
            });
        });
    }
}


Service.register('websocket', WebSocketHandler, [WebSocket.Server]);

declare module '@hprose/rpc-core' {
    export interface Service {
        websocket: WebSocketHandler;
    }
}