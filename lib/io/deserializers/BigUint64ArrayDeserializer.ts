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
| hprose/io/deserializers/BigUint64ArrayDeserializer.ts    |
|                                                          |
| hprose BigUint64Array deserializer for TypeScript.       |
|                                                          |
| LastModified: Dec 26, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ReaderInterface from './ReaderInterface';
import DeserializerInterface from './DeserializerInterface';
import BaseDeserializer from './BaseDeserializer';
import Deserializers from './Deserializers';
import { readBigIntArray } from './ReferenceReader';

if (typeof BigUint64Array !== 'undefined') {
    const empty = new BigUint64Array(0);
    class BigUint64ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
        public static instance: DeserializerInterface = new BigUint64ArrayDeserializer();
        constructor() { super('BigUint64Array'); }
        public read(reader: ReaderInterface, tag: number): BigUint64Array {
            switch (tag) {
                case Tags.TagEmpty: return empty;
                case Tags.TagList: return readBigIntArray(reader, BigUint64Array) as BigUint64Array;
                default:
                    return super.read(reader, tag);
            }
        }
    }
    Deserializers.register(BigUint64Array, BigUint64ArrayDeserializer.instance);
}