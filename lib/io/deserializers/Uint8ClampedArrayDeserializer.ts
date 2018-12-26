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
| hprose/io/deserializers/Uint8ClampedArrayDeserializer.ts |
|                                                          |
| hprose Uint8ClampedArray deserializer for TypeScript.    |
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

const empty = new Uint8ClampedArray(0);

export default class Uint8ClampedArrayDeserializer extends BaseDeserializer implements DeserializerInterface {
    public static instance: DeserializerInterface = new Uint8ClampedArrayDeserializer();
    constructor() { super('Uint8ClampedArray'); }
    public read(reader: ReaderInterface, tag: number): Uint8ClampedArray {
        let bytes: Uint8Array;
        switch (tag) {
            case Tags.TagEmpty: return empty;
            case Tags.TagList: return ReferenceReader.readIntArray(reader, Uint8ClampedArray) as Uint8ClampedArray;
            case Tags.TagBytes: bytes = ReferenceReader.readBytes(reader); break;
            case Tags.TagUTF8Char: bytes = new ByteStream(reader.stream.readString(1)).bytes; break;
            case Tags.TagString: bytes = new ByteStream(ReferenceReader.readString(reader)).bytes; break;
            default:
                return super.read(reader, tag);
        }
        return new Uint8ClampedArray(bytes.buffer, bytes.byteOffset, bytes.length);
    }
}