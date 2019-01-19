/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/io/deserializers/BigIntArrayDeserializer.ts       |
|                                                          |
| hprose bigint Array deserializer for TypeScript.         |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';
import { register, getInstance } from '../Deserializer';
import * as ValueReader from '../ValueReader';

interface BigIntArrayConstructor extends Function {
    new(length: number): BigIntArray;
}

interface BigIntArray {
    [index: number]: bigint;
    readonly length: number;
}

function readBigIntArray(reader: Reader, type: BigIntArrayConstructor): BigIntArray {
    const stream = reader.stream;
    const count = ValueReader.readCount(stream);
    const a = new type(count);
    reader.addReference(a);
    const deserializer = getInstance(BigInt);
    for (let i = 0; i < count; ++i) {
        a[i] = deserializer.deserialize(reader);
    }
    stream.readByte();
    return a;
}

if (typeof BigInt64Array !== 'undefined') {
    const empty = new BigInt64Array(0);
    class BigInt64ArrayDeserializer extends BaseDeserializer implements Deserializer {
        public static instance: Deserializer = new BigInt64ArrayDeserializer();
        constructor() { super('BigInt64Array'); }
        public read(reader: Reader, tag: number): BigInt64Array {
            switch (tag) {
                case Tags.TagEmpty: return empty;
                case Tags.TagList: return readBigIntArray(reader, BigInt64Array) as BigInt64Array;
                default:
                    return super.read(reader, tag);
            }
        }
    }
    register(BigInt64Array, BigInt64ArrayDeserializer.instance);
}

if (typeof BigUint64Array !== 'undefined') {
    const empty = new BigUint64Array(0);
    class BigUint64ArrayDeserializer extends BaseDeserializer implements Deserializer {
        public static instance: Deserializer = new BigUint64ArrayDeserializer();
        constructor() { super('BigUint64Array'); }
        public read(reader: Reader, tag: number): BigUint64Array {
            switch (tag) {
                case Tags.TagEmpty: return empty;
                case Tags.TagList: return readBigIntArray(reader, BigUint64Array) as BigUint64Array;
                default:
                    return super.read(reader, tag);
            }
        }
    }
    register(BigUint64Array, BigUint64ArrayDeserializer.instance);
}