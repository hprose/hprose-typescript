/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Writer.ts                                                |
|                                                          |
| hprose Writer interface for TypeScript.                  |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from '../ByteStream';

export interface Writer {
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