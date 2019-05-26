/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| Formatter.ts                                             |
|                                                          |
| hprose Formatter for TypeScript.                         |
|                                                          |
| LastModified: Feb 17, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from './ByteStream';
import { Writer } from './Writer';
import { Reader } from './Reader';

export function serialize(value: any, simple?: boolean, utc?: boolean): Uint8Array {
    const stream = new ByteStream();
    const writer = new Writer(stream, simple, utc);
    writer.serialize(value);
    return stream.bytes;
}

export function deserialize(stream: ByteStream | string | Uint8Array | Uint8ClampedArray | ArrayLike<number> | ArrayBufferLike, type?: Function | null, simple?: boolean): any {
    if (!(stream instanceof ByteStream)) {
        stream = new ByteStream(stream);
    }
    const reader = new Reader(stream, simple);
    return reader.deserialize(type);
}