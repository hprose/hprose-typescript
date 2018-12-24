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
| hprose/io/deserializers/ReaderInterface.ts               |
|                                                          |
| hprose ReaderInterface for TypeScript.                   |
|                                                          |
| LastModified: Dec 16, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import ByteStream from "../ByteStream";
import TypeInfo from './TypeInfo';

export default interface ReaderInterface {
    readonly stream: ByteStream;
    defaultLongType: 'number' | 'string';
    defaultDictType: 'object' | 'map';
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