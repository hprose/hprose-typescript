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
| hprose/io/deserializers/ArrayDeserializer.ts             |
|                                                          |
| hprose array deserializer for TypeScript.                |
|                                                          |
| LastModified: Dec 17, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ReaderInterface from './ReaderInterface';
import DeserializerInterface from './DeserializerInterface';
import BaseDeserializer from './BaseDeserializer';
import * as ReferenceReader from './ReferenceReader';

export default class ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new ArrayDeserializer();
    constructor() { super('Array'); }
    public read(reader: ReaderInterface, tag: number): Array<any> {
        switch (tag) {
            case Tags.TagList: return ReferenceReader.readArray(reader);
            case Tags.TagEmpty: return [];
            case Tags.TagString: return ReferenceReader.readString(reader).split('');
            case Tags.TagBytes: return Array.from(ReferenceReader.readBytes(reader));
            default:
                return super.read(reader, tag);
        }
    }
}