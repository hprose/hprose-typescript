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
| hprose/io/deserializers/Uint32ArrayDeserializer.ts       |
|                                                          |
| hprose Uint32Array deserializer for TypeScript.          |
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

const empty = new Uint32Array(0);

export default class Uint32ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new Uint32ArrayDeserializer();
    constructor() { super('Uint32Array'); }
    public read(reader: ReaderInterface, tag: number): Uint32Array {
        switch (tag) {
            case Tags.TagEmpty: return empty;
            case Tags.TagList: return ReferenceReader.readIntArray(reader, Uint32Array) as Uint32Array;
            default:
                return super.read(reader, tag);
        }
     }
}