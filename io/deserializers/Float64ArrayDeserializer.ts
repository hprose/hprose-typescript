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
| hprose/io/deserializers/Float64ArrayDeserializer.ts      |
|                                                          |
| hprose Float64Array deserializer for TypeScript.         |
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

const empty = new Float64Array(0);

export default class Float64ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new Float64ArrayDeserializer();
    constructor() { super('Float64Array'); }
    public read(reader: ReaderInterface, tag: number): Float64Array {
        switch (tag) {
            case Tags.TagEmpty: return empty;
            case Tags.TagList: return ReferenceReader.readNumberArray(reader, Float64Array) as Float64Array;
            default:
                return super.read(reader, tag);
        }
     }
}