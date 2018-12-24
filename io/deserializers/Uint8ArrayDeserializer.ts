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
| hprose/io/deserializers/Uint8ArrayDeserializer.ts        |
|                                                          |
| hprose Uint8Array deserializer for TypeScript.           |
|                                                          |
| LastModified: Dec 20, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import Tags from '../Tags';
import ByteStream from '../ByteStream';
import ReaderInterface from './ReaderInterface';
import DeserializerInterface from './DeserializerInterface';
import BaseDeserializer from './BaseDeserializer';
import * as ReferenceReader from './ReferenceReader';

const empty = new Uint8Array(0);

export default class Uint8ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new Uint8ArrayDeserializer();
    constructor() { super('Uint8Array'); }
    public read(reader: ReaderInterface, tag: number): Uint8Array {
        switch (tag) {
            case Tags.TagBytes: return ReferenceReader.readBytes(reader);
            case Tags.TagEmpty: return empty;
            case Tags.TagList: return ReferenceReader.readIntArray(reader, Uint8Array) as Uint8Array;
            case Tags.TagUTF8Char: return new ByteStream(reader.stream.readString(1)).bytes;
            case Tags.TagString: return new ByteStream(ReferenceReader.readString(reader)).bytes;
            default:
                return super.read(reader, tag);
        }
    }
}