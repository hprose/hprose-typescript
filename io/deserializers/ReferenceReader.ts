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
| hprose/io/deserializers/ReferenceReader.ts               |
|                                                          |
| hprose reference reader for TypeScript.                  |
|                                                          |
| LastModified: Dec 16, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ReaderInterface from "./ReaderInterface";
import Deserializer from './Deserializer';
import IntDeserializer from './IntDeserializer';
import NumberDeserializer from './NumberDeserializer';
import StringDeserializer from './StringDeserializer';
import * as ValueReader from './ValueReader';
import { Guid } from 'guid-typescript';

export function readBytes(reader: ReaderInterface): Uint8Array {
    const result = ValueReader.readBytes(reader.stream);
    reader.addReference(result);
    return result;
}

export function readAsciiString(reader: ReaderInterface): string {
    const result = ValueReader.readAsciiString(reader.stream);
    reader.addReference(result);
    return result;
}

export function readString(reader: ReaderInterface): string {
    const result = ValueReader.readString(reader.stream);
    reader.addReference(result);
    return result;
}

export function readGuid(reader: ReaderInterface): Guid {
    const result = ValueReader.readGuid(reader.stream);
    reader.addReference(result);
    return result;
}

export function readDateTime(reader: ReaderInterface): Date {
    const result = ValueReader.readDateTime(reader.stream);
    reader.addReference(result);
    return result;
}

export function readTime(reader: ReaderInterface): Date {
    const result = ValueReader.readTime(reader.stream);
    reader.addReference(result);
    return result;
}

export function readArray(reader: ReaderInterface): Array<any> {
    const stream = reader.stream;
    const count = ValueReader.readCount(stream);
    const a = new Array(count);
    reader.addReference(a);
    const deserializer = Deserializer.instance;
    for (let i = 0; i < count; ++i) {
        a[i] = deserializer.deserialize(reader);
    }
    stream.readByte();
    return a;
}

interface TypedArrayConstructor extends Function {
    new(length: number): TypedArray;
}

interface TypedArray {
    [index: number]: number;
    readonly length: number;
}

export function readIntArray(reader: ReaderInterface, type: TypedArrayConstructor): TypedArray {
    const stream = reader.stream;
    const count = ValueReader.readCount(stream);
    const a = new type(count);
    reader.addReference(a);
    const deserializer = IntDeserializer.instance;
    for (let i = 0; i < count; ++i) {
        a[i] = deserializer.deserialize(reader);
    }
    stream.readByte();
    return a;
}

export function readNumberArray(reader: ReaderInterface, type: TypedArrayConstructor): TypedArray {
    const stream = reader.stream;
    const count = ValueReader.readCount(stream);
    const a = new type(count);
    reader.addReference(a);
    const deserializer = NumberDeserializer.instance;
    for (let i = 0; i < count; ++i) {
        a[i] = deserializer.deserialize(reader);
    }
    stream.readByte();
    return a;
}

export function readSet(reader: ReaderInterface): Set<any> {
    const stream = reader.stream;
    const count = ValueReader.readCount(stream);
    const a = new Set();
    reader.addReference(a);
    const deserializer = Deserializer.instance;
    for (let i = 0; i < count; ++i) {
        a.add(deserializer.deserialize(reader));
    }
    stream.readByte();
    return a;
}

export function readDict(reader: ReaderInterface): any {
    const stream = reader.stream;
    const dict = Object.create(null);
    reader.addReference(dict);
    let count = ValueReader.readCount(stream);
    const strDeserializer = StringDeserializer.instance;
    const deserializer = Deserializer.instance;
    for (; count > 0; --count) {
        const key = strDeserializer.deserialize(reader);
        const value = deserializer.deserialize(reader);
        dict[key] = value;
    }
    stream.readByte();
    return dict;
}

export function readMap(reader: ReaderInterface): Map<any, any> {
    const stream = reader.stream;
    const map: Map<any, any> =new Map();
    reader.addReference(map);
    let count = ValueReader.readCount(stream);
    const deserializer = Deserializer.instance;
    for (; count > 0; --count) {
        const key = deserializer.deserialize(reader);
        const value = deserializer.deserialize(reader);
        map.set(key, value);
    }
    stream.readByte();
    return map;
}

interface Constructor extends Function {
    new(...args: any[]): any;
}

export function readObject(reader: ReaderInterface): any {
    const stream = reader.stream;
    const index = ValueReader.readInt(stream, Tags.TagOpenbrace);
    const typeInfo = reader.getTypeInfo(index);
    const type = typeInfo.type as Constructor;
    const obj: any = (type) ? new type() : {};
    reader.addReference(obj);
    const names = typeInfo.names;
    const count = names.length;
    const deserializer = Deserializer.instance;
    for (let i = 0; i < count; ++i) {
        obj[names[i]] = deserializer.deserialize(reader);
    }
    stream.readByte();
    return obj;
}

export function readObjectAsMap(reader: ReaderInterface): Map<any, any> {
    const stream = reader.stream;
    const index = ValueReader.readInt(stream, Tags.TagOpenbrace);
    const typeInfo = reader.getTypeInfo(index);
    const map = new Map();
    reader.addReference(map);
    const names = typeInfo.names;
    const count = names.length;
    const deserializer = Deserializer.instance;
    for (let i = 0; i < count; ++i) {
        map.set(names[i], deserializer.deserialize(reader));
    }
    stream.readByte();
    return map;
}