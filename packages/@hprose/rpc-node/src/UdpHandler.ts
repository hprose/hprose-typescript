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
| LastModified: Feb 4, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import * as dgram from 'dgram';
import { AddressInfo } from 'net';
import { ServiceContext, Service, crc32, Handler } from '@hprose/rpc-core';

export interface UdpServiceContext extends ServiceContext {
    readonly socket: dgram.Socket;
    readonly rinfo: AddressInfo;
    readonly handler: UdpHandler;
}

export class UdpHandler implements Handler {
    public onlisten?: () => void;
    public onclose?: () => void;
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
        socket.on('listening', () => {
            if (this.onlisten) this.onlisten();
        });
    }
    public handler = (socket: dgram.Socket): void => {
        socket.on('message', async (msg: Buffer, rinfo: AddressInfo) => {
            const crc = msg.readInt32BE(0);
            const header = msg.subarray(4, 8);
            if (crc32(header) !== crc) return;
            const bodyLength = msg.readUInt16BE(4);
            const index = msg.readUInt16BE(6);
            if (bodyLength !== msg.length - 8 || (index & 0x8000) !== 0) return;
            if (bodyLength > this.service.maxRequestLength) {
                this.send(socket, Buffer.from('request too long'), index | 0x8000, rinfo);
                return;
            }
            const request = new Uint8Array(msg.buffer, msg.byteOffset + 8, bodyLength);
            const context = new ServiceContext(this.service);
            context.socket = socket;
            context.rinfo = rinfo;
            context.handler = this;
            const response = await this.service.handle(request, context);
            this.send(socket, Buffer.from(response.buffer, response.byteOffset, response.length), index, rinfo);
        });
        socket.on('close', () => {
            if (this.onclose) this.onclose();
        });
        socket.on('error', (error) => {
            if (this.onerror) this.onerror(error);
        });
    }
}

Service.register('udp', UdpHandler, [dgram.Socket]);

declare module '@hprose/rpc-core' {
    export interface Service {
        udp: UdpHandler;
    }
}