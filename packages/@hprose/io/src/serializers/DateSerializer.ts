/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| DateSerializer.ts                                        |
|                                                          |
| hprose Date serializer for TypeScript.                   |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from './Writer';
import { writeUTCDate, writeLocalDate } from '../ValueWriter';

export class DateSerializer extends ReferenceSerializer<Date> {
    public write(writer: Writer, value: Date): void {
        super.write(writer, value);
        const stream = writer.stream;
        writer.utc ? writeUTCDate(stream, value) : writeLocalDate(stream, value);
    }
}