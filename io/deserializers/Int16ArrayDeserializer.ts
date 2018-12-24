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
| hprose/io/deserializers/Int16ArrayDeserializer.ts        |
|                                                          |
| hprose Int16Array deserializer for TypeScript.           |
|                                                          |
| LastModified: Dec 21, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ReaderInterface from './ReaderInterface';
import DeserializerInterface from './DeserializerInterface';
import BaseDeserializer from './BaseDeserializer';
import * as ReferenceReader from './ReferenceReader';

const empty = new Int16Array(0);

export default class Int16ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new Int16ArrayDeserializer();
    constructor() { super('Int16Array'); }
    public read(reader: ReaderInterface, tag: number): Int16Array {
        switch (tag) {
            case Tags.TagEmpty: return empty;
            case Tags.TagList: return ReferenceReader.readIntArray(reader, Int16Array) as Int16Array;
            default:
                return super.read(reader, tag);
        }
     }
}