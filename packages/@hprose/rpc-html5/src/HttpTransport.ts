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
| LastModified: Feb 5, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client, ClientContext, TimeoutError, Context, Transport } from '@hprose/rpc-core';

export interface HttpClientContext extends ClientContext {
    httpRequestHeaders?: { [name: string]: string | string[] };
    httpResponseHeaders?: { [name: string]: string | string[] };
}

function getResponseHeaders(rawHttpHeaders: string): { [name: string]: string | string[] } {
    const httpHeaders: { [name: string]: string | string[] } = Object.create(null);
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
    public timeout: number = 30000;
    public readonly httpRequestHeaders: { [name: string]: string } = Object.create(null);
    public onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
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
        const index = this.counter++;
        const xhr = new XMLHttpRequest();
        const self = this;
        this.requests[index] = xhr;
        let httpRequestHeaders = this.getRequestHeaders((context as HttpClientContext).httpRequestHeaders);
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
            xhr.onreadystatechange = function (this: XMLHttpRequest, ev: Event): any {
                switch (this.readyState) {
                    case this.OPENED:
                        for (const name in httpRequestHeaders) {
                            this.setRequestHeader(name, httpRequestHeaders[name]);
                        }
                        if (ArrayBuffer.isView) {
                            this.send(request);
                        } else if (request.buffer.slice) {
                            this.send(request.buffer.slice(request.byteOffset, request.length));
                        } else {
                            const bytes = new Uint8Array(request.length);
                            bytes.set(request);
                            this.send(bytes.buffer);
                        }
                        break;
                    case this.HEADERS_RECEIVED:
                        (context as HttpClientContext).httpResponseHeaders = getResponseHeaders(this.getAllResponseHeaders());
                        break;
                    case this.DONE:
                        delete self.requests[index];
                        if (this.status >= 200 && this.status < 300) {
                            resolve(new Uint8Array(this.response));
                        } else {
                            reject(new Error(this.status + ':' + this.statusText));
                        }
                        break;
                }
            };
        });
        xhr.open('POST', context.uri, true);
        xhr.withCredentials = true;
        xhr.responseType = 'arraybuffer';
        xhr.timeout = this.timeout;
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
    export interface Client {
        http: HttpTransport;
    }
}