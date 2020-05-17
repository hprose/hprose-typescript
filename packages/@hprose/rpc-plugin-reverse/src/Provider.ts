/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Provider.ts                                              |
|                                                          |
| Provider for TypeScript.                                 |
|                                                          |
| LastModified: May 17, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { MethodManager, MissingMethod, Method, MethodLike, Client, Context, InvokeManager, InvokeHandler, TimeoutError } from '@hprose/rpc-core';

export class ProviderContext extends Context {
    constructor(public readonly client: Client, public readonly method: MethodLike) { super(); }
}

export class Provider {
    private closed: boolean = true;
    public debug: boolean = false;
    public retryInterval: number = 1000;
    public onerror?: (error: Error) => void;
    private readonly methodManager: MethodManager = new MethodManager();
    private readonly invokeManager: InvokeManager;
    constructor(public readonly client: Client, id?: string) {
        client.returnTypes['!'] = Array;
        this.invokeManager = new InvokeManager(this.execute.bind(this));
        if (id) this.id = id;
        this.add(new Method(this.methodManager.getNames, '~', this.methodManager));
    }
    public get id(): string {
        if (this.client.requestHeaders['id']) {
            return this.client.requestHeaders['id'].toString();
        }
        throw new Error('client unique id not found');
    }
    public set id(value: string) {
        this.client.requestHeaders['id'] = value;
    }
    private async execute(name: string, args: any[], context: Context): Promise<any> {
        const method = (context as ProviderContext).method;
        const func = method.method;
        if (method.missing) {
            if (method.passContext) {
                return func.apply(method.target, [name, args, context]);
            }
            return func.apply(method.target, [name, args]);
        }
        if (method.passContext) {
            args.push(context)
        }
        return func.apply(method.target, args);
    }
    private async process(call: [number, string, any[]]): Promise<[number, any, string | undefined]> {
        const [index, name, args] = call;
        const method: MethodLike | undefined = this.get(name);
        try {
            if (method === undefined) {
                throw new Error('Can\'t find this method ' + name + '().');
            }
            const context = new ProviderContext(this.client, method);
            return [index, await this.invokeManager.handler(name, args, context), undefined];
        }
        catch (e) {
            return [index, undefined, this.debug ? e.stack ? e.stack : e.message : e.message];
        }
    }
    private async dispatch(calls: [number, string, any[]][]): Promise<void> {
        const n = calls.length;
        const results: Promise<[number, any, string | undefined]>[] = new Array(n);
        for (let i = 0; i < n; ++i) {
            results[i] = this.process(calls[i]);
        }
        try {
            await this.client.invoke('=', [await Promise.all(results)]);
        }
        catch (e) {
            if (!(e instanceof TimeoutError)) {
                if (this.retryInterval > 0) {
                    await new Promise((resolve, reject) => setTimeout(resolve, this.retryInterval));
                }
                if (this.onerror) {
                    this.onerror(e);
                }
            }
        }
    }
    public async listen(): Promise<void> {
        this.closed = false;
        do {
            try {
                const calls: [number, string, any[]][] = await this.client.invoke('!');
                if (!calls) return;
                this.dispatch(calls);
            }
            catch (e) {
                if (!(e instanceof TimeoutError)) {
                    if (this.retryInterval > 0) {
                        await new Promise((resolve, reject) => setTimeout(resolve, this.retryInterval));
                    }
                    if (this.onerror) {
                        this.onerror(e);
                    }
                }
            }
        } while (!this.closed);
    }
    public async close(): Promise<void> {
        this.closed = true;
        await this.client.invoke('!!');
    }
    public use(...handlers: InvokeHandler[]): this {
        this.invokeManager.use(...handlers);
        return this;
    }
    public unuse(...handlers: InvokeHandler[]): this {
        this.invokeManager.unuse(...handlers);
        return this;
    }
    public get(name: string): MethodLike | undefined {
        return this.methodManager.get(name);
    }
    public add(method: MethodLike): this {
        this.methodManager.add(method);
        return this;
    }
    public remove(name: string): this {
        this.methodManager.remove(name);
        return this;
    }
    public addFunction(f: Function, name?: string): this {
        this.methodManager.addFunction(f, name);
        return this;
    }
    public addMethod(method: Function, target: any, name?: string): this;
    public addMethod(name: string, target: any): this;
    public addMethod(...args: any[]): this {
        this.methodManager.addMethod(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addMissingMethod(fn: MissingMethod, target?: any): this {
        this.methodManager.addMissingMethod(fn, target);
        return this;
    }
    public addFunctions(functions: Function[], names?: string[]): this {
        this.methodManager.addFunctions(functions, names);
        return this;
    }
    public addMethods(methods: Function[], target: any, names?: string[]): this;
    public addMethods(names: string[], target: any): this;
    public addMethods(...args: any[]): this {
        this.methodManager.addMethods(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addInstanceMethods(target: any, prefix?: string): this {
        this.methodManager.addInstanceMethods(target, prefix);
        return this;
    }
}