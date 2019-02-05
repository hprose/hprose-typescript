/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| SocketTransport.ts                                       |
|                                                          |
| SocketTransport for TypeScript.                          |
|                                                          |
| LastModified: Feb 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import * as net from 'net';
import * as tls from 'tls';
import { parse } from 'url';
import { ByteStream, fromUint8Array } from '@hprose/io';
import { Transport, Deferred, crc32, defer, Context, TimeoutError, Client } from '@hprose/rpc-core';

export class SocketTransport implements Transport {
    public static readonly schemes: string[] = ['tcp', 'tcp4', 'tcp6', 'tls', 'tls4', 'tls6', 'ssl', 'ssl4', 'ssl6', 'unix'];
    private counter: number = 0;
    private results: { [uri: string]: { [index: number]: Deferred<Uint8Array> } } = Object.create(null);
    private sockets: { [uri: string]: Promise<net.Socket> } = Object.create(null);
    public noDelay: boolean = true;
    public keepAlive: boolean = true;
    public timeout: number = 30000;
    public options: tls.SecureContextOptions = Object.create(null);
    private connect(uri: string): net.Socket {
        const parser = parse(uri);
        const protocol = parser.protocol;
        switch (protocol) {
            case 'tcp:':
            case 'tcp4:':
            case 'tcp6:':
            case 'tls:':
            case 'tls4:':
            case 'tls6:':
            case 'ssl:':
            case 'ssl4:':
            case 'ssl6:': {
                const options: net.TcpNetConnectOpts = Object.create(null);
                options.host = parser.hostname;
                options.port = parser.port ? parseInt(parser.port, 10) : 8412;
                switch (protocol) {
                    case 'tcp4:':
                    case 'tls4:':
                    case 'ssl4:': {
                        options.family = 4;
                        break;
                    }
                    case 'tcp6:':
                    case 'tls6:':
                    case 'ssl6:': {
                        options.family = 6;
                        break;
                    }
                }
                switch (protocol) {
                    case 'tcp:':
                    case 'tcp4:':
                    case 'tcp6:': {
                        return net.connect(options);
                    }
                    default: {
                        const tlsOptions: tls.ConnectionOptions = options;
                        for (const key in this.options) {
                            if (!this.options.hasOwnProperty || this.options.hasOwnProperty(key)) {
                                (tlsOptions as any)[key] = (this.options as any)[key];
                            }
                        }
                        return tls.connect(tlsOptions);
                    }
                }
            }
            case 'unix': {
                const options: net.IpcNetConnectOpts = Object.create(null);
                if (parser.path) {
                    options.path = parser.path;
                } else {
                    throw new Error('invalid unix path');
                }
                return net.connect(options);
            }
            default:
                throw new Error('unsupported ' + protocol + ' protocol');
        }
    }
    private receive(uri: string, socket: net.Socket): void {
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
                    if (crc32(header) !== crc || (header[0] & 0x80) === 0) {
                        socket.removeListener('data', ondata);
                        socket.destroy(new Error('invalid response'));
                        return;
                    }
                    instream.reset();
                    bodyLength = instream.readInt32BE() & 0x7FFFFFFF;
                    index = instream.readInt32BE();
                }
                if ((bodyLength >= 0) && ((instream.length - headerLength) >= bodyLength)) {
                    const response = instream.read(bodyLength);
                    instream.trunc();
                    bodyLength = -1;
                    const has_error = (index & 0x80000000) !== 0;
                    index &= 0x7FFFFFFF;
                    const result = this.results[uri][index];
                    delete this.results[uri][index];
                    if (result) {
                        if (has_error) {
                            result.reject(new Error(fromUint8Array(response)));
                            socket.end();
                        }
                        else {
                            result.resolve(response);
                        }
                    }
                } else {
                    break;
                }
            }
        };
        socket.on('data', ondata);
    }
    private async getSocket(uri: string): Promise<net.Socket> {
        let socket = await this.sockets[uri];
        if (socket !== undefined && socket.destroyed) {
            return socket;
        }
        const conn = defer<net.Socket>();
        socket = this.connect(uri);
        socket.setNoDelay(this.noDelay);
        socket.setKeepAlive(this.keepAlive);
        socket.on('connect', () => {
            conn.resolve(socket);
        });
        this.receive(uri, socket);
        const onerror = async (error?: Error) => {
            const results = this.results[uri];
            if (results) {
                for (const index in results) {
                    const result = results[index];
                    result.reject(error);
                    delete results[index];
                }
            }
            (await this.sockets[uri]).destroy();
            delete this.sockets[uri];
        };
        socket.on('error', onerror);
        socket.on('close', (had_error: boolean) => {
            if (had_error) return;
            onerror(new Error('connection closed'));
        });
        this.sockets[uri] = conn.promise;
        return conn.promise;
    }
    public async transport(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const uri: string = context.uri;
        if (this.results[uri] === undefined) {
            this.results[uri] = Object.create(null);
        }
        const index = (this.counter < 0x7FFFFFFF) ? ++this.counter : this.counter = 0;
        const result = defer<Uint8Array>();
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
        const socket: net.Socket = await this.getSocket(uri);
        const n = request.length;
        const header = new Buffer(12);
        header.writeInt32BE(n | 0x80000000, 4);
        header.writeInt32BE(index, 8);
        const crc = crc32(header.subarray(4, 12));
        header.writeInt32BE(crc, 0);
        socket.write(header);
        socket.write(Buffer.from(request.buffer, request.byteOffset, request.length));
        return result.promise;
    }
    public async abort(): Promise<void> {
        for (const uri in this.sockets) {
            const sockets = this.sockets[uri];
            delete this.sockets[uri];
            if (sockets) {
                (await sockets).end();
            }
        }
    }
}

Client.register('socket', SocketTransport);

declare module '@hprose/rpc-core' {
    export interface Client {
        socket: SocketTransport;
    }
}