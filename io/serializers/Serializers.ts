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
| LastModified: Dec 14, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import ByteStream from '../ByteStream';
import TypeManager from '../TypeManager';
import SerializerInterface from './SerializerInterface';
import Serializer from './Serializer';
import NumberSerializer from './NumberSerializer';
import BooleanSerializer from './BooleanSerializer';
import StringSerializer from './StringSerializer';
import DateSerializer from './DateSerializer';
import BytesSerializer from './BytesSerializer';
import NumberArraySerializer from './NumberArraySerializer';
import ArraySerializer from './ArraySerializer';
import SetSerializer from './SetSerializer';
import MapSerializer from './MapSerializer';
import DictionarySerializer from './DictionarySerializer';
import ObjectSerializer from './ObjectSerializer';
import { writeInteger, writeDouble } from './ValueWriter';

const serializers: Map<Function, SerializerInterface> = new Map<Function, SerializerInterface>();
const nullSerializer: SerializerInterface = new Serializer<any>();
const numberSerializer: SerializerInterface = new NumberSerializer();
const booleanSerializer: SerializerInterface = new BooleanSerializer();
const stringSerializer: SerializerInterface = new StringSerializer();
const dateSerializer: SerializerInterface = new DateSerializer();
const bytesSerializer: SerializerInterface = new BytesSerializer();
const intArraySerializer: SerializerInterface = new NumberArraySerializer(writeInteger);
const doubleArraySerializer: SerializerInterface = new NumberArraySerializer(writeDouble);
const arraySerializer: SerializerInterface = new ArraySerializer();
const setSerializer: SerializerInterface = new SetSerializer();
const mapSerializer: SerializerInterface = new MapSerializer();
const dictionarySerializer: SerializerInterface = new DictionarySerializer();

function register(type: Function, serializer: SerializerInterface) {
    serializers.set(type, serializer);
}

function getInstance<T>(value: T): SerializerInterface {
    const type = value.constructor;
    switch (type) {
        case Function: return nullSerializer;
        case Number: return numberSerializer;
        case Boolean: return booleanSerializer;
        case String: return stringSerializer;
        case Date: return dateSerializer;
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
    if (name === 'GeneratorFunction') return nullSerializer;
    if (name === '') return dictionarySerializer;
    const objectSerializer: SerializerInterface = new ObjectSerializer<T>(value, name);
    register(type, objectSerializer);
    return objectSerializer;
}

export default { register, getInstance };