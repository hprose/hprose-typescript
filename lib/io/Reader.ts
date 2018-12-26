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
| hprose/io/Reader.ts                                      |
|                                                          |
| hprose Reader for TypeScript.                            |
|                                                          |
| LastModified: Dec 26, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import ByteStream from './ByteStream';
import PrivateReader from './deserializers/Reader';

export default class Reader {
    private readonly reader: PrivateReader;
    constructor(stream: ByteStream, simple: boolean = false) {
        this.reader = new PrivateReader(stream, simple);
    }
    public get stream(): ByteStream {
        return this.reader.stream;
    }
    public get longType(): 'number' | 'bigint' | 'string' {
        return this.reader.longType;
    }
    public set longType(value: 'number' | 'bigint' | 'string') {
        this.reader.longType = value;
    }
    public get dictType(): 'object' | 'map' {
        return this.reader.dictType;
    }
    public set dictType(value: 'object' | 'map') {
        this.reader.dictType = value;
    }
    deserialize(type?: Function | null): any {
        return this.reader.deserialize(type);
    }
    read(tag: number, type?: Function | null): any {
        return this.reader.read(tag, type);
    }
    reset(): void {
        this.reader.reset();
    }
}