/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/rpc/node/SocketHandler.ts                         |
|                                                          |
| hprose SocketHandler for TypeScript.                     |
|                                                          |
| LastModified: Jan 23, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import * as net from 'net';
import { writeInt32BE, ByteStream } from '@hprose/io';
import { ServiceContext, Service, crc32 } from '@hprose/rpc-core';

export class SocketServiceContext extends ServiceContext {
    constructor(service: Service, public socket: net.Socket) {
        super(service);
    }
}

export class SocketHandler {
    public onaccept?: () => void;
    public onclose?: () => void;
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
        const header = new Uint8Array(8);
        writeInt32BE(header, 0, n | 0x80000000);
        writeInt32BE(header, 4, index);
        const crc = crc32(header);
        const outstream = new ByteStream(12 + n);
        outstream.writeInt32BE(crc);
        outstream.write(header);
        outstream.write(response);
        response = outstream.takeBytes();
        socket.write(Buffer.from(response.buffer, response.byteOffset, response.length));
    }
    private async run(socket: net.Socket, request: Uint8Array, index: number): Promise<void> {
        const context = new SocketServiceContext(this.service, socket);
        const response = await this.service.handle(request, context);
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
                        socket.destroy(new Error('invalid request'));
                        return;
                    }
                    instream.reset();
                    bodyLength = instream.readInt32BE() & 0x7FFFFFFF;
                    if (bodyLength > this.service.maxRequestLength) {
                        socket.removeListener('data', ondata);
                        socket.destroy(new Error('request too large'));
                        return;
                    }
                    index = instream.readInt32BE();
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
            if (this.onaccept) this.onaccept();
        }
        catch (e) {
            socket.destroy(e);
            return;
        }
        socket.on('close', () => {
            if (this.onclose) this.onclose();
        });
        socket.on('error', (error) => {
            if (this.onerror) this.onerror(error);
        });
        this.receive(socket);
    }
}

Service.register('socket', SocketHandler, [net.Server]);

declare module '@hprose/rpc-core' {
    export interface Service {
        socket: SocketHandler;
    }
}