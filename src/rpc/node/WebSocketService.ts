/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: http://www.hprose.com/                 |
|                   http://www.hprose.org/                 |
|                                                          |
\*________________________________________________________*/
/*--------------------------------------------------------*\
|                                                          |
| hprose/rpc/node/WebSocketService.ts                      |
|                                                          |
| hprose WebSocketService for TypeScript.                  |
|                                                          |
| LastModified: Jan 15, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Service } from '../Service';
import WebSocket from 'ws';
import * as http from 'http';
import { ServiceContext } from '../ServiceContext';
import { ByteStream } from '../../hprose.io';
import { HttpService } from './HttpService';

export class WebSocketServiceContext extends ServiceContext {
    constructor(service: Service, public websocket: WebSocket, public request: http.IncomingMessage) {
        super(service);
    }
}

export class WebSocketService extends HttpService {
    onaccept?: () => void;
    public wsHandler = (websocket: WebSocket, request: http.IncomingMessage): void => {
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
            const context = new WebSocketServiceContext(this, websocket, request);
            const result = await this.handle(instream.remains, context);
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