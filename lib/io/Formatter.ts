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
| hprose/io/Formatter.ts                                   |
|                                                          |
| hprose Formatter for TypeScript.                         |
|                                                          |
| LastModified: Dec 26, 2018                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import ByteStream from "./ByteStream";
import Writer from "./serializers/Writer";
import Reader from "./deserializers/Reader";

function serialize(value: any, simple?: boolean, utc?: boolean): ByteStream {
    const stream = new ByteStream();
    const writer = new Writer(stream, simple, utc);
    writer.serialize(value);
    return stream;
}

function deserialize(stream: ByteStream | string | Uint8Array | Uint8ClampedArray | ArrayLike<number> | ArrayBufferLike, type?: Function | null, simple?: boolean): any {
    if (!(stream instanceof ByteStream)) {
        stream = new ByteStream(stream);
    }
    const reader = new Reader(stream, simple);
    return reader.deserialize(type);
}

export default { serialize, deserialize };