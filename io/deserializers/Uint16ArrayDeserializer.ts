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
| hprose/io/deserializers/Uint16ArrayDeserializer.ts       |
|                                                          |
| hprose Uint16Array deserializer for TypeScript.          |
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

const empty = new Uint16Array(0);

export default class Uint16ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new Uint16ArrayDeserializer();
    constructor() { super('Uint16Array'); }
    public read(reader: ReaderInterface, tag: number): Uint16Array {
        switch (tag) {
            case Tags.TagEmpty: return empty;
            case Tags.TagList: return ReferenceReader.readIntArray(reader, Uint16Array) as Uint16Array;
            default:
                return super.read(reader, tag);
        }
     }
}