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
| hprose/io/Writer.ts                                      |
|                                                          |
| hprose Writer for TypeScript.                            |
|                                                          |
| LastModified: Dec 26, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import ByteStream from './ByteStream';
import PrivateWriter from './serializers/Writer';

export default class Writer {
    private readonly writer: PrivateWriter;
    constructor(stream: ByteStream, simple: boolean = false, utc = false) {
        this.writer = new PrivateWriter(stream, simple, utc);
    }
    public get stream(): ByteStream {
        return this.writer.stream;
    }
    public get utc(): boolean {
        return this.writer.utc;
    }
    public set utc(value: boolean) {
        this.writer.utc = value;
    }
    public serialize<T>(value: T): void {
        this.writer.serialize(value);
    }
    public write<T>(value: T): void {
        this.writer.write(value);
    }
    public reset(): void {
        this.writer.reset();
    }
}