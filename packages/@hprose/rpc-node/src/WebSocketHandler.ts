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
| LastModified: Feb 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import WebSocket from 'ws';
import * as http from 'http';
import * as https from 'https';
import { Service, ServiceContext } from '@hprose/rpc-core';
import { writeInt32BE, ByteStream } from '@hprose/io';

export interface WebSocketServiceContext extends ServiceContext {
    websocket: WebSocket;
    request: http.IncomingMessage;
    handler: WebSocketHandler;
}

export class WebSocketHandler {
    public compress: boolean = false;
    public onaccept?: (websocket: WebSocket) => void;
    public onclose?: (websocket: WebSocket) => void;
    public onerror?: (error: Error) => void;
    constructor(public readonly service: Service) { }
    public bind(server: http.Server | https.Server | WebSocket.Server): void {
        if (server instanceof http.Server || server instanceof https.Server) {
            server = new WebSocket.Server({server});
        }
        server.options.perMessageDeflate = false;
        server.options.maxPayload = this.service.maxRequestLength + 4;
        server.on('connection', this.handler);
        server.on('error', (error: Error) => {
            if (this.onerror) this.onerror(error);
        });
    }
    public handler = (websocket: WebSocket, request: http.IncomingMessage): void => {
        try {
            websocket.protocol = 'hprose';
            websocket.binaryType = 'arraybuffer';
            if (this.onaccept) this.onaccept(websocket);
        }
        catch {
            websocket.close();
            return;
        }
        websocket.on('close', () => {
            if (this.onclose) this.onclose(websocket);
        });
        websocket.on('error', (error) => {
            if (this.onerror) this.onerror(error);
        });
        websocket.on('message', async (data: ArrayBuffer) => {
            const instream = new ByteStream(data);
            const index = instream.readInt32BE();
            const context = new ServiceContext(this.service);
            context.websocket = websocket;
            context.request = request;
            context.address = request.socket.remoteAddress;
            context.port = request.socket.remotePort;
            context.family = request.socket.remoteFamily;
            context.handler = this;
            const result = await this.service.handle(instream.remains, context);
            const header = new Uint8Array(4);
            writeInt32BE(header, 0, index);
            websocket.send(header, {
                binary: true,
                compress: this.compress,
                fin: false
            }, (error) => {
                if (error) {
                    if (this.onerror) this.onerror(error);
                }
            });
            websocket.send(result, {
                binary: true,
                compress: this.compress,
            }, (error) => {
                if (error) {
                    if (this.onerror) this.onerror(error);
                }
            });
        });
    }
}

Service.register('websocket', WebSocketHandler, [http.Server, https.Server, WebSocket.Server]);

declare module '@hprose/rpc-core' {
    export interface Service {
        websocket: WebSocketHandler;
    }
}