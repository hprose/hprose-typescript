/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| StringDeserializer.ts                                    |
|                                                          |
| hprose string deserializer for TypeScript.               |
|                                                          |
| LastModified: Mar 29, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';
import * as ValueReader from '../ValueReader';
import * as ReferenceReader from '../ReferenceReader';

export class StringDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new StringDeserializer();
    constructor() { super('string'); }
    public read(reader: Reader, tag: number): string {
        if (tag >= 0x30 && tag <= 0x39) {
            return String.fromCharCode(tag);
        }
        const stream = reader.stream;
        switch (tag) {
            case Tags.TagInteger:
            case Tags.TagLong:
            case Tags.TagDouble: return stream.readUntil(Tags.TagSemicolon);
            case Tags.TagString: return ReferenceReader.readString(reader);
            case Tags.TagBytes: return ReferenceReader.readAsciiString(reader);
            case Tags.TagTrue: return 'true';
            case Tags.TagFalse: return 'false';
            case Tags.TagEmpty: return '';
            case Tags.TagDate: return ReferenceReader.readDateTime(reader).toString();
            case Tags.TagTime: return ReferenceReader.readTime(reader).toTimeString();
            case Tags.TagGuid: return ReferenceReader.readGuid(reader).toString();
            case Tags.TagNaN: return 'NaN';
            case Tags.TagInfinity: return ValueReader.readInfinity(stream).toString();
            case Tags.TagUTF8Char: return stream.readString(1);
            case Tags.TagList: return ReferenceReader.readArray(reader).join('');
            case Tags.TagRef: return reader.readReference().toString();
            default: return super.read(reader, tag);
        }
    }
}