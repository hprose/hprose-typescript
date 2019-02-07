/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ErrorSerializer.ts                                       |
|                                                          |
| hprose error serializer for TypeScript.                  |
|                                                          |
| LastModified: Feb 8, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { Tags } from '../Tags';
import { ReferenceSerializer } from './ReferenceSerializer';
import { Writer } from './Writer';
import { writeStringBody } from '../ValueWriter';

export class ErrorSerializer extends ReferenceSerializer<Error> {
    public write(writer: Writer, value: Error): void {
        super.write(writer, value);
        const stream = writer.stream;
        stream.writeByte(Tags.TagError);
        stream.writeByte(Tags.TagString);
        writeStringBody(stream, value.message);
    }
}
