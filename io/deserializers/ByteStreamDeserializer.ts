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
| hprose/io/deserializers/ByteStreamDeserializer.ts        |
|                                                          |
| hprose ByteStream deserializer for TypeScript.           |
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

const empty = new ByteStream(0);

export default class ByteStreamDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new ByteStreamDeserializer();
    constructor() { super('ByteStream'); }
    public read(reader: ReaderInterface, tag: number): ByteStream {
        switch (tag) {
            case Tags.TagBytes: return new ByteStream(ReferenceReader.readBytes(reader));
            case Tags.TagEmpty: return new ByteStream(0);
            case Tags.TagList: return new ByteStream(ReferenceReader.readIntArray(reader, Uint8Array) as Uint8Array);
            case Tags.TagUTF8Char: return new ByteStream(reader.stream.readString(1));
            case Tags.TagString: return new ByteStream(ReferenceReader.readString(reader));
            default:
                return super.read(reader, tag);
        }
    }
}