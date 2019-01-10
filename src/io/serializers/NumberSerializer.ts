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
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { BaseSerializer } from './BaseSerializer';
import { Writer } from './Writer';
import { writeInteger, writeDouble } from '../ValueWriter';

export class NumberSerializer extends BaseSerializer<number> {
    public write(writer: Writer, value: number): void {
        value = value.valueOf();
        if (Number.isSafeInteger(value)) {
            writeInteger(writer.stream, value);
        } else {
            writeDouble(writer.stream, value);
        }
    }
}
