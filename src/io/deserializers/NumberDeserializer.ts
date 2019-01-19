/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/io/deserializers/NumberDeserializer.ts            |
|                                                          |
| hprose number deserializer for TypeScript.               |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';
import * as ValueReader from '../ValueReader';
import * as ReferenceReader from '../ReferenceReader';

export class NumberDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new NumberDeserializer();
    constructor() { super('number'); }
    public read(reader: Reader, tag: number): number {
        if (tag >= 0x30 && tag <= 0x39) {
            return tag - 0x30;
        }
        const stream = reader.stream;
        switch (tag) {
            case Tags.TagInteger:
            case Tags.TagLong: return ValueReader.readInt(stream);
            case Tags.TagDouble: return ValueReader.readDouble(stream);
            case Tags.TagNaN: return NaN;
            case Tags.TagInfinity: return ValueReader.readInfinity(stream);
            case Tags.TagTrue: return 1;
            case Tags.TagFalse:
            case Tags.TagEmpty: return 0;
            case Tags.TagString: return Number(ReferenceReader.readString(reader));
            case Tags.TagUTF8Char: return stream.readString(1).charCodeAt(1);
            case Tags.TagDate: return ReferenceReader.readDateTime(reader).getTime();
            case Tags.TagTime: return ReferenceReader.readTime(reader).getTime();
            default: return super.read(reader, tag);
        }
    }
}