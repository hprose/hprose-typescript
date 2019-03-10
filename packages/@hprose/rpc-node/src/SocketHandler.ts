/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| SocketHandler.ts                                         |
|                                                          |
| SocketHandler for TypeScript.                            |
|                                                          |
| LastModified: Mar 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import * as net from 'net';
import { ByteStream } from '@hprose/io';
import { ServiceContext, Service, crc32, Handler } from '@hprose/rpc-core';

export interface SocketServiceContext extends ServiceContext {
    readonly socket:  net.Socket
    readonly handler: SocketHandler;
}

export class SocketHandler implements Handler {
    public onaccept?: (socket: net.Socket) => void;
    public onclose?: (socket: net.Socket) => void;
    public onerror?: (error: Error) => void;
    constructor(public readonly service: Service) { }
    public bind(server: net.Server): void {
        server.on('connection', this.handler);
        server.on('error', (error: Error) => {
            if (this.onerror) this.onerror(error);
        });
    }
    private send(socket: net.Socket, response: Uint8Array, index: number): void {
        const n = response.length;
        const header = Buffer.allocUnsafe(12);
        header.writeInt32BE(n | 0x80000000, 4);
        header.writeInt32BE(index, 8);
        const crc = crc32(header.subarray(4, 12));
        header.writeInt32BE(crc, 0);
        socket.write(header);
        socket.write(Buffer.from(response.buffer, response.byteOffset, response.length));
    }
    private async run(socket: net.Socket, request: Uint8Array, index: number): Promise<void> {
        const context = new ServiceContext(this.service);
        context.socket = socket;
        context.address = socket.remoteAddress;
        context.port = socket.remotePort;
        context.family = socket.remoteFamily;
        context.handler = this;
        let response: Uint8Array;
        try {
            response = await this.service.handle(request, context);
        }
        catch(e) {
            index |= 0x80000000;
            response = (new ByteStream(e.message)).bytes;
        }
        this.send(socket, response, index);
    }
    private receive(socket: net.Socket): void {
        const instream = new ByteStream();
        const headerLength = 12;
        let bodyLength = -1;
        let index: number = 0;
        const ondata = (data: Buffer) => {
            const chunk = new Uint8Array(data.buffer, data.byteOffset, data.length);
            instream.write(chunk);
            while (true) {
                if ((bodyLength < 0) && (instream.length >= headerLength)) {
                    const crc = instream.readInt32BE();
                    instream.mark();
                    const header = instream.read(8);
                    if (crc32(header) !== crc || (header[0] & 0x80) === 0 || (header[4] & 0x80) !== 0) {
                        socket.removeListener('data', ondata);
                        socket.destroy(new Error('Invalid request'));
                        return;
                    }
                    instream.reset();
                    bodyLength = instream.readInt32BE() & 0x7FFFFFFF;
                    index = instream.readInt32BE();
                    if (bodyLength > this.service.maxRequestLength) {
                        socket.removeListener('data', ondata);
                        this.send(socket, (new ByteStream('Request entity too large')).bytes, index | 0x80000000);
                        socket.end();
                        return;
                    }
                }
                if ((bodyLength >= 0) && ((instream.length - headerLength) >= bodyLength)) {
                    const request = instream.read(bodyLength);
                    instream.trunc();
                    bodyLength = -1;
                    this.run(socket, request, index);
                } else {
                    break;
                }
            }
        };
        socket.on('data', ondata);
    }
    public handler = (socket: net.Socket): void => {
        try {
            if (this.onaccept) this.onaccept(socket);
        }
        catch (e) {
            socket.destroy(e);
            return;
        }
        socket.on('close', () => {
            if (this.onclose) this.onclose(socket);
        });
        socket.on('error', (error) => {
            if (this.onerror) this.onerror(error);
        });
        this.receive(socket);
    }
}

Service.register('socket', SocketHandler, [net.Server]);