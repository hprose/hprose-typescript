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

import { Client, ClientContext, TimeoutError, Context, Transport } from '@hprose/rpc-core';
import { ByteStream } from '@hprose/io';

export interface HttpClientContext extends ClientContext {
    httpRequestHeaders?: { [name: string]: string | string[] };
    httpResponseHeaders?: { [name: string]: string | string[] };
}

declare const wx: any;

interface RequestTask {
    abort(): void;
}

export class HttpTransport implements Transport {
    public static readonly schemes: string[] = ['https'];
    private counter: number = 0;
    private requests: { [index: number]: RequestTask } = Object.create(null);
    public readonly httpRequestHeaders: { [name: string]: string } = Object.create(null);
    private getRequestHeaders(httpRequestHeaders?: { [name: string]: string | string[] }): { [name: string]: string } {
        const headers: { [name: string]: string } = Object.create(null);
        for (const name in this.httpRequestHeaders) {
            headers[name] = this.httpRequestHeaders[name];
        }
        if (httpRequestHeaders) {
            for (const name in httpRequestHeaders) {
                if (!httpRequestHeaders.hasOwnProperty || httpRequestHeaders.hasOwnProperty(name)) {
                    const value = httpRequestHeaders[name];
                    if (Array.isArray(value)) {
                        headers[name] = value.join(', ');
                    } else {
                        headers[name] = value;
                    }
                }
            }
        }
        return headers;
    }
    public async transport(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const result = new Promise<Uint8Array>((resolve, reject) => {
            const index = this.counter++;
            let data: ArrayBuffer;
            if (request.buffer.slice) {
                data = request.buffer.slice(request.byteOffset, request.length);
            } else {
                const bytes = new Uint8Array(request.length);
                bytes.set(request);
                data = bytes.buffer;
            }
            const header = this.getRequestHeaders((context as HttpClientContext).httpRequestHeaders);
            this.requests[index] = wx.request({
                url: context.uri,
                data,
                header,
                method: 'POST',
                dataType: 'arraybuffer',
                responseType: 'arraybuffer',
                complete: (res: any) => {
                    delete this.requests[index];
                    (context as HttpClientContext).httpResponseHeaders = res.header;
                    if (res.statusCode === undefined) {
                        reject(new Error(res.errMsg));
                    } else if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(new Uint8Array(res.data));
                    } else {
                        reject(new Error(res.statusCode + ':' + ByteStream.toString(res.data)));
                    }
                }
            });
            if (context.timeout > 0) {
                const timeoutId = setTimeout(() => {
                    reject(new TimeoutError());
                }, context.timeout);
                result.then(() => {
                    clearTimeout(timeoutId);
                }, () => {
                    clearTimeout(timeoutId);
                });
            }
        });
        return result;
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