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
| LastModified: Feb 3, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { MethodManager, MissingMethod, Method, MethodLike, Client } from '@hprose/rpc-core';

export class Provider {
    public debug: boolean = false;
    public onerror?: (error: Error) => void;
    private methodManager: MethodManager = new MethodManager();
    constructor(public readonly client: Client, id?: string) {
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
    private async execute(call: [number, string, any[]]): Promise<[number, any, string | undefined]> {
        const [index, name, args] = call;
        const method: MethodLike | undefined = this.get(name);
        try {
            if (method === undefined) {
                throw new Error('Can\'t find this method ' + name + '().');
            }
            return [index, await method.method.apply(method.obj, method.missing ? [name, args] : args), undefined];
        }
        catch (e) {
            return [index, undefined, this.debug ? e.stack ? e.stack : e.message : e.message];
        }
    }
    private async dispatch(calls: [number, string, any[]][]): Promise<void> {
        const n = calls.length;
        const results: Promise<[number, any, string | undefined]>[] = new Array(n);
        for (let i = 0; i < n; ++i) {
            results[i] = this.execute(calls[i]);
        }
        try {
            await this.client.invoke('=', results);
        }
        catch (e) {
            if (this.onerror) {
                this.onerror(e);
            }
        }
    }
    public async listen(): Promise<void> {
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
        } while (true);
    }
    public async close(): Promise<void> {
        await this.client.invoke('!!');
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