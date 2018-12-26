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
| hprose/io/serializers/WriterInterface.ts                 |
|                                                          |
| hprose WriterInterface for TypeScript.                   |
|                                                          |
| LastModified: Dec 10, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import ByteStream from "../ByteStream";

export default interface WriterInterface {
    readonly stream: ByteStream;
    utc: boolean;
    serialize<T>(value: T): void;
    write<T>(value: T): void;
    writeReference(value: any): boolean;
    setReference(value: any): void;
    addReferenceCount(count: number): void;
    writeClass(type: any, action: () => void): number;
    reset(): void;
}