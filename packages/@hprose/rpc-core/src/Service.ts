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
| LastModified: Mar 28, 2020                               |
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

export interface Handler {
    bind(server: any): void;
}

export interface HandlerConstructor {
    serverTypes: Function[];
    new(service: Service): Handler;
}

export interface Service {
    [name: string]: any;
}

export class Service {
    private static readonly handlers: { [name: string]: HandlerConstructor } = Object.create(null);
    private static readonly serverTypes: Map<Function, string[]> = new Map();
    public static register(name: string, ctor: HandlerConstructor): void {
        Service.handlers[name] = ctor;
        ctor.serverTypes.forEach((type) => {
            if (Service.serverTypes.has(type)) {
                (Service.serverTypes.get(type) as string[]).push(name);
            }
            else {
                Service.serverTypes.set(type, [name]);
            }
        });
    }
    public codec: ServiceCodec = DefaultServiceCodec.instance;
    public maxRequestLength: number = 0x7FFFFFFF;
    private readonly invokeManager: InvokeManager = new InvokeManager(this.execute.bind(this));
    private readonly ioManager: IOManager = new IOManager(this.process.bind(this));
    private readonly methodManager: MethodManager = new MethodManager();
    private readonly handlers: { [name: string]: Handler } = Object.create(null);
    public readonly options: { [name: string]: any } = Object.create(null);
    public get names(): string[] {
        return this.methodManager.getNames();
    }
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
        this.add(new Method(this.methodManager.getNames.bind(this.methodManager), '~'));
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
            const [name, args] = codec.decode(request, context as ServiceContext);
            result = await this.invokeManager.handler(name, args, context);
        }
        catch (e) {
            result = e;
        }
        return codec.encode(result, context as ServiceContext);
    }
    public async execute(name: string, args: any[], context: Context): Promise<any> {
        const method = (context as ServiceContext).method;
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
    public addFunction(fn: Function, name?: string, paramTypes?: Function[]): this;
    public addFunction(fn: Function, paramTypes: Function[]): this;
    public addFunction(fn: Function, ...args: any[]): this {
        this.methodManager.addFunction(fn, ...args);
        return this;
    }
    public addMethod(method: Function, target: any, name?: string, paramTypes?: Function[]): this;
    public addMethod(method: Function, target: any, paramTypes: Function[]): this;
    public addMethod(name: string, target: any, paramTypes?: Function[]): this;
    public addMethod(...args: any[]): this {
        this.methodManager.addMethod(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addMissingMethod(fn: MissingMethod, target?: any): this {
        this.methodManager.addMissingMethod(fn, target);
        return this;
    }
    public addFunctions(functions: Function[], names?: string[], paramTypes?: Function[]): this;
    public addFunctions(functions: Function[], paramTypes: Function[]): this;
    public addFunctions(functions: Function[], ...args: any[]): this {
        this.methodManager.addFunctions(functions, ...args);
        return this;
    }
    public addMethods(methods: Function[], target: any, names?: string[], paramTypes?: Function[]): this;
    public addMethods(methods: Function[], target: any, paramTypes: Function[]): this;
    public addMethods(names: string[], target: any, paramTypes?: Function[]): this;
    public addMethods(...args: any[]): this {
        this.methodManager.addMethods(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addInstanceMethods(target: any, prefix?: string): this {
        this.methodManager.addInstanceMethods(target, prefix);
        return this;
    }
}