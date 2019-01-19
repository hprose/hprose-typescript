/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/io/deserializers/DateDeserializer.ts              |
|                                                          |
| hprose date deserializer for TypeScript.                 |
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

export class DateDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new DateDeserializer();
    constructor() { super('Date'); }
    public read(reader: Reader, tag: number): Date {
        const stream = reader.stream;
        switch (tag) {
            case Tags.TagDate: return ReferenceReader.readDateTime(reader);
            case Tags.TagTime: return ReferenceReader.readTime(reader);
            case Tags.TagInteger: return new Date(ValueReader.readInt(stream));
            case Tags.TagLong: return new Date(ValueReader.readInt(stream));
            case Tags.TagDouble: return new Date(Math.floor(ValueReader.readDouble(stream)));
            case Tags.TagString: return new Date(ReferenceReader.readString(reader));
            case Tags.TagTrue: return new Date(1);
            case Tags.TagFalse:
            case Tags.TagEmpty: return new Date(0);
            default:
                if (tag >= 0x30 && tag <= 0x39) {
                    return new Date(tag - 0x30);
                }
                return super.read(reader, tag);
        }
    }
}