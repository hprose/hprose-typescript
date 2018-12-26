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
| hprose/io/serializers/NumberSerializer.ts                |
|                                                          |
| hprose number serializer for TypeScript.                 |
|                                                          |
| LastModified: Dec 10, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import WriterInterface from './WriterInterface';
import Serializer from './Serializer';
import { writeInteger, writeDouble } from './ValueWriter';

export default class NumberSerializer extends Serializer<number> {
    public write(writer: WriterInterface, value: number): void {
        value = value.valueOf();
        if (Number.isSafeInteger(value)) {
            writeInteger(writer.stream, value);
        } else {
            writeDouble(writer.stream, value);
        }
    }
}
