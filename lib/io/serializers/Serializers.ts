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
| hprose/io/serializers/Serializers.ts                     |
|                                                          |
| hprose serializers for TypeScript.                       |
|                                                          |
| LastModified: Dec 26, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import ByteStream from '../ByteStream';
import TypeManager from '../TypeManager';
import SerializerInterface from './SerializerInterface';
import Serializer from './Serializer';
import NumberSerializer from './NumberSerializer';
import BigIntSerializer from './BigIntSerializer';
import BooleanSerializer from './BooleanSerializer';
import StringSerializer from './StringSerializer';
import DateSerializer from './DateSerializer';
import BytesSerializer from './BytesSerializer';
import GuidSerializer from './GuidSerializer';
import TypedArraySerializer from './TypedArraySerializer';
import ArraySerializer from './ArraySerializer';
import SetSerializer from './SetSerializer';
import MapSerializer from './MapSerializer';
import DictionarySerializer from './DictionarySerializer';
import ObjectSerializer from './ObjectSerializer';
import { writeInteger, writeDouble } from './ValueWriter';
import { Guid } from 'guid-typescript';

const serializers = new Map<Function, SerializerInterface>();
const nullSerializer = new Serializer<any>();
const numberSerializer = new NumberSerializer();
const bigintSerializer = new BigIntSerializer();
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

function register(type: Function, serializer: SerializerInterface) {
    serializers.set(type, serializer);
}

function getInstance<T>(value: T): SerializerInterface {
    const type = value.constructor;
    switch (type) {
        case Function: return nullSerializer;
        case Number: return numberSerializer;
        case BigInt: return bigintSerializer;
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
    }
    const serializer = serializers.get(type);
    if (serializer !== undefined) return serializer;
    if (Array.isArray(value) || Object.prototype.toString.call(value) === '[object Arguments]') return arraySerializer;
    const name = TypeManager.getName(type);
    if (name === '') return dictionarySerializer;
    if (name === 'GeneratorFunction') return nullSerializer;
    if (name === 'AsyncFunction') return nullSerializer;
    const objectSerializer = new ObjectSerializer<T>(value, name);
    register(type, objectSerializer);
    return objectSerializer;
}

export default { register, getInstance };