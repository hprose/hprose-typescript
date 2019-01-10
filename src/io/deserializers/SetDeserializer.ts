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
| hprose/io/deserializers/SetDeserializer.ts               |
|                                                          |
| hprose Set deserializer for TypeScript.                  |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { BaseDeserializer } from './BaseDeserializer';
import { Deserializer } from './Deserializer';
import { Reader } from './Reader';
import { readSet } from '../ReferenceReader';

export class SetDeserializer extends BaseDeserializer implements Deserializer {
    public static instance: Deserializer = new SetDeserializer();
    constructor() { super('Set'); }
    public read(reader: Reader, tag: number): Set<any> {
        switch (tag) {
            case Tags.TagEmpty: return new Set();
            case Tags.TagList: return readSet(reader);
            default:
                return super.read(reader, tag);
        }
     }
}