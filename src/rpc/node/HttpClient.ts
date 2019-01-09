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
| hprose/rpc/node/HttpClient.ts                            |
|                                                          |
| hprose HttpClient for TypeScript.                        |
|                                                          |
| LastModified: Jan 7, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client } from '../Client';
import { Context } from '../Context';
import { TimeoutError } from '../TimeoutError';
import { parse } from 'url';
import * as http from 'http';
import * as https from 'https';
import { getCookie, setCookie } from '../CookieManager';
import { ByteStream } from '../../hprose.io';

export class HttpClient extends Client {
    private counter: number = 0;
    private requests: { [id: number]: http.ClientRequest } = Object.create(null);
    public keepAlive: boolean = true;
    public readonly options: https.RequestOptions = Object.create(null);
    public readonly httpHeaders: http.OutgoingHttpHeaders = Object.create(null);
    private getRequestHeader(httpHeaders?: http.OutgoingHttpHeaders): http.OutgoingHttpHeaders {
        const headers: http.OutgoingHttpHeaders = Object.create(null);
        for (const name in this.httpHeaders) {
            headers[name] = this.httpHeaders[name];
        }
        if (httpHeaders) {
            for (const name in httpHeaders) {
                headers[name] = httpHeaders[name];
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
                break;
            case 'https:':
                client = https;
                secure = true;
                break;
            default:
                throw new Error('Unsupported ' + options.protocol + 'protocol');
        }
        for (const key in this.options) {
            if (this.options.hasOwnProperty && this.options.hasOwnProperty(key)) {
                (options as any)[key] = (this.options as any)[key];
            }
        }
        options.method = 'POST';
        options.headers = this.getRequestHeader(context.httpHeaders);
        options.headers['Content-Length'] = request.length;
        const cookie = getCookie(options.host, options.path, secure);
        if (cookie) {
            options.headers['Cookie'] = cookie;
        }
        return new Promise<Uint8Array>((resolve, reject) => {
            const id = this.counter++;
            const req = client.request(options, (res: http.IncomingMessage) => {
                const size = res.headers['content-length'];
                const bytes = size ? new ByteStream(parseInt(size, 10)) : new ByteStream();
                res.on('data', function(chunk: Buffer) {
                    bytes.write(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.length));
                });
                res.on('end', () => {
                    delete this.requests[id];
                    if (res.statusCode) {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            context.httpHeaders = res.headers;
                            setCookie(res.headers, options.host);
                            resolve(bytes.takeBytes());
                        } else {
                            reject(new Error(res.statusCode + ':' + res.statusMessage));
                        }
                    } else {
                        reject(new Error(bytes.toString()));
                    }
                });
                res.on('error', (err) => {
                    delete this.requests[id];
                    reject(err);
                });
            });
            this.requests[id] = req;
            req.shouldKeepAlive = this.keepAlive;
            req.setTimeout(this.timeout, () => {
                delete this.requests[id];
                reject(new TimeoutError('Transport timeout'));
            });
            req.on('error', (err) => {
                delete this.requests[id];
                reject(err);
            });
            req.on('abort', () => {
                delete this.requests[id];
                reject(new Error('Transport abort'));
            });
            req.end(Buffer.from(request.buffer, 0, request.length));
        });
    }
    public abort(): void {
        for (const id in this.requests) {
            if (this.requests[id]) {
                this.requests[id].abort();
            }
            delete this.requests[id];
        }
    }
}