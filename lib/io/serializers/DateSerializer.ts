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
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from "./Writer";
import { writeUTCDate, writeLocalDate } from './ValueWriter';

export class DateSerializer extends ReferenceSerializer<Date> {
    public write(writer: Writer, value: Date): void {
        super.write(writer, value);
        const stream = writer.stream;
        writer.utc ? writeUTCDate(stream, value) : writeLocalDate(stream, value);
    }
}