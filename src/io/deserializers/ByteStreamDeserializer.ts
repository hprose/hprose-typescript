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
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ByteStream } from '../ByteStream';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';
import { readIntArray } from './TypedArrayDeserializer';
import { readBytes, readString } from '../ReferenceReader';

export class ByteStreamDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new ByteStreamDeserializer();
    constructor() { super('ByteStream'); }
    public read(reader: Reader, tag: number): ByteStream {
        switch (tag) {
            case Tags.TagBytes: return new ByteStream(readBytes(reader));
            case Tags.TagEmpty: return new ByteStream(0);
            case Tags.TagList: return new ByteStream(readIntArray(reader, Uint8Array) as Uint8Array);
            case Tags.TagUTF8Char: return new ByteStream(reader.stream.readString(1));
            case Tags.TagString: return new ByteStream(readString(reader));
            default:
                return super.read(reader, tag);
        }
    }
}