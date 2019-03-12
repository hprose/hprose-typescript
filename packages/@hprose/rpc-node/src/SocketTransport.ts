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
| LastModified: Mar 12, 2019                               |
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
    private results: Map<net.Socket, { [index: number]: Deferred<Uint8Array> }> = new Map();
    private sockets: { [uri: string]: Promise<net.Socket> } = Object.create(null);
    public noDelay: boolean = true;
    public keepAlive: boolean = true;
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
                    const results = this.results.get(socket);
                    if (results) {
                        const result = results[index];
                        delete results[index];
                        if (has_error) {
                            if (result) {
                                result.reject(new Error(fromUint8Array(response)));
                            }
                            socket.removeListener('data', ondata);
                            socket.end();
                            return;
                        }
                        else if (result) {
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
        if (socket !== undefined && !socket.destroyed) {
            return socket;
        }
        const conn = defer<net.Socket>();
        socket = this.connect(uri);
        socket.unref();
        socket.setNoDelay(this.noDelay);
        socket.setKeepAlive(this.keepAlive);
        socket.on('connect', () => {
            conn.resolve(socket);
        });
        this.receive(uri, socket);
        const onerror = async (error?: Error) => {
            const results = this.results.get(socket);
            if (results) {
                for (const index in results) {
                    const result = results[index];
                    result.reject(error);
                    delete results[index];
                }
            }
            if ((await this.sockets[uri]) === socket) {
                (await this.sockets[uri]).destroy();
                delete this.sockets[uri];
            }
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
        const index = (this.counter < 0x7FFFFFFF) ? ++this.counter : this.counter = 0;
        const result = defer<Uint8Array>();
        const socket: net.Socket = await this.getSocket(uri);
        if (this.results.get(socket) === undefined) {
            this.results.set(socket, Object.create(null));
        }
        const results = this.results.get(socket)!;
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
        const n = request.length;
        const header = Buffer.allocUnsafe(12);
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
            const socket = this.sockets[uri];
            delete this.sockets[uri];
            if (socket) {
                (await socket).end();
            }
        }
    }
}

Client.register('socket', SocketTransport);