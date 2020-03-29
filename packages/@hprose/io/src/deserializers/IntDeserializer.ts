/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| IntDeserializer.ts                                       |
|                                                          |
| hprose int deserializer for TypeScript.                  |
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

export class IntDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new IntDeserializer();
    constructor() { super('int'); }
    public read(reader: Reader, tag: number): number {
        if (tag >= 0x30 && tag <= 0x39) {
            return tag - 0x30;
        }
        const stream = reader.stream;
        switch (tag) {
            case Tags.TagInteger:
            case Tags.TagLong: return ValueReader.readInt(stream);
            case Tags.TagDouble: return Math.floor(ValueReader.readDouble(stream));
            case Tags.TagTrue: return 1;
            case Tags.TagFalse:
            case Tags.TagEmpty: return 0;
            case Tags.TagString: return parseInt(ReferenceReader.readString(reader));
            case Tags.TagUTF8Char: return stream.readString(1).charCodeAt(1);
            case Tags.TagDate: return ReferenceReader.readDateTime(reader).getTime();
            case Tags.TagTime: return ReferenceReader.readTime(reader).getTime();
            case Tags.TagRef: {
                const result = reader.readReference();
                if (result instanceof Date) {
                    return result.getTime();
                } else {
                    return parseInt(result.toString());
                }
            }
            default: return super.read(reader, tag);
        }
    }
}