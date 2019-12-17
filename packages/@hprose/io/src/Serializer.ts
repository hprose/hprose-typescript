/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Serializer.ts                                            |
|                                                          |
| hprose Serializer for TypeScript.                        |
|                                                          |
| LastModified: Dec 18, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from './ByteStream';
import { Serializer } from './serializers/Serializer';
import { BaseSerializer } from './serializers/BaseSerializer';
import { NumberSerializer } from './serializers/NumberSerializer';
import { BooleanSerializer } from './serializers/BooleanSerializer';
import { StringSerializer } from './serializers/StringSerializer';
import { DateSerializer } from './serializers/DateSerializer';
import { BytesSerializer } from './serializers/BytesSerializer';
import { GuidSerializer } from './serializers/GuidSerializer';
import { TypedArraySerializer } from './serializers/TypedArraySerializer';
import { ArraySerializer } from './serializers/ArraySerializer';
import { SetSerializer } from './serializers/SetSerializer';
import { MapSerializer } from './serializers/MapSerializer';
import { DictionarySerializer } from './serializers/DictionarySerializer';
import { ObjectSerializer } from './serializers/ObjectSerializer';
import { ErrorSerializer } from './serializers/ErrorSerializer';
import * as TypeManager from './TypeManager';
import { writeInteger, writeDouble } from './ValueWriter';
import { Guid } from 'guid-typescript';

const serializers = new Map<Function, Serializer>();
const nullSerializer = new BaseSerializer<any>();
const numberSerializer = new NumberSerializer();
const booleanSerializer = new BooleanSerializer();
const stringSerializer = new StringSerializer();
const dateSerializer = new DateSerializer();
const bytesSerializer = new BytesSerializer();
const guidSerializer = new GuidSerializer();
const intArraySerializer = new TypedArraySerializer(writeInteger);
const doubleArraySerializer = new TypedArraySerializer(writeDouble);
const arraySerializer = new ArraySerializer();
const setSerializer = new SetSerializer();
const mapSerializer = new MapSerializer();
const dictionarySerializer = new DictionarySerializer();
const errorSerializer = new ErrorSerializer();

export function register(type: Function, serializer: Serializer) {
    serializers.set(type, serializer);
}

export function getInstance<T>(value: T): Serializer {
    const type = (value as any).constructor;
    switch (type) {
        case Function: return nullSerializer;
        case Number: return numberSerializer;
        case Boolean: return booleanSerializer;
        case String: return stringSerializer;
        case Date: return dateSerializer;
        case Guid: return guidSerializer;
        case Array: return arraySerializer;
        case Set: return setSerializer;
        case Map: return mapSerializer;
        case ArrayBuffer:
        case Uint8Array:
        case Uint8ClampedArray:
        case ByteStream: return bytesSerializer;
        case Int8Array:
        case Int16Array:
        case Int32Array:
        case Uint16Array:
        case Uint32Array: return intArraySerializer;
        case Float32Array:
        case Float64Array: return doubleArraySerializer;
        case Error: return errorSerializer;
    }
    const serializer = serializers.get(type);
    if (serializer !== undefined) return serializer;
    if (Array.isArray(value) || Object.prototype.toString.call(value) === '[object Arguments]') return arraySerializer;
    if (value instanceof Error) {
        register(type, errorSerializer);
        return errorSerializer;
    }
    const name = TypeManager.getName(type);
    if (name === '') return dictionarySerializer;
    if (name === 'GeneratorFunction') return nullSerializer;
    if (name === 'AsyncFunction') return nullSerializer;
    const objectSerializer = new ObjectSerializer<T>(value, name);
    register(type, objectSerializer);
    return objectSerializer;
}