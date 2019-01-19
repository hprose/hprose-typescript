/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| hprose/io/Formatter.ts                                   |
|                                                          |
| hprose Formatter for TypeScript.                         |
|                                                          |
| LastModified: Jan 6, 2019                                |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from './ByteStream';
import { Writer } from './Writer';
import { Reader } from './Reader';

export function serialize(value: any, simple?: boolean, utc?: boolean): ByteStream {
    const stream = new ByteStream();
    const writer = new Writer(stream, simple, utc);
    writer.serialize(value);
    return stream;
}

export function deserialize(stream: ByteStream | string | Uint8Array | Uint8ClampedArray | ArrayLike<number> | ArrayBufferLike, type?: Function | null, simple?: boolean): any {
    if (!(stream instanceof ByteStream)) {
        stream = new ByteStream(stream);
    }
    const reader = new Reader(stream, simple);
    return reader.deserialize(type);
}