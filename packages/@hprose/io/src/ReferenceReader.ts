/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ReferenceReader.ts                                       |
|                                                          |
| hprose reference reader for TypeScript.                  |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from './Tags';
import { Reader } from './deserializers/Reader';
import * as ValueReader from './ValueReader';
import { Guid } from 'guid-typescript';

export function readBytes(reader: Reader): Uint8Array {
    const result = ValueReader.readBytes(reader.stream);
    reader.addReference(result);
    return result;
}

export function readAsciiString(reader: Reader): string {
    const result = ValueReader.readAsciiString(reader.stream);
    reader.addReference(result);
    return result;
}

export function readString(reader: Reader): string {
    const result = ValueReader.readString(reader.stream);
    reader.addReference(result);
    return result;
}

export function readGuid(reader: Reader): Guid {
    const result = ValueReader.readGuid(reader.stream);
    reader.addReference(result);
    return result;
}

export function readDateTime(reader: Reader): Date {
    const result = ValueReader.readDateTime(reader.stream);
    reader.addReference(result);
    return result;
}

export function readTime(reader: Reader): Date {
    const result = ValueReader.readTime(reader.stream);
    reader.addReference(result);
    return result;
}

export function readArray(reader: Reader): Array<any> {
    const stream = reader.stream;
    const count = ValueReader.readCount(stream);
    const a = new Array(count);
    reader.addReference(a);
    for (let i = 0; i < count; ++i) {
        a[i] = reader.deserialize();
    }
    stream.readByte();
    return a;
}

export function readSet(reader: Reader): Set<any> {
    const stream = reader.stream;
    const count = ValueReader.readCount(stream);
    const a = new Set();
    reader.addReference(a);
    for (let i = 0; i < count; ++i) {
        a.add(reader.deserialize());
    }
    stream.readByte();
    return a;
}

export function readMap(reader: Reader): Map<any, any> {
    const stream = reader.stream;
    const map: Map<any, any> = new Map();
    reader.addReference(map);
    let count = ValueReader.readCount(stream);
    for (; count > 0; --count) {
        const key = reader.deserialize();
        const value = reader.deserialize();
        map.set(key, value);
    }
    stream.readByte();
    return map;
}

interface Constructor extends Function {
    new(...args: any[]): any;
}

export function readObject(reader: Reader): any {
    const stream = reader.stream;
    const index = ValueReader.readInt(stream, Tags.TagOpenbrace);
    const typeInfo = reader.getTypeInfo(index);
    const type = typeInfo.type as Constructor;
    const obj: any = (type) ? new type() : {};
    reader.addReference(obj);
    const names = typeInfo.names;
    const count = names.length;
    for (let i = 0; i < count; ++i) {
        obj[names[i]] = reader.deserialize();
    }
    stream.readByte();
    return obj;
}

export function readObjectAsMap(reader: Reader): Map<any, any> {
    const stream = reader.stream;
    const index = ValueReader.readInt(stream, Tags.TagOpenbrace);
    const typeInfo = reader.getTypeInfo(index);
    const map = new Map();
    reader.addReference(map);
    const names = typeInfo.names;
    const count = names.length;
    for (let i = 0; i < count; ++i) {
        map.set(names[i], reader.deserialize());
    }
    stream.readByte();
    return map;
}