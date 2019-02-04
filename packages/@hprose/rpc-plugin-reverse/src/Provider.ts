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
| LastModified: Feb 4, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { MethodManager, MissingMethod, Method, MethodLike, Client, Context, InvokeManager, InvokeHandler } from '@hprose/rpc-core';

export class ProviderContext extends Context {
    constructor(public readonly client: Client, public readonly method: MethodLike) { super(); }
}

export class Provider {
    private closed: boolean = true;
    public debug: boolean = false;
    public onerror?: (error: Error) => void;
    private readonly methodManager: MethodManager = new MethodManager();
    private readonly invokeManager: InvokeManager;
    constructor(public readonly client: Client, id?: string) {
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
        return method.method.apply(method.target, method.missing ? method.passContext ? [name, args, context] : [name, args] : args);
    }
    private async process(call: [number, string, any[]]): Promise<[number, any, string | undefined]> {
        const [index, name, args] = call;
        const method: MethodLike | undefined = this.get(name);
        try {
            if (method === undefined) {
                throw new Error('Can\'t find this method ' + name + '().');
            }
            const context = new ProviderContext(this.client, method);
            if (!method.missing && method.passContext) args.push(context);
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
            if (this.onerror) {
                this.onerror(e);
            }
        }
    }
    public async listen(): Promise<void> {
        this.closed = false;
        do {
            try {
                const calls: [number, string, any[]][] = await this.client.invoke('!', [], { type: Array });
                if (!calls) return;
                this.dispatch(calls);
            }
            catch (e) {
                if (this.onerror) {
                    this.onerror(e);
                }
            }
        } while (this.closed);
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
    public get(fullname: string): MethodLike | undefined {
        return this.methodManager.get(fullname);
    }
    public add(method: MethodLike): this {
        this.methodManager.add(method);
        return this;
    }
    public remove(fullname: string): this {
        this.methodManager.remove(fullname);
        return this;
    }
    public addFunction(f: Function, fullname?: string): this {
        this.methodManager.addFunction(f, fullname);
        return this;
    }
    public addMethod(method: Function, target: any, fullname?: string): this;
    public addMethod(fullname: string, target: any): this;
    public addMethod(...args: any[]): this {
        this.methodManager.addMethod(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addMissingMethod(fn: MissingMethod, target?: any): this {
        this.methodManager.addMissingMethod(fn, target);
        return this;
    }
    public addFunctions(functions: Function[], fullnames?: string[]): this {
        this.methodManager.addFunctions(functions, fullnames);
        return this;
    }
    public addMethods(methods: Function[], target: any, fullnames?: string[]): this;
    public addMethods(fullnames: string[], target: any): this;
    public addMethods(...args: any[]): this {
        this.methodManager.addMethods(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addInstanceMethods(target: any, prefix?: string): this {
        this.methodManager.addInstanceMethods(target, prefix);
        return this;
    }
}