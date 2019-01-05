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
| hprose/io/deserializers/Reader.ts                        |
|                                                          |
| hprose Reader interface for TypeScript.                  |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from '../ByteStream';
import { TypeInfo } from './TypeInfo';

export interface Reader {
    readonly stream: ByteStream;
    longType: 'number' | 'bigint' | 'string';
    dictType: 'object' | 'map';
    deserialize(type?: Function): any;
    read(tag: number): any;
    readClass(): void;
    getTypeInfo(index: number): TypeInfo;
    readReference(): any;
    addReference(value: any): void;
    setReference(index: number, value: any): void;
    readonly lastReferenceIndex: number;
    reset(): void;
}