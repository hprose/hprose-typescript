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
| LastModified: Dec 30, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client, ClientContext, TimeoutError, Context, Transport, defer } from '@hprose/rpc-core';
import { ByteStream } from '@hprose/io';

export interface HttpClientContext extends ClientContext {
    httpStatusCode?: number;
    httpStatusText?: string;
    httpRequestHeaders?: { [header: string]: number | string | string[] | undefined };
    httpResponseHeaders?: { [name: string]: string | string[] | undefined };
}

declare const wx: any;

interface RequestTask {
    abort(): void;
}

export class HttpTransport implements Transport {
    public static readonly schemes: string[] = ['https'];
    private counter: number = 0;
    private requests: { [index: number]: RequestTask } = Object.create(null);
    public readonly httpRequestHeaders: { [header: string]: number | string | string[] | undefined } = Object.create(null);
    private setRequestHeaders(headers: { [name: string]: string }, httpRequestHeaders: { [header: string]: number | string | string[] | undefined }) {
        for (const name in httpRequestHeaders) {
            if (!httpRequestHeaders.hasOwnProperty || httpRequestHeaders.hasOwnProperty(name)) {
                const value = httpRequestHeaders[name];
                if (value !== undefined) {
                    if (Array.isArray(value)) {
                        headers[name] = value.join(', ');
                    } else {
                        headers[name] = value + "";
                    }
                }
            }
        }
    }
    private getRequestHeaders(httpRequestHeaders?: { [header: string]: number | string | string[] | undefined }): { [name: string]: string } {
        const headers: { [name: string]: string } = Object.create(null);
        this.setRequestHeaders(headers, this.httpRequestHeaders);
        if (httpRequestHeaders) {
            this.setRequestHeaders(headers, httpRequestHeaders);
        }
        return headers;
    }
    public async transport(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const result = defer<Uint8Array>();
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
                (context as HttpClientContext).httpStatusCode = res.statusCode;
                if (res.statusCode === undefined) {
                    result.reject(new Error(res.errMsg));
                } else if (res.statusCode >= 200 && res.statusCode < 300) {
                    result.resolve(new Uint8Array(res.data));
                } else {
                    result.reject(new Error(res.statusCode + ':' + ByteStream.toString(res.data)));
                }
            }
        });
        if (context.timeout > 0) {
            const timeoutId = setTimeout(() => {
                result.reject(new TimeoutError());
            }, context.timeout);
            result.promise.then(() => {
                clearTimeout(timeoutId);
            }, () => {
                clearTimeout(timeoutId);
            });
        }
        return result.promise;
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

declare module '@hprose/rpc-core' {
    export interface HttpTransport {
        readonly httpRequestHeaders: { [header: string]: number | string | string[] | undefined };
        transport(request: Uint8Array, context: Context): Promise<Uint8Array>;
        abort(): Promise<void>;
    }
    export interface Client {
        http: HttpTransport;
    }
}