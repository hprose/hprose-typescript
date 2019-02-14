/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Writer.ts                                                |
|                                                          |
| hprose Writer for TypeScript.                            |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from './ByteStream';
import { Tags } from './Tags';
import * as Serializer from './Serializer';
import './serializers/BigIntSerializer';
import './serializers/BigIntArraySerializer';

class WriterRefer {
    private readonly ref: Map<any, number> = new Map<any, number>();
    private last: number = 0;
    public addCount(count: number): void {
        this.last += count;
    }
    public set(value: any): void {
        this.ref.set(value, this.last++);
    }
    public write(stream: ByteStream, value: any): boolean {
        const index = this.ref.get(value);
        if (index !== undefined) {
            stream.writeByte(Tags.TagRef);
            stream.writeAsciiString('' + index);
            stream.writeByte(Tags.TagSemicolon);
            return true;
        }
        return false;
    }
    public reset(): void {
        this.ref.clear();
        this.last = 0;
    }
}

export class Writer {
    private refer?: WriterRefer;
    private readonly ref: Map<any, number> = new Map<any, number>();
    private last: number = 0;
    constructor(public readonly stream: ByteStream, simple: boolean = false, public utc = false) {
        this.simple = simple;
    }
    get simple(): boolean {
        return this.refer === undefined;
    }
    set simple(value: boolean) {
        this.refer = value ? undefined : new WriterRefer();
    }
    public serialize<T>(value: T): void {
        if (value === undefined || value === null) {
            this.stream.writeByte(Tags.TagNull);
        } else {
            Serializer.getInstance<T>(value).serialize(this, value);
        }
    }
    public write<T>(value: T): void {
        if (value === undefined || value === null) {
            this.stream.writeByte(Tags.TagNull);
        } else {
            Serializer.getInstance<T>(value).write(this, value);
        }
    }
    public writeReference(value: any): boolean {
        return this.refer ? this.refer.write(this.stream, value) : false;
    }
    public setReference(value: any): void {
        if (this.refer) this.refer.set(value);
    }
    public addReferenceCount(count: number): void {
        if (this.refer) this.refer.addCount(count);
    }
    public reset(): void {
        if (this.refer) this.refer.reset();
        this.ref.clear();
        this.last = 0;
    }
    public writeClass(type: any, action: () => void): number {
        let r = this.ref.get(type);
        if (r === undefined) {
            action();
            r = this.last++;
            this.ref.set(type, r);
        }
        return r;
    }
}