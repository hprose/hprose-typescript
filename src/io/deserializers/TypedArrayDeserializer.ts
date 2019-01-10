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
| hprose/io/deserializers/TypedArrayDeserializer.ts        |
|                                                          |
| hprose TypedArray deserializer for TypeScript.           |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ByteStream } from '../ByteStream';
import { Reader } from './Reader';
import { IntDeserializer } from './IntDeserializer';
import { NumberDeserializer } from './NumberDeserializer';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { readCount } from '../ValueReader';
import { readBytes, readString } from '../ReferenceReader';

interface TypedArrayConstructor extends Function {
    new(length: number): TypedArray;
}

interface TypedArray {
    [index: number]: number;
    readonly length: number;
}

export function readIntArray(reader: Reader, type: TypedArrayConstructor): TypedArray {
    const stream = reader.stream;
    const count = readCount(stream);
    const a = new type(count);
    reader.addReference(a);
    const deserializer = IntDeserializer.instance;
    for (let i = 0; i < count; ++i) {
        a[i] = deserializer.deserialize(reader);
    }
    stream.readByte();
    return a;
}

export function readNumberArray(reader: Reader, type: TypedArrayConstructor): TypedArray {
    const stream = reader.stream;
    const count = readCount(stream);
    const a = new type(count);
    reader.addReference(a);
    const deserializer = NumberDeserializer.instance;
    for (let i = 0; i < count; ++i) {
        a[i] = deserializer.deserialize(reader);
    }
    stream.readByte();
    return a;
}

const emptyInt8Array = new Int8Array(0);

export class Int8ArrayDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new Int8ArrayDeserializer();
    constructor() { super('Int8Array'); }
    public read(reader: Reader, tag: number): Int8Array {
        let bytes: Uint8Array;
        switch (tag) {
            case Tags.TagEmpty: return emptyInt8Array;
            case Tags.TagList: return readIntArray(reader, Int8Array) as Int8Array;
            case Tags.TagBytes: bytes = readBytes(reader); break;
            case Tags.TagUTF8Char: bytes = new ByteStream(reader.stream.readString(1)).bytes; break;
            case Tags.TagString: bytes = new ByteStream(readString(reader)).bytes; break;
            default:
                return super.read(reader, tag);
        }
        return new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length);
    }
}

const emptyInt16Array = new Int16Array(0);

export class Int16ArrayDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new Int16ArrayDeserializer();
    constructor() { super('Int16Array'); }
    public read(reader: Reader, tag: number): Int16Array {
        switch (tag) {
            case Tags.TagEmpty: return emptyInt16Array;
            case Tags.TagList: return readIntArray(reader, Int16Array) as Int16Array;
            default:
                return super.read(reader, tag);
        }
    }
}

const emptyInt32Array = new Int32Array(0);

export class Int32ArrayDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new Int32ArrayDeserializer();
    constructor() { super('Int32Array'); }
    public read(reader: Reader, tag: number): Int32Array {
        switch (tag) {
            case Tags.TagEmpty: return emptyInt32Array;
            case Tags.TagList: return readIntArray(reader, Int32Array) as Int32Array;
            default:
                return super.read(reader, tag);
        }
    }
}

const emptyUint8Array = new Uint8Array(0);

export class Uint8ArrayDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new Uint8ArrayDeserializer();
    constructor() { super('Uint8Array'); }
    public read(reader: Reader, tag: number): Uint8Array {
        switch (tag) {
            case Tags.TagBytes: return readBytes(reader);
            case Tags.TagEmpty: return emptyUint8Array;
            case Tags.TagList: return readIntArray(reader, Uint8Array) as Uint8Array;
            case Tags.TagUTF8Char: return new ByteStream(reader.stream.readString(1)).bytes;
            case Tags.TagString: return new ByteStream(readString(reader)).bytes;
            default:
                return super.read(reader, tag);
        }
    }
}

const emptyUint8ClampedArray = new Uint8ClampedArray(0);

export class Uint8ClampedArrayDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new Uint8ClampedArrayDeserializer();
    constructor() { super('Uint8ClampedArray'); }
    public read(reader: Reader, tag: number): Uint8ClampedArray {
        let bytes: Uint8Array;
        switch (tag) {
            case Tags.TagEmpty: return emptyUint8ClampedArray;
            case Tags.TagList: return readIntArray(reader, Uint8ClampedArray) as Uint8ClampedArray;
            case Tags.TagBytes: bytes = readBytes(reader); break;
            case Tags.TagUTF8Char: bytes = new ByteStream(reader.stream.readString(1)).bytes; break;
            case Tags.TagString: bytes = new ByteStream(readString(reader)).bytes; break;
            default:
                return super.read(reader, tag);
        }
        return new Uint8ClampedArray(bytes.buffer, bytes.byteOffset, bytes.length);
    }
}

const emptyUint16Array = new Uint16Array(0);

export class Uint16ArrayDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new Uint16ArrayDeserializer();
    constructor() { super('Uint16Array'); }
    public read(reader: Reader, tag: number): Uint16Array {
        switch (tag) {
            case Tags.TagEmpty: return emptyUint16Array;
            case Tags.TagList: return readIntArray(reader, Uint16Array) as Uint16Array;
            default:
                return super.read(reader, tag);
        }
    }
}

const emptyUint32Array = new Uint32Array(0);

export class Uint32ArrayDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new Uint32ArrayDeserializer();
    constructor() { super('Uint32Array'); }
    public read(reader: Reader, tag: number): Uint32Array {
        switch (tag) {
            case Tags.TagEmpty: return emptyUint32Array;
            case Tags.TagList: return readIntArray(reader, Uint32Array) as Uint32Array;
            default:
                return super.read(reader, tag);
        }
    }
}

const emptyFloat32Array = new Float32Array(0);

export class Float32ArrayDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new Float32ArrayDeserializer();
    constructor() { super('Float32Array'); }
    public read(reader: Reader, tag: number): Float32Array {
        switch (tag) {
            case Tags.TagEmpty: return emptyFloat32Array;
            case Tags.TagList: return readNumberArray(reader, Float32Array) as Float32Array;
            default:
                return super.read(reader, tag);
        }
    }
}

const emptyFloat64Array = new Float64Array(0);

export class Float64ArrayDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new Float64ArrayDeserializer();
    constructor() { super('Float64Array'); }
    public read(reader: Reader, tag: number): Float64Array {
        switch (tag) {
            case Tags.TagEmpty: return emptyFloat64Array;
            case Tags.TagList: return readNumberArray(reader, Float64Array) as Float64Array;
            default:
                return super.read(reader, tag);
        }
    }
}