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
| hprose/io/deserializers/Int32ArrayDeserializer.ts        |
|                                                          |
| hprose Int32Array deserializer for TypeScript.           |
|                                                          |
| LastModified: Dec 24, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ReaderInterface from './ReaderInterface';
import DeserializerInterface from './DeserializerInterface';
import BaseDeserializer from './BaseDeserializer';
import * as ReferenceReader from './ReferenceReader';

const empty = new Int32Array(0);

export default class Int32ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new Int32ArrayDeserializer();
    constructor() { super('Int32Array'); }
    public read(reader: ReaderInterface, tag: number): Int32Array {
        switch (tag) {
            case Tags.TagEmpty: return empty;
            case Tags.TagList: return ReferenceReader.readIntArray(reader, Int32Array) as Int32Array;
            default:
                return super.read(reader, tag);
        }
     }
}