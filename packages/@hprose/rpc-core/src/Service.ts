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
| LastModified: Jan 23, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ServiceCodec, DefaultServiceCodec } from './ServiceCodec';
import { Context } from './Context';
import { ServiceContext } from './ServiceContext';
import { HandlerManager, IOHandler, InvokeHandler } from './HandlerManager';
import { MethodLike, Method } from './Method';
import { MethodManager, MissingFunction } from './MethodManager';

export interface Handler {
    bind(server: any): void;
    handler: Function;
}

export interface HandlerConstructor {
    new(service: Service): Handler;
}

export class Service {
    private static handlers: { name: string, ctor: HandlerConstructor }[] = [];
    private static serverTypes: Map<Function, string> = new Map();
    public static register(name: string, ctor: HandlerConstructor, serverTypes: Function[]): void {
        Service.handlers.push({name, ctor});
        serverTypes.forEach((type) => Service.serverTypes.set(type, name));
    }
    public timeout: number = 300000;
    public debug: boolean = false;
    public simple: boolean = false;
    public utc: boolean = false;
    public longType: 'number' | 'bigint' | 'string' = 'number';
    public dictType: 'object' | 'map' = 'object';
    public nullType: undefined | null = undefined;
    public codec: ServiceCodec = DefaultServiceCodec.instance;
    public maxRequestLength: number = 0x7FFFFFFF;
    public readonly methods: { [fullname: string]: MethodLike } = Object.create(null);
    private readonly handlerManager: HandlerManager = new HandlerManager(this.execute.bind(this), this.process.bind(this));
    private readonly methodManager: MethodManager = new MethodManager(this.methods);
    private readonly handlers: { [name: string]: Handler } = Object.create(null);
    constructor() {
        Service.handlers.forEach(({ name, ctor }) => {
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
        });
        this.add(new Method(() => { return Object.keys(this.methods); }, '~'));
    }
    public bind(server: any): this {
        const type = server.constructor;
        const serverTypes = Service.serverTypes;
        if (serverTypes.has(type)) {
            this.handlers[serverTypes.get(type) as string].bind(server);
        } else {
            throw new Error('This type server is not supported.');
        }
        return this;
    }
    public handle(request: Uint8Array, context: Context): Promise<Uint8Array> {
        return this.handlerManager.ioHandler(request, context);
    }
    public async process(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const codec = this.codec;
        let result: any;
        try {
            const [ fullname, args ] = codec.decode(request, context as ServiceContext);
            const invokeHandler = this.handlerManager.invokeHandler;
            result = await invokeHandler(fullname, args, context);
        }
        catch(e) {
            result = e;
        }
        return codec.encode(result, context as ServiceContext);
    }
    public async execute(fullname: string, args: any[], context: Context): Promise<any> {
        const cxt = context as ServiceContext;
        if (cxt.missing) {
            return cxt.method.call(cxt.obj, fullname, args);
        }
        return cxt.method.apply(cxt.obj, args);
    }
    public use(...handlers: InvokeHandler[] | IOHandler[]): this {
        this.handlerManager.use(...handlers);
        return this;
    }
    public unuse(...handlers: InvokeHandler[] | IOHandler[]): this {
        this.handlerManager.unuse(...handlers);
        return this;
    }
    public add(method: MethodLike): this {
        this.methodManager.add(method);
        return this;
    }
    public remove(fullname: string): this {
        delete this.methods[fullname];
        return this;
    }
    public addFunction(f: Function, fullname?: string, paramTypes?: Function[]): this;
    public addFunction(f: Function, paramTypes: Function[]): this;
    public addFunction(f: Function, ...args: any[]): this {
        this.methodManager.addFunction(f, ...args);
        return this;
    }
    public addMethod(method: Function, obj: any, fullname?: string, paramTypes?: Function[]): this;
    public addMethod(method: Function, obj: any, paramTypes: Function[]): this;
    public addMethod(fullname: string, obj: any, paramTypes?: Function[]): this;
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
    public addFunctions(functions: Function[], fullnames?: string[], paramTypes?: Function[]): this;
    public addFunctions(functions: Function[], paramTypes: Function[]): this;
    public addFunctions(functions: Function[], ...args: any[]): this {
        this.methodManager.addFunctions(functions, ...args);
        return this;
    }
    public addMethods(methods: Function[], obj: any, fullnames?: string[], paramTypes?: Function[]): this;
    public addMethods(methods: Function[], obj: any, paramTypes: Function[]): this;
    public addMethods(fullnames: string[], obj: any, paramTypes?: Function[]): this;
    public addMethods(...args: any[]): this {
        this.methodManager.addMethods(args[0], args[1], ...args.slice(2));
        return this;
    }
    public addInstanceMethods(obj: any, prefix?: string): this {
        this.methodManager.addInstanceMethods(obj, prefix);
        return this;
    }
}