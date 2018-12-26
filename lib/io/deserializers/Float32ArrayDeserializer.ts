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
| hprose/io/deserializers/Float32ArrayDeserializer.ts      |
|                                                          |
| hprose Float32Array deserializer for TypeScript.         |
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

const empty = new Float32Array(0);

export default class Float32ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new Float32ArrayDeserializer();
    constructor() { super('Float32Array'); }
    public read(reader: ReaderInterface, tag: number): Float32Array {
        switch (tag) {
            case Tags.TagEmpty: return empty;
            case Tags.TagList: return ReferenceReader.readNumberArray(reader, Float32Array) as Float32Array;
            default:
                return super.read(reader, tag);
        }
     }
}