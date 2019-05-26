/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ErrorDeserializer.ts                                     |
|                                                          |
| hprose Error deserializer for TypeScript.                |
|                                                          |
| LastModified: Feb 8, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';

export class ErrorDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new ErrorDeserializer();
    constructor() { super('Error'); }
    public read(reader: Reader, tag: number): Error {
        switch (tag) {
            case Tags.TagError: return new Error(reader.deserialize(String));
            default: return super.read(reader, tag);
        }
    }
}