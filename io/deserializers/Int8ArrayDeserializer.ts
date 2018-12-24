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
| hprose/io/deserializers/Int8ArrayDeserializer.ts         |
|                                                          |
| hprose Int8Array deserializer for TypeScript.            |
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

const empty = new Int8Array(0);

export default class Int8ArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new Int8ArrayDeserializer();
    constructor() { super('Int8Array'); }
    public read(reader: ReaderInterface, tag: number): Int8Array {
        let bytes: Uint8Array;
        switch (tag) {
            case Tags.TagEmpty: return empty;
            case Tags.TagList: return ReferenceReader.readIntArray(reader, Int8Array) as Int8Array;
            case Tags.TagBytes: bytes = ReferenceReader.readBytes(reader); break;
            case Tags.TagUTF8Char: bytes = new ByteStream(reader.stream.readString(1)).bytes; break;
            case Tags.TagString: bytes = new ByteStream(ReferenceReader.readString(reader)).bytes; break;
            default:
                return super.read(reader, tag);
        }
        return new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length);
    }
}