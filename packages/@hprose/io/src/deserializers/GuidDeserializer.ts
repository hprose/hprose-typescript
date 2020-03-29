/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| GuidDeserializer.ts                                      |
|                                                          |
| hprose Guid deserializer for TypeScript.                 |
|                                                          |
| LastModified: Mar 29, 2020                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';
import * as ReferenceReader from '../ReferenceReader';
import { Guid } from 'guid-typescript';

export class GuidDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new GuidDeserializer();
    constructor() { super('Guid'); }
    public read(reader: Reader, tag: number): Guid {
        switch (tag) {
            case Tags.TagGuid: return ReferenceReader.readGuid(reader);
            case Tags.TagString: return Guid.parse(ReferenceReader.readString(reader));
            case Tags.TagRef: {
                const result = reader.readReference();
                if (result instanceof Guid) {
                    return result;
                } else {
                    return Guid.parse(result.toString());
                }
            }
            default: return super.read(reader, tag);
        }
    }
}