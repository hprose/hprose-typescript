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
| hprose/io/deserializers/BigInt64ArrayDeserializer.ts     |
|                                                          |
| hprose BigInt64Array deserializer for TypeScript.        |
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

if (typeof BigInt64Array !== 'undefined') {
    const empty = new BigInt64Array(0);
    class BigInt64ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
        public static instance: DeserializerInterface = new BigInt64ArrayDeserializer();
        constructor() { super('BigInt64Array'); }
        public read(reader: ReaderInterface, tag: number): BigInt64Array {
            switch (tag) {
                case Tags.TagEmpty: return empty;
                case Tags.TagList: return readBigIntArray(reader, BigInt64Array) as BigInt64Array;
                default:
                    return super.read(reader, tag);
            }
        }
    }
    Deserializers.register(BigInt64Array, BigInt64ArrayDeserializer.instance);
}