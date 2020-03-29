/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| HttpHandler.ts                                           |
|                                                          |
| HttpHandler for TypeScript.                              |
|                                                          |
| LastModified: Mar 29, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import * as http from 'http';
import * as https from 'https';
import { isIPv6 } from 'net';
import * as fs from 'fs';
import { Service, ServiceContext, TimeoutError, Handler } from '@hprose/rpc-core';
import { ByteStream } from '@hprose/io';

const lastModified = (new Date()).toUTCString();
const etag = '"' + Math.floor(Math.random() * 2147483647).toString(16) +
    ':' + Math.floor(Math.random() * 2147483647).toString(16) + '"';

export interface HttpServiceContext extends ServiceContext {
    readonly request: http.IncomingMessage;
    readonly response: http.ServerResponse;
    readonly handler: HttpHandler;
}

export class HttpHandler implements Handler {
    public static serverTypes: Function[] = [http.Server, https.Server];
    public p3p: boolean = true;
    public get: boolean = true;
    public crossDomain: boolean = true;
    public timeout: number = 30000;
    public httpHeaders: http.OutgoingHttpHeaders = Object.create(null);
    private origins: { [origin: string]: boolean } = Object.create(null);
    private originCount: number = 0;
    private _crossDomainXmlFile: string = '';
    private _crossDomainXmlContent: Buffer = Buffer.alloc(0);
    private _clientAccessPolicyXmlFile: string = '';
    private _clientAccessPolicyXmlContent: Buffer = Buffer.alloc(0);
    public onclose?: (request: http.IncomingMessage) => void;
    public onerror?: (error: Error) => void;
    constructor(public readonly service: Service) { }
    public bind(server: http.Server | https.Server): void {
        server.on('request', this.handler);
        server.on('error', (error: Error) => {
            if (this.onerror) this.onerror(error);
        });
    }
    protected crossDomainXmlHandler(request: http.IncomingMessage, response: http.ServerResponse): boolean {
        if (request.url && request.url.toLowerCase().endsWith('/crossdomain.xml')) {
            if (request.headers['if-modified-since'] === lastModified &&
                request.headers['if-none-match'] === etag) {
                response.statusCode = 304;
            } else {
                response.setHeader('Last-Modified', lastModified);
                response.setHeader('Etag', etag);
                response.setHeader('Content-Type', 'text/xml');
                response.setHeader('Content-Length', this._crossDomainXmlContent.length);
                response.write(this._crossDomainXmlContent);
            }
            response.end();
            return true;
        }
        return false;
    }

    protected clientAccessPolicyXmlHandler(request: http.IncomingMessage, response: http.ServerResponse): boolean {
        if (request.url && request.url.toLowerCase().endsWith('/clientaccesspolicy.xml')) {
            if (request.headers['if-modified-since'] === lastModified &&
                request.headers['if-none-match'] === etag) {
                response.statusCode = 304;
            } else {
                response.setHeader('Last-Modified', lastModified);
                response.setHeader('Etag', etag);
                response.setHeader('Content-Type', 'text/xml');
                response.setHeader('Content-Length', this._clientAccessPolicyXmlContent.length);
                response.write(this._clientAccessPolicyXmlContent);
            }
            response.end();
            return true;
        }
        return false;
    }

    private setHeader(response: http.ServerResponse, headers: http.OutgoingHttpHeaders): void {
        if (headers) {
            for (const name in headers) {
                const value = headers[name];
                if (value !== undefined) {
                    response.setHeader(name, value);
                }
            }
        }
    }

    protected sendHeader(request: http.IncomingMessage, response: http.ServerResponse, context: ServiceContext): void {
        if ('httpStatusCode' in context) {
            response.statusCode = Number(context['httpStatusCode']);
        } else {
            response.statusCode = 200;
        }
        response.setHeader('Content-Type', 'text/plain');
        if (this.p3p) {
            response.setHeader('P3P',
                'CP="CAO DSP COR CUR ADM DEV TAI PSA PSD IVAi IVDi ' +
                'CONi TELo OTPi OUR DELi SAMi OTRi UNRi PUBi IND PHY ONL ' +
                'UNI PUR FIN COM NAV INT DEM CNT STA POL HEA PRE GOV"');
        }
        if (this.crossDomain) {
            const origin = request.headers['origin'];
            if (typeof origin === 'string' && origin !== 'null') {
                if (this.originCount === 0 || this.origins[origin]) {
                    response.setHeader('Access-Control-Allow-Origin', origin);
                    response.setHeader('Access-Control-Allow-Credentials', 'true');
                }
            } else {
                response.setHeader('Access-Control-Allow-Origin', '*');
            }
        }
        this.setHeader(response, this.httpHeaders);
        this.setHeader(response, context['httpResponseHeaders']);
    }

    protected end(data: Uint8Array, response: http.ServerResponse): void {
        response.setHeader('Content-Length', data.length);
        response.end(Buffer.from(data.buffer, data.byteOffset, data.length));
    }

    public addAccessControlAllowOrigin(origin: string): void {
        if (!this.origins[origin]) {
            this.origins[origin] = true;
            this.originCount++;
        }
    }

    public removeAccessControlAllowOrigin(origin: string): void {
        if (this.origins[origin]) {
            delete this.origins[origin];
            this.originCount--;
        }
    }

    public get crossDomainXmlFile(): string {
        return this._crossDomainXmlFile;
    }

    public set crossDomainXmlFile(value: string) {
        this._crossDomainXmlFile = value;
        this._crossDomainXmlContent = fs.readFileSync(this._crossDomainXmlFile);
    }

    public get crossDomainXmlContent(): Buffer {
        return this._crossDomainXmlContent;
    }

    public set crossDomainXmlContent(value: Buffer) {
        this._crossDomainXmlFile = '';
        this._crossDomainXmlContent = value;
    }

    public get clientAccessPolicyXmlFile(): string {
        return this._clientAccessPolicyXmlFile;
    }

    public set clientAccessPolicyXmlFile(value: string) {
        this._clientAccessPolicyXmlFile = value;
        this._clientAccessPolicyXmlContent = fs.readFileSync(this._clientAccessPolicyXmlFile);
    }

    public get clientAccessPolicyXmlContent(): Buffer {
        return this._clientAccessPolicyXmlContent;
    }

    public set clientAccessPolicyXmlContent(value: Buffer) {
        this._clientAccessPolicyXmlFile = '';
        this._clientAccessPolicyXmlContent = value;
    }

    public handler = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<void> => {
        const context = new ServiceContext(this.service);
        context.request = request;
        context.response = response;
        context.remoteAddress = {
            'family': request.socket.remoteFamily,
            'address': request.socket.remoteAddress,
            'port': request.socket.remotePort
        };
        context.localAddress = {
            'family': isIPv6(request.socket.localAddress) ? 'IPv6' : 'IPv4',
            'address': request.socket.localAddress,
            'port': request.socket.localPort
        };
        context.handler = this;
        context['httpRequestHeaders'] = request.headers;
        const size = Number(request.headers['content-length']);
        if (size > this.service.maxRequestLength) {
            response.statusCode = 413;
            response.statusMessage = 'Request Entity Too Large';
            response.end();
            return Promise.resolve();
        }
        if (this.timeout > 0) {
            request.setTimeout(this.timeout, () => {
                request.destroy(new TimeoutError());
            });
        }
        return new Promise<void>((resolve, reject) => {
            const instream = size ? new ByteStream(size) : new ByteStream();
            const ondata = function (chunk: Buffer) {
                if (instream.length + chunk.length > size) {
                    request.off('data', ondata);
                    response.statusCode = 413;
                    response.statusMessage = 'Request Entity Too Large';
                    response.end();
                    return resolve();
                }
                instream.write(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.length));
            };
            request.on('data', ondata);
            request.on('end', async () => {
                if (request.method === 'GET') {
                    if (this._clientAccessPolicyXmlContent.length > 0
                        && this.clientAccessPolicyXmlHandler(request, response)) {
                        return resolve();
                    }
                    if (this._crossDomainXmlContent.length > 0
                        && this.crossDomainXmlHandler(request, response)) {
                        return resolve();
                    }
                    if (!this.get) {
                        response.statusCode = 403;
                        response.statusMessage = 'Forbidden';
                        return resolve();
                    }
                }
                let result = await this.service.handle(instream.takeBytes(), context);
                try {
                    this.sendHeader(request, response, context);
                }
                catch (e) {
                    return reject(e);
                }
                this.end(result, response);
                resolve();
            });
            request.on('error', (error: Error) => {
                if (this.onerror) this.onerror(error);
                reject(error);
            });
            request.on('close', () => {
                if (this.onclose) this.onclose(request);
                reject();
            });
        });
    }
}

Service.register('http', HttpHandler);

declare module '@hprose/rpc-core' {
    export interface HttpHandler {
        p3p: boolean;
        get: boolean;
        crossDomain: boolean;
        crossDomainXmlFile: string;
        crossDomainXmlContent: Buffer;
        clientAccessPolicyXmlFile: string;
        clientAccessPolicyXmlContent: Buffer;
        onclose?: (request: http.IncomingMessage) => void;
        onerror?: (error: Error) => void;
        bind(server: http.Server | https.Server): void;
        addAccessControlAllowOrigin(origin: string): void;
        removeAccessControlAllowOrigin(origin: string): void;
        handler(request: http.IncomingMessage, response: http.ServerResponse): Promise<void>;
    }
    export interface Service {
        http: HttpHandler;
    }
}