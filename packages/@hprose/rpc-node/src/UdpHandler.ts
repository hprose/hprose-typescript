/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| UdpHandler.ts                                            |
|                                                          |
| UdpHandler for TypeScript.                               |
|                                                          |
| LastModified: Mar 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import * as dgram from 'dgram';
import { AddressInfo } from 'net';
import { ServiceContext, Service, crc32, Handler } from '@hprose/rpc-core';
import { ByteStream } from '@hprose/io';

export interface UdpServiceContext extends ServiceContext {
    readonly socket: dgram.Socket;
    readonly handler: UdpHandler;
}

export class UdpHandler implements Handler {
    public onclose?: (socket: dgram.Socket) => void;
    public onerror?: (error: Error) => void;
    constructor(public readonly service: Service) { }
    public send(socket: dgram.Socket, body: Buffer, index: number, rinfo: AddressInfo) {
        const n = body.length;
        const header = Buffer.allocUnsafe(8);
        header.writeUInt16BE(n, 4);
        header.writeUInt16BE(index, 6);
        const crc = crc32(new Uint8Array(header.buffer, header.byteOffset + 4, 4));
        header.writeInt32BE(crc, 0);
        socket.send([header, body], rinfo.port, rinfo.address, (error) => {
            if (error && this.onerror) this.onerror(error);
        });
    }
    public bind(socket: dgram.Socket): void {
        this.handler(socket);
    }
    public handler = (socket: dgram.Socket): void => {
        socket.on('message', async (msg: Buffer, rinfo: AddressInfo) => {
            const crc = msg.readInt32BE(0);
            const header = msg.subarray(4, 8);
            if (crc32(header) !== crc) return;
            const bodyLength = msg.readUInt16BE(4);
            let index = msg.readUInt16BE(6);
            if (bodyLength !== msg.length - 8 || (index & 0x8000) !== 0) return;
            if (bodyLength > this.service.maxRequestLength) {
                this.send(socket, Buffer.from('Request entity too large'), index | 0x8000, rinfo);
                return;
            }
            const request = new Uint8Array(msg.buffer, msg.byteOffset + 8, bodyLength);
            const context = new ServiceContext(this.service);
            context.socket = socket;
            context.address = rinfo.address;
            context.port = rinfo.port;
            context.family = rinfo.family;
            context.handler = this;
            let response: Uint8Array;
            try {
                response = await this.service.handle(request, context);
            }
            catch(e) {
                index |= 0x8000;
                response = (new ByteStream(e.message)).bytes;
            }
            this.send(socket, Buffer.from(response.buffer, response.byteOffset, response.length), index, rinfo);
        });
        socket.on('close', () => {
            if (this.onclose) this.onclose(socket);
        });
        socket.on('error', (error) => {
            if (this.onerror) this.onerror(error);
        });
    }
}

Service.register('udp', UdpHandler, [dgram.Socket]);