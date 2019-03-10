/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Service.ts                                               |
|                                                          |
| Service for TypeScript.                                  |
|                                                          |
| LastModified: Feb 27, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ServiceCodec, DefaultServiceCodec } from './ServiceCodec';
import { Context } from './Context';
import { ServiceContext } from './ServiceContext';
import { InvokeManager, InvokeHandler } from './InvokeManager';
import { IOManager, IOHandler } from './IOManager';
import { MethodLike, Method } from './Method';
import { MethodManager, MissingMethod } from './MethodManager';
import { TimeoutError } from './TimeoutError';

export interface Handler {
    bind(server: any): void;
}

export interface HandlerConstructor {
    new(service: Service): Handler;
}

export interface Service {
    [name: string]: any;
}

export class Service {
    private static readonly handlers: { [name: string]: HandlerConstructor } = Object.create(null);
    private static readonly serverTypes: Map<Function, string[]> = new Map();
    public static register(name: string, ctor: HandlerConstructor, serverTypes: Function[]): void {
        Service.handlers[name] = ctor;
        serverTypes.forEach((type) => {
            if (Service.serverTypes.has(type)) {
                (Service.serverTypes.get(type) as string[]).push(name);
            }
            else {
                Service.serverTypes.set(type, [name]);
            }
        });
    }
    public timeout: number = 30000;
    public codec: ServiceCodec = DefaultServiceCodec.instance;
    public maxRequestLength: number = 0x7FFFFFFF;
    private readonly invokeManager: InvokeManager = new InvokeManager(this.execute.bind(this));
    private readonly ioManager: IOManager = new IOManager(this.process.bind(this));
    private readonly methodManager: MethodManager = new MethodManager();
    private readonly handlers: { [name: string]: Handler } = Object.create(null);
    constructor() {
        for (const name in Service.handlers) {
            const ctor = Service.handlers[name];
            let handler = new ctor(this);
            this.handlers[name] = handler;
            Object.defineProperty(this, name, {
                get: () => handler,
                set: (value) => {
                    handler = value;
                    this.handlers[name] = value;
                },
                enumerable: true,
                configurable: true
            });
        }
        this.add(new Method(this.methodManager.getNames, '~', this.methodManager));
    }
    public bind(server: any, name?: string): this {
        const type = server.constructor;
        const serverTypes = Service.serverTypes;
        if (serverTypes.has(type)) {
            const names = serverTypes.get(type) as string[];
            for (let i = 0, n = names.length; i < n; ++i) {
                if ((name === undefined) || (name === names[i])) {
                    this.handlers[names[i]].bind(server);
                }
            }
        } else {
            throw new Error('This type server is not supported.');
        }
        return this;
    }
    public handle(request: Uint8Array, context: Context): Promise<Uint8Array> {
        return this.ioManager.handler(request, context);
    }
    public async process(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const codec = this.codec;
        let result: any;
        try {
            const [ fullname, args ] = codec.decode(request, context as ServiceContext);
            if (this.timeout > 0) {
                result = await new Promise<any>((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new TimeoutError());
                    }, this.timeout);
                    this.invokeManager.handler(fullname, args, context).then(
                        (value) => {
                            clearTimeout(timeoutId);
                            resolve(value);
                        },
                        (reason) => {
                            clearTimeout(timeoutId);
                            reject(reason);
                        }
                    );
                });
            } else {
                result = await this.invokeManager.handler(fullname, args, context);
            }
        }
        catch(e) {
            result = e;
        }
        return codec.encode(result, context as ServiceContext);
    }
    public async execute(fullname: string, args: any[], context: Context): Promise<any> {
        const method = (context as ServiceContext).method;
        return method.method.apply(method.target, method.missing ? method.passContext ? [fullname, args, context] : [fullname, args] : args);
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
    public addFunction(fn: Function, fullname?: string, paramTypes?: Function[]): this;
    public addFunction(fn: Function, paramTypes: Function[]): this;
    public addFunction(fn: Function, ...args: any[]): this {
        this.methodManager.addFunction(fn, ...args);
        return this;
    }
    public addMethod(method: Function, target: any, fullname?: string, paramTypes?: Function[]): this;
    public addMethod(method: Function, target: any, paramTypes: Function[]): this;
    public addMethod(fullname: string, target: any, paramTypes?: Function[]): this;
    public addMethod(...args: any[]): this {
        this.methodManager.addMethod(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addMissingMethod(fn: MissingMethod, target?: any): this {
        this.methodManager.addMissingMethod(fn, target);
        return this;
    }
    public addFunctions(functions: Function[], fullnames?: string[], paramTypes?: Function[]): this;
    public addFunctions(functions: Function[], paramTypes: Function[]): this;
    public addFunctions(functions: Function[], ...args: any[]): this {
        this.methodManager.addFunctions(functions, ...args);
        return this;
    }
    public addMethods(methods: Function[], target: any, fullnames?: string[], paramTypes?: Function[]): this;
    public addMethods(methods: Function[], target: any, paramTypes: Function[]): this;
    public addMethods(fullnames: string[], target: any, paramTypes?: Function[]): this;
    public addMethods(...args: any[]): this {
        this.methodManager.addMethods(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addInstanceMethods(target: any, prefix?: string): this {
        this.methodManager.addInstanceMethods(target, prefix);
        return this;
    }
}