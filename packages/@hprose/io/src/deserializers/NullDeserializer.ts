/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| NullDeserializer.ts                                      |
|                                                          |
| hprose null deserializer for TypeScript.                 |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { DefaultDeserializer } from './DefaultDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';

export class NullDeserializer extends DefaultDeserializer implements Deserializer {
    public static instance: Deserializer = new NullDeserializer();
    public read(reader: Reader, tag: number): any {
        if (tag === Tags.TagNull) return null;
        return super.read(reader, tag);
    }
}