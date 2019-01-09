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
| hprose/rpc/browser/HttpClient.ts                         |
|                                                          |
| hprose HttpClient for TypeScript.                        |
|                                                          |
| LastModified: Jan 9, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Client } from '../Client';
import { Context } from '../Context';
import { TimeoutError } from '../TimeoutError';
import { ClientContext } from '../ClientContext';

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
                if (typeof httpHeaders.hasOwnProperty === 'undefined'
                    && name in httpHeaders
                    || httpHeaders.hasOwnProperty(name)) {
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

export class HttpClient extends Client {
    private counter: number = 0;
    private requests: { [id: number]: XMLHttpRequest } = Object.create(null);
    public readonly httpRequestHeaders: { [name: string]: string } = Object.create(null);
    public onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    private getRequestHeaders(httpRequestHeaders?: { [name: string]: string | string[] }): { [name: string]: string } {
        const headers: { [name: string]: string } = Object.create(null);
        for (const name in this.httpRequestHeaders) {
            headers[name] = this.httpRequestHeaders[name];
        }
        if (httpRequestHeaders) {
            for (const name in httpRequestHeaders) {
                if (typeof httpRequestHeaders.hasOwnProperty === 'undefined'
                    || httpRequestHeaders.hasOwnProperty(name)) {
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
        const id = this.counter++;
        const xhr = new XMLHttpRequest();
        const client = this;
        this.requests[id] = xhr;
        let httpRequestHeaders = this.getRequestHeaders((context as HttpClientContext).httpRequestHeaders);
        let result = new Promise<Uint8Array>((resolve, reject) => {
            xhr.upload.onerror = xhr.onerror = function (this: XMLHttpRequest, ev: ProgressEvent): any {
                delete client.requests[id];
                reject(new Error('Network error'));
            };
            xhr.upload.onabort = xhr.onabort = function (this: XMLHttpRequest, ev: ProgressEvent): any {
                delete client.requests[id];
                reject(new Error('Transport abort'));
            };
            xhr.upload.ontimeout = xhr.ontimeout = function (this: XMLHttpRequest, ev: ProgressEvent): any {
                delete client.requests[id];
                reject(new TimeoutError('Transport timeout'));
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
                            this.send(request.buffer.slice(0, request.length));
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
                        delete client.requests[id];
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
        xhr.upload.onprogress = xhr.onprogress = this.onprogress;
        return result;
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