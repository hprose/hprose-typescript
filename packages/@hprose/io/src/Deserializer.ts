/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Deserializer.ts                                          |
|                                                          |
| hprose Deserializer for TypeScript.                      |
|                                                          |
| LastModified: Feb 8, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from './ByteStream';
import { ArrayDeserializer } from './deserializers/ArrayDeserializer';
import {
    Uint8ArrayDeserializer,
    Uint8ClampedArrayDeserializer,
    Uint16ArrayDeserializer,
    Uint32ArrayDeserializer,
    Int8ArrayDeserializer,
    Int16ArrayDeserializer,
    Int32ArrayDeserializer,
    Float32ArrayDeserializer,
    Float64ArrayDeserializer
} from './deserializers/TypedArrayDeserializer';
import { FunctionDeserializer } from './deserializers/FunctionDeserializer';
import { NumberDeserializer } from './deserializers/NumberDeserializer';
import { BooleanDeserializer } from './deserializers/BooleanDeserializer';
import { StringDeserializer } from './deserializers/StringDeserializer';
import { DateDeserializer } from './deserializers/DateDeserializer';
import { ByteStreamDeserializer } from './deserializers/ByteStreamDeserializer';
import { SetDeserializer } from './deserializers/SetDeserializer';
import { MapDeserializer } from './deserializers/MapDeserializer';
import { ErrorDeserializer } from './deserializers/ErrorDeserializer';
import { NullDeserializer } from './deserializers/NullDeserializer';
import { DefaultDeserializer } from './deserializers/DefaultDeserializer';
import { Deserializer } from './deserializers/Deserializer';

const deserializers: Map<Function, Deserializer> = new Map<Function, Deserializer>();

export function register(type: Function, deserializer: Deserializer) {
    deserializers.set(type, deserializer);
}

export function getInstance(type?: Function | null): Deserializer {
    if (type) {
        switch (type) {
            case Function: return FunctionDeserializer.instance;
            case Number: return NumberDeserializer.instance;
            case Boolean: return BooleanDeserializer.instance;
            case String: return StringDeserializer.instance;
            case Date: return DateDeserializer.instance;
            case Array: return ArrayDeserializer.instance;
            case ByteStream: return ByteStreamDeserializer.instance;
            case Uint8Array: return Uint8ArrayDeserializer.instance;
            case Uint8ClampedArray: return Uint8ClampedArrayDeserializer.instance;
            case Uint16Array: return Uint16ArrayDeserializer.instance;
            case Uint32Array: return Uint32ArrayDeserializer.instance;
            case Int8Array: return Int8ArrayDeserializer.instance;
            case Int16Array: return Int16ArrayDeserializer.instance;
            case Int32Array: return Int32ArrayDeserializer.instance;
            case Float32Array: return Float32ArrayDeserializer.instance;
            case Float64Array: return Float64ArrayDeserializer.instance;
            case Set: return SetDeserializer.instance;
            case Map: return MapDeserializer.instance;
            case Error: return ErrorDeserializer.instance;
        }
        const deserializer = deserializers.get(type);
        if (deserializer !== undefined) return deserializer;
    }
    if (type === null) return NullDeserializer.instance;
    return DefaultDeserializer.instance;
}