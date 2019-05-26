/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Reader.ts                                                |
|                                                          |
| hprose Reader interface for TypeScript.                  |
|                                                          |
| LastModified: Mar 16, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from '../ByteStream';
import { TypeInfo } from '../TypeInfo';

export interface Reader {
    readonly stream: ByteStream;
    longType: 'number' | 'bigint' | 'string';
    dictType: 'object' | 'map';
    deserialize(type?: Function): any;
    read(tag: number, type?: Function | null): any;
    readClass(): void;
    getTypeInfo(index: number): TypeInfo;
    readReference(): any;
    addReference(value: any): void;
    setReference(index: number, value: any): void;
    readonly lastReferenceIndex: number;
    reset(): void;
}