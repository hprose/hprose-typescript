/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Caller.ts                                                |
|                                                          |
| Caller for TypeScript.                                   |
|                                                          |
| LastModified: May 4, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Service, normalize, Context, Deferred, Method, defer, NextInvokeHandler, ServiceContext, TimeoutError } from '@hprose/rpc-core';

function makeInvoke(caller: Caller, id: string, fullname: string): () => Promise<any> {
    return function (): Promise<any> {
        return caller.invoke(id, fullname, Array.prototype.slice.call(arguments));
    };
}

function setMethods(caller: Caller, id: string, service: any, namespace: string, name: string, methods: any) {
    if (service[name] !== undefined) { return; }
    service[name] = Object.create(null);
    if (!Array.isArray(methods)) {
        methods = [methods];
    }
    namespace = namespace + name + '_';
    for (let i = 0; i < methods.length; i++) {
        const node = methods[i];
        if (typeof node === 'string') {
            service[name][node] = makeInvoke(caller, id, namespace + node);
        } else {
            for (const n in node) {
                setMethods(caller, id, service[name], namespace, n, node[n]);
            }
        }
    }
}

function useService(caller: Caller, id: string, functions: string[]): any {
    let root: any[] = normalize(functions);
    const service: any = Object.create(null);
    for (let i = 0; i < root.length; i++) {
        const node = root[i];
        if (typeof node === 'string') {
            if (service[node] === undefined) {
                service[node] = makeInvoke(caller, id, node);
            }
        } else {
            for (const name in node) {
                setMethods(caller, id, service, '', name, node[name]);
            }
        }
    }
    return service;
}

class ServiceProxyHandler implements ProxyHandler<any> {
    constructor(private client: Caller, private id: string, private namespace?: string) { }
    public get(target: any, p: PropertyKey, receiver: any): any {
        if (typeof p === 'symbol') { return undefined; }
        if (p === 'then') { return undefined; }
        if (!(p in target)) {
            target[p] = makeInvoke(this.client, this.id, this.namespace ? this.namespace + '_' + p : '' + p);
        }
        return target[p];
    }
}

export interface CallerContext extends ServiceContext {
    invoke<T>(fullname: string, args?: any[]): Promise<T>;
}

export class Caller {
    private counter: number = 0;
    protected calls: { [id: string]: [number, string, any[]][] } = Object.create(null);
    protected results: { [id: string]: { [index: number]: Deferred<any> } } = Object.create(null);
    protected responders: { [id: string]: Deferred<[number, string, any[]][]> } = Object.create(null);
    protected onlines: { [id: string]: boolean } = Object.create(null);
    public heartbeat: number = 120000;
    public timeout: number = 30000;
    constructor(public service: Service) {
        const close = new Method(this.close.bind(this), '!!');
        close.passContext = true;

        const begin = new Method(this.begin.bind(this), '!');
        begin.passContext = true;

        const end = new Method(this.end.bind(this), '=', null, [Array]);
        end.passContext = true;

        this.service.add(close)
            .add(begin)
            .add(end)
            .use(this.handler);
    }
    protected id(context: ServiceContext): string {
        if (context.requestHeaders['id']) {
            return context.requestHeaders['id'].toString();
        }
        throw new Error('Client unique id not found');
    }
    protected send(id: string, responder: Deferred<[number, string, any[]][]>): boolean {
        const calls = this.calls[id];
        if (calls) {
            if (calls.length === 0) {
                return false;
            }
            this.calls[id] = [];
            responder.resolve(calls);
            return true;
        }
        return false;
    }
    protected response(id: string): void {
        if (this.responders[id]) {
            const responder = this.responders[id];
            if (this.send(id, responder)) {
                delete this.responders[id];
            }
        }
    }
    protected stop(context: ServiceContext): string {
        const id = this.id(context);
        if (this.responders[id]) {
            const responder = this.responders[id];
            delete this.responders[id];
            responder.resolve();
        }
        return id;
    }
    protected close(context: ServiceContext): void {
        const id = this.stop(context);
        delete this.onlines[id];
    }
    protected async begin(context: ServiceContext): Promise<[number, string, any[]][]> {
        const id = this.stop(context);
        this.onlines[id] = true;
        const responder = defer<[number, string, any[]][]>();
        if (!this.send(id, responder)) {
            this.responders[id] = responder;
            if (this.heartbeat > 0) {
                const timeoutId = setTimeout(() => {
                    responder.resolve([]);
                }, this.heartbeat);
                responder.promise.then(() => {
                    clearTimeout(timeoutId);
                });
            }
        }
        return responder.promise;
    }
    protected end(results: [number, any, string][], context: ServiceContext): void {
        const id = this.id(context);
        for (let i = 0, n = results.length; i < n; ++i) {
            const [index, value, error] = results[i];
            if (this.results[id] && this.results[id][index]) {
                const result = this.results[id][index];
                delete this.results[id][index];
                if (error) {
                    result.reject(new Error(error));
                } else {
                    result.resolve(value);
                }
            }
        }
    }
    public async invoke(id: string, fullname: string, args: any[] = []): Promise<any> {
        if (args.length > 0) {
            args = await Promise.all(args);
        }
        ++this.counter;
        if (this.counter > 0x7FFFFFFF) {
            this.counter = 0;
        }
        const index = this.counter;
        const result = defer<any>();
        if (this.calls[id] === undefined) {
            this.calls[id] = [];
        }
        const call: [number, string, any[]] = [index, fullname, args];
        this.calls[id].push(call);
        if (this.results[id] === undefined) {
            this.results[id] = Object.create(null);
        }
        this.results[id][index] = result;
        this.response(id);
        if (this.timeout > 0) {
            const timeoutId = setTimeout(() => {
                const i = this.calls[id].indexOf(call);
                if (i >= 0) {
                    this.calls[id].splice(i, 1);
                }
                delete this.results[id][index];
                result.reject(new TimeoutError());
            }, this.timeout);
            result.promise.then(() => {
                clearTimeout(timeoutId);
            });
        }
        return result.promise;
    }
    public useService<T extends object>(id: string, namespace?: string): T;
    public useService(id: string, fullnames: string[]): any;
    public useService(id: string, arg?: string | string[]): any {
        let namespace: string | undefined;
        if (Array.isArray(arg)) {
            return useService(this, id, arg);
        } else {
            namespace = arg;
        }
        return new Proxy(Object.create(null), new ServiceProxyHandler(this, id, namespace));
    }
    public async useServiceAsync(id: string): Promise<any> {
        const fullnames: string[] = await this.invoke(id, '~');
        return useService(this, id, fullnames);
    }
    public exists(id: string): boolean {
        return id in this.onlines;
    }
    public idlist(): string[] {
        return Object.keys(this.onlines);
    }
    protected handler = async (name: string, args: any[], context: Context, next: NextInvokeHandler): Promise<any> => {
        (context as CallerContext).invoke = (fullname: string, args: any[] = []): Promise<any> => {
            return this.invoke(this.id(context as ServiceContext), fullname, args);
        };
        return next(name, args, context);
    }
}