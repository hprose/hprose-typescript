/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| UdpTransport.ts                                          |
|                                                          |
| UdpTransport for TypeScript.                             |
|                                                          |
| LastModified: Jan 31, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import * as dgram from 'dgram';
import { parse } from 'url';
import { Client, Context, Transport, TimeoutError, Deferred, defer, crc32 } from '@hprose/rpc-core';
import { fromUint8Array } from '@hprose/io';

export class UdpTransport implements Transport {
    private counter: number = 0;
    private results: { [uri: string]: { [index: number]: Deferred<Uint8Array> } } = Object.create(null);
    private sockets: { [uri: string]: Promise<dgram.Socket> } = Object.create(null);
    public compress: boolean = false;
    public timeout: number = 30000;
    private async getSocket(uri: string): Promise<dgram.Socket> {
        let socket = await this.sockets[uri];
        if (socket !== undefined) {
            return socket;
        }
        const udp = defer<dgram.Socket>();
        const parser = parse(uri);
        const protocol = parser.protocol;
        let type: dgram.SocketType = 'udp4';
        switch (protocol) {
            case 'udp:':
            case 'udp4:':
                break;
            case 'udp6:':
                type = 'udp6';
                break;
            default:
                throw new Error('unsupported ' + protocol + ' protocol');
        }
        socket = dgram.createSocket(type);
        socket.on('listening', () => {
            udp.resolve(socket);
        });
        socket.on('message', async (msg: Buffer) => {
            const crc = msg.readInt32BE(0);
            const header = msg.subarray(4, 8);
            if (crc32(header) !== crc) return;
            const bodyLength = msg.readUInt16BE(4);
            if (bodyLength !== msg.length - 8) return;
            const index = msg.readUInt16BE(6);
            const response = new Uint8Array(msg.buffer, msg.byteOffset + 8, bodyLength);
            const result = this.results[uri][index];
            delete this.results[uri][index];
            if (result) {
                if ((index & 0x8000) === 0x8000) {
                    result.reject(new Error(fromUint8Array(response)));
                }
                else {
                    result.resolve(response);
                }
            }
        });
        const onerror = (error?: Error) => {
            const results = this.results[uri];
            if (results) {
                for (const index in results) {
                    const result = results[index];
                    result.reject(error);
                    delete results[index];
                }
            }
            delete this.sockets[uri];
        };
        socket.on('error', onerror);
        socket.on('close', () => onerror(new Error('closed')));
        socket.bind();
        this.sockets[uri] = udp.promise;
        return udp.promise;
    }
    public async transport(request: Uint8Array, context: Context): Promise<Uint8Array> {
        if (request.length > 65499) {
            throw new Error('request too large');
        }
        const uri: string = context.uri;
        const index = (this.counter < 0x7FFF) ? ++this.counter : this.counter = 0;
        const result = defer<Uint8Array>();
        const socket = await this.getSocket(uri);
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
        const parser = parse(uri);
        const n = request.length;
        const header = Buffer.allocUnsafe(8);
        header.writeUInt16BE(n, 4);
        header.writeUInt16BE(index, 6);
        const crc = crc32(new Uint8Array(header.buffer, header.byteOffset + 4, 4));
        header.writeInt32BE(crc, 0);
        const body = Buffer.from(request.buffer, request.byteOffset, request.length);
        socket.send([header, body], parser.port ? parseInt(parser.port, 10) : 8412, parser.hostname, (error) => {
            if (error) {
                delete this.results[uri][index];
                result.reject(error);
            }
        });
        return result.promise;
    }
    public async abort(): Promise<void> {
        for (const uri in this.sockets) {
            const socket = this.sockets[uri];
            delete this.sockets[uri];
            if (socket) {
                (await socket).close();
            }
        }
    }
}

Client.register('udp', UdpTransport, ['udp:', 'udp4:', 'udp6:']);

declare module '@hprose/rpc-core' {
    export interface Client {
        udp: UdpTransport;
    }
}