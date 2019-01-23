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
| LastModified: Jan 23, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { MethodManager, MissingFunction, MethodLike, Client } from '@hprose/rpc-core';

export class Provider {
    public debug: boolean = false;
    public readonly methods: { [fullname: string]: MethodLike } = Object.create(null);
    public onerror?: (error: Error) => void;
    private methodManager: MethodManager = new MethodManager(this.methods);
    constructor(public client: Client, id?: string) {
        if (id) this.id = id;
        this.addFunction(() => { return Object.keys(this.methods); }, '~');
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
    public async boot(): Promise<void> {
        do {
            try {
                const calls: [number, string, any[]][] = await this.client.invoke('!', [], { type: Array });
                if (!calls) return;
                setTimeout(async() => {
                    const results: any[][] = [];
                    const methods = this.methods;
                    for (let i = 0, n = calls.length; i < n; ++i) {
                        const [id, fullname, args] = calls[i];
                        const method: MethodLike | undefined = (fullname in methods) ? methods[fullname] : methods['*'];
                        try {
                            if (method === undefined) {
                                throw new Error('Can\'t find this function ' + fullname + '().');
                            }
                            results[i] = [id, (method.missing)
                                ? method.method.call(method.obj, fullname, args)
                                : method.method.apply(method.obj, args)];
                        }
                        catch (e) {
                            const debug = (method && method.debug !== undefined) ? method.debug : this.debug;
                            results[i] = [id, undefined, debug ? e.stack ? e.stack : e.message : e.message];
                        }
                    }
                    this.client.invoke('=', results.map((value) => Promise.all(value)));
                }, 0);
            }
            catch (e) {
                if (this.onerror) {
                    this.onerror(e);
                }
            }
        } while (true);
    }
    public add(method: MethodLike): this {
        this.methodManager.add(method);
        return this;
    }
    public remove(fullname: string): this {
        delete this.methods[fullname];
        return this;
    }
    public addFunction(f: Function, fullname?: string): this {
        this.methodManager.addFunction(f, fullname);
        return this;
    }
    public addMethod(method: Function, obj: any, fullname?: string): this;
    public addMethod(fullname: string, obj: any): this;
    public addMethod(...args: any[]): this {
        this.methodManager.addMethod(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addMissingFunction(f: MissingFunction): this {
        this.methodManager.addMissingFunction(f);
        return this;
    }
    public addMissingMethod(f: MissingFunction, obj: any): this {
        this.methodManager.addMissingMethod(f, obj);
        return this;
    }
    public addFunctions(functions: Function[], fullnames?: string[]): this {
        this.methodManager.addFunctions(functions, fullnames);
        return this;
    }
    public addMethods(methods: Function[], obj: any, fullnames?: string[]): this;
    public addMethods(fullnames: string[], obj: any): this;
    public addMethods(...args: any[]): this {
        this.methodManager.addMethods(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addInstanceMethods(obj: any, prefix?: string): this {
        this.methodManager.addInstanceMethods(obj, prefix);
        return this;
    }
}