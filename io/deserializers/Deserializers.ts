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
| hprose/io/deserializers/Deserializers.ts                 |
|                                                          |
| hprose deserializers for TypeScript.                     |
|                                                          |
| LastModified: Dec 16, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import ByteStream from '../ByteStream';
import DeserializerInterface from './DeserializerInterface';
import Deserializer from './Deserializer';
import FunctionDeserializer from './FunctionDeserializer';
import NumberDeserializer from './NumberDeserializer';
import BooleanDeserializer from './BooleanDeserializer';
import StringDeserializer from './StringDeserializer';
import DateDeserializer from './DateDeserializer';
import ArrayDeserializer from './ArrayDeserializer';
import Uint8ArrayDeserializer from './Uint8ArrayDeserializer';
import Uint8ClampedArrayDeserializer from './Uint8ClampedArrayDeserializer';
import Uint16ArrayDeserializer from './Uint16ArrayDeserializer';
import Uint32ArrayDeserializer from './Uint32ArrayDeserializer';
import Int8ArrayDeserializer from './Int8ArrayDeserializer';
import Int16ArrayDeserializer from './Int16ArrayDeserializer';
import Int32ArrayDeserializer from './Int32ArrayDeserializer';
import Float32ArrayDeserializer from './Float32ArrayDeserializer';
import Float64ArrayDeserializer from './Float64ArrayDeserializer';
import SetDeserializer from './SetDeserializer';
import MapDeserializer from './MapDeserializer';
import ByteStreamDeserializer from './ByteStreamDeserializer';

const deserializers: Map<Function, DeserializerInterface> = new Map<Function, DeserializerInterface>();

function register(type: Function, deserializer: DeserializerInterface) {
    deserializers.set(type, deserializer);
}

function getInstance(type?: Function): DeserializerInterface {
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
        }
        const deserializer = deserializers.get(type);
        if (deserializer !== undefined) return deserializer;
    }
    return Deserializer.instance;
 }

export default { register, getInstance };