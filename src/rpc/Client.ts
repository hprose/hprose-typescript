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
| hprose/rpc/Client.ts                                     |
|                                                          |
| hprose Client for TypeScript.                            |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { InvokeSettings } from './InvokeSettings';
import { ClientCodec } from './ClientCodec';
import { DefaultClientCodec } from './DefaultClientCodec';
import { Context } from './Context';
import { ClientContext } from './ClientContext';
import { HandlerManager, IOHandler, InvokeHandler } from './HandlerManager';

function makeInvoke(client: Client, fullname: string): () => Promise<any> {
    return function(): Promise<any> {
        return client.invoke(fullname, Array.prototype.slice.call(arguments));
    };
}

function normalize(functions: string[]): any[] {
    const root = [Object.create(null)];
    for (let i = 0, n = functions.length; i < n; ++i) {
        const func = functions[i].split('_');
        const n = func.length - 1;
        if (n > 0) {
            let node = root;
            for (let j = 0; j < n; j++) {
                const f = func[j];
                if (node[0][f] === undefined) {
                    node[0][f] = [Object.create(null)];
                }
                node = node[0][f];
            }
            node.push(func[n]);
        }
        root.push(functions[i]);
    }
    return root;
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
        if (!target.hasOwnProperty(p)) {
            target[p] = makeInvoke(this.client, this.namespace ? this.namespace + '_' + p : '' + p);
        }
        return target[p];
    }
}

export interface ClientSettings {
    headers?: { [name: string]: any };
    timeout?: number;
    simple?: boolean;
    utc?: boolean;
    longType?: 'number' | 'bigint' | 'string';
    dictType?: 'object' | 'map';
    nullType?: null;
    codec?: ClientCodec;
}

export abstract class Client {
    public readonly settings: { [fullname: string]: InvokeSettings } = Object.create(null);
    public readonly headers: { [name: string]: any } = Object.create(null);
    public timeout: number = 30000;
    public simple: boolean = false;
    public utc: boolean = false;
    public longType: 'number' | 'bigint' | 'string' = 'number';
    public dictType: 'object' | 'map' = 'object';
    public nullType: undefined | null = undefined;
    public codec: ClientCodec = DefaultClientCodec.instance;
    private urilist: string[] = [];
    private handlerManager: HandlerManager = new HandlerManager(this.call.bind(this), this.transport.bind(this));
    constructor(uri?: string | string[], settings?: ClientSettings) {
        if (uri) {
            if (typeof uri === 'string') uri = [uri];
            this.uris = uri;
        }
        if (settings) {
            for (const key in settings) {
                if ((settings as any)[key] !== undefined) (this as any)[key] = (settings as any)[key];
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
    public useService<T extends object>(settings?: { [name in keyof T]: InvokeSettings }): T;
    public useService<T extends object>(namespace: string, settings?: { [name in keyof T]: InvokeSettings }): T;
    public useService(functions: string[]): any;
    public useService(...args: any[]): any {
        let namespace: string | undefined;
        let settings: { [name in keyof any]: InvokeSettings } | undefined;
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
    public use(handler: InvokeHandler | IOHandler): this {
        switch (handler.length) {
            case 4: this.handlerManager.addInvokeHandler(handler as InvokeHandler); break;
            case 3: this.handlerManager.addIOHandler(handler as IOHandler); break;
            default: throw new TypeError('Invalid parameter type');
        }
        return this;
    }
    public unuse(handler: InvokeHandler | IOHandler): this {
        switch (handler.length) {
            case 4: this.handlerManager.removeInvokeHandler(handler as InvokeHandler); break;
            case 3: this.handlerManager.removeIOHandler(handler as IOHandler); break;
            default: throw new TypeError('Invalid parameter type');
        }
        return this;
    }
    public async invoke<T>(fullname: string, args: any[], settings?: InvokeSettings): Promise<T> {
        args = await Promise.all(args);
        const context = new ClientContext(this, fullname, settings);
        const invokeHandler = this.handlerManager.invokeHandler;
        return invokeHandler(fullname, args, context);
    }
    public async call(fullname: string, args: any[], context: Context): Promise<any> {
        const codec = this.codec;
        const request = codec.encode(fullname, args, context as ClientContext);
        const ioHandler = this.handlerManager.ioHandler;
        const response = await ioHandler(request, context);
        return codec.decode(response, context as ClientContext);
    }
    public abstract async transport(request: Uint8Array, context: Context): Promise<Uint8Array>;
}
