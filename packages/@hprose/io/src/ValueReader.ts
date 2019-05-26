/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ValueReader.ts                                           |
|                                                          |
| hprose value reader for TypeScript.                      |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from './ByteStream';
import { Tags } from './Tags';
import { Guid } from 'guid-typescript';

export function readInt(stream: ByteStream, tag: number = Tags.TagSemicolon): number {
    const s = stream.readUntil(tag);
    if (s.length === 0) return 0;
    return parseInt(s, 10);
}

export function readDouble(stream: ByteStream): number {
    return parseFloat(stream.readUntil(Tags.TagSemicolon));
}

export function readInfinity(stream: ByteStream): number {
    return ((stream.readByte() === Tags.TagNeg) ? -Infinity : Infinity);
}

export function readCount(stream: ByteStream): number {
    return readInt(stream, Tags.TagOpenbrace);
}

export function readLength(stream: ByteStream): number {
    return readInt(stream, Tags.TagQuote);
}

export function readString(stream: ByteStream): string {
    const n = readLength(stream);
    const result = stream.readString(n);
    stream.readByte();
    return result;
}

export function readBytes(stream: ByteStream): Uint8Array {
    const n = readLength(stream);
    const result = stream.read(n);
    stream.readByte();
    return result;
}

export function readAsciiString(stream: ByteStream): string {
    const n = readLength(stream);
    const result = stream.readAsciiString(n);
    stream.readByte();
    return result;
}

export function readGuid(stream: ByteStream): Guid {
    stream.readByte();
    const result = Guid.parse(stream.readAsciiString(36));
    stream.readByte();
    return result;
}

function read4Digit(stream: ByteStream): number {
    let n = stream.readByte() - 0x30;
    n = n * 10 + stream.readByte() - 0x30;
    n = n * 10 + stream.readByte() - 0x30;
    return n * 10 + stream.readByte() - 0x30;
}

function read2Digit(stream: ByteStream): number {
    let n = stream.readByte() - 0x30;
    return n * 10 + stream.readByte() - 0x30;
}

function readMillisecond(stream: ByteStream): [number, number] {
    let millisecond = stream.readByte() - 0x30;
    millisecond = millisecond * 10 + stream.readByte() - 0x30;
    millisecond = millisecond * 10 + stream.readByte() - 0x30;
    let tag = stream.readByte();
    if ((tag >= 0x30) && (tag <= 0x39)) {
        stream.skip(2);
        tag = stream.readByte();
        if ((tag >= 0x30) && (tag <= 0x39)) {
            stream.skip(2);
            tag = stream.readByte();
        }
    }
    return [millisecond, tag];
}

export function readTime(stream: ByteStream): Date {
    const hour = read2Digit(stream);
    const minute = read2Digit(stream);
    const second = read2Digit(stream);
    let millisecond = 0;
    let tag = stream.readByte();
    if (tag === Tags.TagPoint) {
        [millisecond, tag] = readMillisecond(stream);
    }
    if (tag === Tags.TagUTC) {
        return new Date(Date.UTC(1970, 0, 1, hour, minute, second, millisecond));
    }
    return new Date(1970, 0, 1, hour, minute, second, millisecond);
}

export function readDateTime(stream: ByteStream): Date {
    const year = read4Digit(stream);
    const month = read2Digit(stream) - 1;
    const day = read2Digit(stream);
    let tag = stream.readByte();
    if (tag === Tags.TagTime) {
        const hour = read2Digit(stream);
        const minute = read2Digit(stream);
        const second = read2Digit(stream);
        let millisecond = 0;
        tag = stream.readByte();
        if (tag === Tags.TagPoint) {
            [millisecond, tag] = readMillisecond(stream);
        }
        if (tag === Tags.TagUTC) {
            return new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));
        }
        return new Date(year, month, day, hour, minute, second, millisecond);
    }
    if (tag === Tags.TagUTC) {
        return new Date(Date.UTC(year, month, day));
    }
    return new Date(year, month, day);
}