/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| HttpTransport.ts                                         |
|                                                          |
| HttpTransport for TypeScript.                            |
|                                                          |
| LastModified: Mar 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { parse } from 'url';
import * as http from 'http';
import * as https from 'https';
import { ClientContext, Context, getCookie, setCookie, TimeoutError, Client, Transport } from '@hprose/rpc-core';
import { ByteStream } from '@hprose/io';

export interface HttpClientContext extends ClientContext {
    httpRequestHeaders?: http.OutgoingHttpHeaders;
    httpResponseHeaders?: http.IncomingHttpHeaders;
}

export class HttpTransport implements Transport {
    public static readonly schemes: string[] = ['http', 'https'];
    private counter: number = 0;
    private requests: { [index: number]: http.ClientRequest } = Object.create(null);
    public keepAlive: boolean = true;
    public httpAgent: http.Agent = new http.Agent({ keepAlive: true });
    public httpsAgent: https.Agent = new https.Agent({ keepAlive: true });
    public options: https.RequestOptions = Object.create(null);
    public readonly httpRequestHeaders: http.OutgoingHttpHeaders = Object.create(null);
    private getRequestHeader(httpRequestHeaders?: http.OutgoingHttpHeaders): http.OutgoingHttpHeaders {
        const headers: http.OutgoingHttpHeaders = Object.create(null);
        for (const name in this.httpRequestHeaders) {
            headers[name] = this.httpRequestHeaders[name];
        }
        if (httpRequestHeaders) {
            for (const name in httpRequestHeaders) {
                headers[name] = httpRequestHeaders[name];
            }
        }
        return headers;
    }
    public async transport(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const options: https.RequestOptions = parse(context.uri);
        let client: typeof http | typeof https;
        let secure: boolean;
        switch (options.protocol) {
            case 'http:':
                client = http;
                secure = false;
                options.agent = this.httpAgent;
                break;
            case 'https:':
                client = https;
                secure = true;
                options.agent = this.httpsAgent;
                break;
            default:
                throw new Error('unsupported ' + options.protocol + 'protocol');
        }
        for (const key in this.options) {
            if (!this.options.hasOwnProperty || this.options.hasOwnProperty(key)) {
                (options as any)[key] = (this.options as any)[key];
            }
        }
        options.method = 'POST';
        options.headers = this.getRequestHeader((context as HttpClientContext).httpRequestHeaders);
        options.headers['Content-Length'] = request.length;
        const cookie = getCookie(options.host, options.path, secure);
        if (cookie) {
            options.headers['Cookie'] = cookie;
        }
        return new Promise<Uint8Array>((resolve, reject) => {
            const index = this.counter++;
            const req = client.request(options, (res: http.IncomingMessage) => {
                const size = res.headers['content-length'];
                const instream = size ? new ByteStream(parseInt(size, 10)) : new ByteStream();
                res.on('data', function (chunk: Buffer) {
                    instream.write(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.length));
                });
                res.on('end', () => {
                    delete this.requests[index];
                    if (res.statusCode) {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            (context as HttpClientContext).httpResponseHeaders = res.headers;
                            setCookie(res.headers, options.host);
                            resolve(instream.takeBytes());
                        } else {
                            reject(new Error(res.statusCode + ':' + res.statusMessage));
                        }
                    } else {
                        reject(new Error(instream.toString()));
                    }
                });
                res.on('error', (err) => {
                    delete this.requests[index];
                    reject(err);
                });
            });
            this.requests[index] = req;
            req.shouldKeepAlive = this.keepAlive;
            req.setTimeout(context.timeout, () => {
                delete this.requests[index];
                reject(new TimeoutError());
            });
            req.on('error', (err) => {
                delete this.requests[index];
                reject(err);
            });
            req.on('abort', () => {
                delete this.requests[index];
                reject(new Error('transport abort'));
            });
            req.end(Buffer.from(request.buffer, 0, request.length));
        });
    }
    public async abort(): Promise<void> {
        for (const index in this.requests) {
            const request = this.requests[index];
            delete this.requests[index];
            if (request) {
                request.abort();
            }
        }
    }
}


Client.register('http', HttpTransport);