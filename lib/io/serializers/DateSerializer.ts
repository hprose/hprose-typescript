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
| hprose/io/serializers/DateSerializer.ts                  |
|                                                          |
| hprose Date serializer for TypeScript.                   |
|                                                          |
| LastModified: Dec 10, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import WriterInterface from './WriterInterface';
import ReferenceSerializer from './ReferenceSerializer';
import { writeUTCDate, writeLocalDate } from './ValueWriter';

export default class DateSerializer extends ReferenceSerializer<Date> {
    public write(writer: WriterInterface, value: Date): void {
        super.write(writer, value);
        const stream = writer.stream;
        writer.utc ? writeUTCDate(stream, value) : writeLocalDate(stream, value);
    }
}