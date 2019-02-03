/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Client.ts                                                |
|                                                          |
| Client for TypeScript.                                   |
|                                                          |
| LastModified: Feb 3, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Settings } from './Settings';
import { ClientCodec, DefaultClientCodec } from './ClientCodec';
import { Context } from './Context';
import { ClientContext } from './ClientContext';
import { InvokeManager, InvokeHandler } from './InvokeManager';
import { IOManager, IOHandler } from './IOManager';
import { normalize, parseURI } from './Utils';

function makeInvoke(client: Client, fullname: string): () => Promise<any> {
    return function (): Promise<any> {
        return client.invoke(fullname, Array.prototype.slice.call(arguments));
    };
}

function setMethods(client: Client, service: any, namespace: string, name: string, methods: any) {
    if (service[name] !== undefined) { return; }
    service[name] = Object.create(null);
    if (!Array.isArray(methods)) {
        methods = [methods];
    }
    namespace = namespace + name + '_';
    for (let i = 0; i < methods.length; i++) {
        const node = methods[i];
        if (typeof node === 'string') {
            service[name][node] = makeInvoke(client, namespace + node);
        } else {
            for (const n in node) {
                setMethods(client, service[name], namespace, n, node[n]);
            }
        }
    }
}

function useService(client: Client, functions: string[]): any {
    let root: any[] = normalize(functions);
    const service: any = Object.create(null);
    for (let i = 0; i < root.length; i++) {
        const node = root[i];
        if (typeof node === 'string') {
            if (service[node] === undefined) {
                service[node] = makeInvoke(client, node);
            }
        } else {
            for (const name in node) {
                setMethods(client, service, '', name, node[name]);
            }
        }
    }
    return service;
}

class ServiceProxyHandler implements ProxyHandler<any> {
    constructor(private client: Client, private namespace?: string) { }
    public get(target: any, p: PropertyKey, receiver: any): any {
        if (typeof p === 'symbol') { return undefined; }
        if (p === 'then') { return undefined; }
        if (!(p in target)) {
            target[p] = makeInvoke(this.client, this.namespace ? this.namespace + '_' + p : '' + p);
        }
        return target[p];
    }
}

export interface Transport {
    transport(request: Uint8Array, context: Context): Promise<Uint8Array>;
    abort(): Promise<void>;
}

export interface TransportConstructor {
    new(): Transport
}

export class Client {
    private static transports: { name: string, ctor: TransportConstructor }[] = [];
    private static protocols: { [protocol: string]: string } = Object.create(null);
    public static register(name: string, ctor: TransportConstructor, protocols: string[]): void {
        Client.transports.push({ name, ctor });
        protocols.forEach((protocol) => Client.protocols[protocol] = name);
    }
    public readonly settings: { [fullname: string]: Settings } = Object.create(null);
    public readonly requestHeaders: { [name: string]: any } = Object.create(null);
    public codec: ClientCodec = DefaultClientCodec.instance;
    private urilist: string[] = [];
    private readonly transports: { [name: string]: Transport } = Object.create(null);
    private readonly invokeManager: InvokeManager = new InvokeManager(this.call.bind(this));
    private readonly ioManager: IOManager = new IOManager(this.transport.bind(this));
    constructor(uri?: string | string[]) {
        Client.transports.forEach(({ name, ctor }) => {
            let transport = new ctor();
            this.transports[name] = transport;
            Object.defineProperty(this, name, {
                get: () => transport,
                set: (value) => {
                    transport = value;
                    this.transports[name] = value;
                },
                enumerable: false,
                configurable: false
            });
        });
        if (uri) {
            if (typeof uri === 'string') {
                this.urilist.push(uri);
            } else {
                this.urilist.push(...uri);
            }
        }
    }
    public get uris(): string[] {
        return this.urilist;
    }
    public set uris(value: string[]) {
        if (value.length > 0) {
            this.urilist = value.slice(0);
            this.urilist.sort(() => Math.random() - 0.5);
        }
    }
    public useService<T extends object>(settings?: { [name in keyof T]: Settings }): T;
    public useService<T extends object>(namespace: string, settings?: { [name in keyof T]: Settings }): T;
    public useService(fullnames: string[]): any;
    public useService(...args: any[]): any {
        let namespace: string | undefined;
        let settings: { [name in keyof any]: Settings } | undefined;
        switch (args.length) {
            case 1:
                if (Array.isArray(args[0])) {
                    return useService(this, args[0]);
                } else if (typeof args[0] === 'string') {
                    namespace = args[0];
                } else {
                    settings = args[0];
                }
                break;
            case 2:
                namespace = args[0];
                settings = args[1];
                break;
        }
        let service = Object.create(null);
        if (settings) {
            for (let name in settings) {
                let fullname = '' + name;
                if (namespace) { fullname = namespace + '_' + name; }
                this.settings[fullname] = settings[name];
                service[name] = makeInvoke(this, fullname);
            }
            return service;
        }
        return new Proxy(service, new ServiceProxyHandler(this, namespace));
    }
    public async useServiceAsync(): Promise<any> {
        const fullnames: string[] = await this.invoke('~');
        return useService(this, fullnames);
    }
    public use(...handlers: InvokeHandler[] | IOHandler[]): this {
        if (handlers.length <= 0) return this;
        switch (handlers[0].length) {
            case 4: this.invokeManager.use(...handlers as InvokeHandler[]); break;
            case 3: this.ioManager.use(...handlers as IOHandler[]); break;
            default: throw new TypeError('Invalid parameter type');
        }
        return this;
    }
    public unuse(...handlers: InvokeHandler[] | IOHandler[]): this {
        if (handlers.length <= 0) return this;
        switch (handlers[0].length) {
            case 4: this.invokeManager.unuse(...handlers as InvokeHandler[]); break;
            case 3: this.ioManager.unuse(...handlers as IOHandler[]); break;
            default: throw new TypeError('Invalid parameter type');
        }
        return this;
    }
    public async invoke(fullname: string, args: any[] = [], settings?: Settings): Promise<any> {
        if (args.length > 0) {
            args = await Promise.all(args);
        }
        const context = new ClientContext(this, fullname, settings);
        const value = await this.invokeManager.handler(fullname, args, context);
        if (settings && settings.returnContext
            || this.settings[fullname] && this.settings[fullname].returnContext) {
            return { value, context };
        }
        return value;
    }
    public async call(fullname: string, args: any[], context: Context): Promise<any> {
        const codec = this.codec;
        const request = codec.encode(fullname, args, context as ClientContext);
        const response = await this.ioManager.handler(request, context);
        return codec.decode(response, context as ClientContext);
    }
    public async transport(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const uri = parseURI(context.uri);
        const name = Client.protocols[uri.protocol];
        if (name !== undefined) {
            return this.transports[name].transport(request, context);
        }
        throw new Error(`The protocol "${uri.protocol}" is not supported.`);
    }
    public async abort(): Promise<void> {
        const results = [];
        for (const name in this.transports) {
            results.push(this.transports[name].abort());
        }
        await Promise.all(results);
    }
}