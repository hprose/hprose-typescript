/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| MethodManager.ts                                         |
|                                                          |
| MethodManager for TypeScript.                            |
|                                                          |
| LastModified: Jan 8, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { MethodLike, Method } from './Method';

export type MissingFunction = (fullname: string, args: any[]) => any;

export class MethodManager {
    constructor(public readonly methods: { [fullname: string]: MethodLike }) {}
    public add(method: MethodLike) {
        const fullname = method.fullname;
        if (fullname === '') {
            throw new Error('fullname must not be empty');
        }
        this.methods[fullname] = method;
    }
    public addFunction(fn: Function, fullname?: string, paramTypes?: Function[]): void;
    public addFunction(fn: Function, paramTypes: Function[]): void;
    public addFunction(fn: Function, ...args: any[]): void {
        switch (args.length) {
            case 0:
                this.add(new Method(fn));
                break;
            case 1:
                if (typeof args[0] === 'string') {
                    this.add(new Method(fn, args[0]));
                } else {
                    this.add(new Method(fn, undefined, undefined, args[0]));
                }
                break;
            case 2:
                this.add(new Method(fn, args[0], undefined, args[1]));
                break;
        }
    }
    public addMethod(method: Function, obj: any, fullname?: string, paramTypes?: Function[]): void;
    public addMethod(method: Function, obj: any, paramTypes: Function[]): void;
    public addMethod(fullname: string, obj: any, paramTypes?: Function[]): void;
    public addMethod(...args: any[]): void {
        if (typeof args[0] === 'string') {
            const method = args[1][args[0]];
            if (typeof method === 'function') {
                this.add(new Method(method, args[0], args[1], args[2]));
            } else {
                throw new Error('obj[fullname] must be a function');
            }
        } else {
            switch(args.length) {
                case 2:
                    this.add(new Method(args[0], undefined, args[1]));
                    break;
                case 3:
                    if (typeof args[2] === 'string') {
                        this.add(new Method(args[0], args[2], args[1]));
                    } else {
                        this.add(new Method(args[0], undefined, args[1], args[2]));
                    }
                    break;
                case 4:
                    this.add(new Method(args[0], args[2], args[1], args[3]));
            }
        }
    }
    public addMissingFunction(fn: MissingFunction): void {
        const method = new Method(fn, '*');
        method.missing = true;
        this.add(method);
    }
    public addMissingMethod(fn: MissingFunction, obj: any): void {
        const method = new Method(fn, '*', obj);
        method.missing = true;
        this.add(method);
    }
    public addFunctions(functions: Function[], fullnames?: string[], paramTypes?: Function[]): void;
    public addFunctions(functions: Function[], paramTypes: Function[]): void;
    public addFunctions(functions: Function[], ...args: any[]): void {
        let fullnames: string[] | undefined;
        let paramTypes: Function[] | undefined;
        switch (args.length) {
            case 1:
                if ((args[0].length > 1) && (typeof args[0][0] === 'string')) {
                    fullnames = args[0];
                } else {
                    paramTypes = args[0];
                }
                break;
            case 2:
                fullnames = args[0];
                paramTypes = args[1];
                break;
        }
        const n = functions.length;
        if (fullnames && fullnames.length !== n) {
            throw new Error('fullnames.length must be equal to functions.length');
        }
        for (let i = 0; i < n; ++i) {
            this.add(new Method(functions[i], fullnames ? fullnames[i] : undefined, undefined, paramTypes));
        }
    }
    public addMethods(methods: Function[], obj: any, fullnames?: string[], paramTypes?: Function[]): void;
    public addMethods(methods: Function[], obj: any, paramTypes: Function[]): void;
    public addMethods(fullnames: string[], obj: any, paramTypes?: Function[]): void;
    public addMethods(...args: any[]): void {
        const n: number = args[0].length;
        if (n === 0) return;
        let methods: Function[];
        let obj: any = args[1];
        let fullnames: string[] | undefined;
        let paramTypes: Function[] | undefined;
        if (typeof args[0][0] === 'string') {
            fullnames = args[0] as string[];
            paramTypes = args[2];
            for (let i = 0; i < n; ++i) {
                const method = obj[fullnames[i]];
                if (typeof method === 'function') {
                    this.add(new Method(method, fullnames[i], obj, paramTypes));
                } else {
                    throw new Error('obj[fullname] must be a function');
                }
            }
            return;
        } else {
            methods = args[0];
        }
        switch (args.length) {
            case 3:
            if (args[2].length > 0 && typeof args[2][0] === 'string') {
                fullnames = args[2] as string[];
            }
            else {
                paramTypes = args[2];
            }
            break;
            case 4:
                fullnames = args[2];
                paramTypes = args[3];
        }
        if (fullnames && fullnames.length !== n) {
            throw new Error('fullnames.length must be equal to functions.length');
        }
        for (let i = 0; i < n; ++i) {
            this.add(new Method(methods[i], fullnames ? fullnames[i] : undefined, obj, paramTypes));
        }
    }
    public addInstanceMethods(obj: any, prefix?: string) {
        for (const name in obj) {
            if ((!obj.hasOwnProperty || obj.hasOwnProperty(name)) && typeof obj[name] === 'function') {
                const fullname = prefix ? prefix + '_' + name : name;
                this.add(new Method(obj[name], obj, fullname));
            }
        }
    }
}