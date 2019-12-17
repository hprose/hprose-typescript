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
| LastModified: Dec 17, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client, ClientContext, TimeoutError, Context, Transport } from '@hprose/rpc-core';

export interface HttpClientContext extends ClientContext {
    httpStatusCode: number;
    httpStatusText: string;
    httpRequestHeaders?: { [header: string]: number | string | string[] | undefined };
    httpResponseHeaders?: { [name: string]: string | string[] | undefined };
}

function getResponseHeaders(rawHttpHeaders: string): { [name: string]: string | string[] | undefined } {
    const httpHeaders: { [name: string]: string | string[] | undefined } = Object.create(null);
    if (rawHttpHeaders) {
        const headers = rawHttpHeaders.split('\r\n');
        for (let i = 0, n = headers.length; i < n; i++) {
            if (headers[i] !== '') {
                let [name, value] = headers[i].split(': ', 2).map((value) => { return value.trim(); });
                if (httpHeaders.hasOwnProperty ? httpHeaders.hasOwnProperty(name) : name in httpHeaders) {
                    if (Array.isArray(httpHeaders[name])) {
                        (httpHeaders[name] as string[]).push(value);
                    } else {
                        httpHeaders[name] = [httpHeaders[name] as string, value];
                    }
                } else {
                    httpHeaders[name] = value;
                }
            }
        }
    }
    return httpHeaders;
}

export class HttpTransport implements Transport {
    public static readonly schemes: string[] = ['http', 'https'];
    private counter: number = 0;
    private requests: { [index: number]: XMLHttpRequest } = Object.create(null);
    public readonly httpRequestHeaders: { [header: string]: number | string | string[] | undefined } = Object.create(null);
    public onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
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
        const index = (this.counter < 0x7FFFFFFF) ? ++this.counter : this.counter = 0;
        const xhr = new XMLHttpRequest();
        const self = this;
        this.requests[index] = xhr;
        const httpContext = context as HttpClientContext;
        let httpRequestHeaders = this.getRequestHeaders(httpContext.httpRequestHeaders);
        let result = new Promise<Uint8Array>((resolve, reject) => {
            xhr.upload.onprogress = xhr.onprogress = this.onprogress;
            xhr.upload.onerror = xhr.onerror = function (this: XMLHttpRequest, ev: ProgressEvent): any {
                delete self.requests[index];
                reject(new Error('network error'));
            };
            xhr.upload.onabort = xhr.onabort = function (this: XMLHttpRequest, ev: ProgressEvent): any {
                delete self.requests[index];
                reject(new Error('transport abort'));
            };
            xhr.upload.ontimeout = xhr.ontimeout = function (this: XMLHttpRequest, ev: ProgressEvent): any {
                delete self.requests[index];
                reject(new TimeoutError());
            };
            xhr.onload = function (this: XMLHttpRequest, ev: ProgressEvent): any {
                delete self.requests[index];
                httpContext.httpStatusCode = this.status;
                httpContext.httpStatusText = this.statusText;
                if (this.status >= 200 && this.status < 300) {
                    httpContext.httpResponseHeaders = getResponseHeaders(this.getAllResponseHeaders());
                    resolve(new Uint8Array(this.response));
                } else {
                    reject(new Error(this.status + ':' + this.statusText));
                }
            };
        });
        xhr.open('POST', context.uri, true);
        xhr.withCredentials = true;
        xhr.responseType = 'arraybuffer';
        xhr.timeout = context.timeout;
        for (const name in httpRequestHeaders) {
            xhr.setRequestHeader(name, httpRequestHeaders[name]);
        }
        if (typeof ArrayBuffer.isView === 'function') {
            xhr.send(request);
        } else if (typeof request.buffer.slice === 'function') {
            xhr.send(request.buffer.slice(request.byteOffset, request.length));
        } else {
            const bytes = new Uint8Array(request.length);
            bytes.set(request);
            xhr.send(bytes.buffer);
        }
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

declare module '@hprose/rpc-core' {
    export interface HttpTransport {
        readonly httpRequestHeaders: { [header: string]: number | string | string[] | undefined };
        onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
        transport(request: Uint8Array, context: Context): Promise<Uint8Array>;
        abort(): Promise<void>;
    }
    export interface Client {
        http: HttpTransport;
    }
}