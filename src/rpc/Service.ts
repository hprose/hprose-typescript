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
| LastModified: Jan 8, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ServiceCodec } from './ServiceCodec';
import { DefaultServiceCodec } from './DefaultServiceCodec';
import { Context } from './Context';
import { ServiceContext } from './ServiceContext';
import { HandlerManager, IOHandler, InvokeHandler } from './HandlerManager';
import { MethodLike, Method } from './Method';
import { MethodManager, MissingFunction } from './MethodManager';

export abstract class Service {
    public readonly methods: { [fullname: string]: MethodLike } = Object.create(null);
    public timeout: number = 300000;
    public debug: boolean = false;
    public simple: boolean = false;
    public utc: boolean = false;
    public longType: 'number' | 'bigint' | 'string' = 'number';
    public dictType: 'object' | 'map' = 'object';
    public nullType: undefined | null = undefined;
    public codec: ServiceCodec = DefaultServiceCodec.instance;
    public maxRequestLength: number = 0x7FFFFFFF;
    private handlerManager: HandlerManager = new HandlerManager(this.execute.bind(this), this.process.bind(this));
    private methodManager: MethodManager = new MethodManager(this.methods);
    constructor() {
        this.add(new Method(() => { return Object.keys(this.methods); }, '~'));
    }
    public handle(request: Uint8Array, context: Context): Promise<Uint8Array> {
        return this.handlerManager.ioHandler(request, context);
    }
    public async process(request: Uint8Array, context: Context): Promise<Uint8Array> {
        const codec = this.codec;
        const [ fullname, args ] = codec.decode(request, context as ServiceContext);
        const invokeHandler = this.handlerManager.invokeHandler;
        let result: any;
        try {
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
    public add(method: MethodLike) {
        this.methodManager.add(method);
    }
    public remove(fullname: string) {
        delete this.methods[fullname];
    }
    public addFunction(f: Function, fullname?: string, paramTypes?: Function[]): void;
    public addFunction(f: Function, paramTypes: Function[]): void;
    public addFunction(f: Function, ...args: any[]): void {
        this.methodManager.addFunction(f, ...args);
    }
    public addMethod(method: Function, obj: any, fullname?: string, paramTypes?: Function[]): void;
    public addMethod(method: Function, obj: any, paramTypes: Function[]): void;
    public addMethod(fullname: string, obj: any, paramTypes?: Function[]): void;
    public addMethod(...args: any[]): void {
        this.methodManager.addMethod(args[0], args[1], ...args.slice(2));
    }
    public addMissingFunction(f: MissingFunction): void {
        this.methodManager.addMissingFunction(f);
    }
    public addMissingMethod(f: MissingFunction, obj: any): void {
        this.methodManager.addMissingMethod(f, obj);
    }
    public addFunctions(functions: Function[], fullnames?: string[], paramTypes?: Function[]): void;
    public addFunctions(functions: Function[], paramTypes: Function[]): void;
    public addFunctions(functions: Function[], ...args: any[]): void {
        this.methodManager.addFunctions(functions, ...args);
    }
    public addMethods(methods: Function[], obj: any, fullnames?: string[], paramTypes?: Function[]): void;
    public addMethods(methods: Function[], obj: any, paramTypes: Function[]): void;
    public addMethods(fullnames: string[], obj: any, paramTypes?: Function[]): void;
    public addMethods(...args: any[]): void {
        this.methodManager.addMethods(args[0], args[1], ...args.slice(2));
    }
    public addInstanceMethods(obj: any, prefix?: string) {
        this.methodManager.addInstanceMethods(obj, prefix);
    }
}