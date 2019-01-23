/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ValueWriter.ts                                           |
|                                                          |
| hprose value writer for TypeScript.                      |
|                                                          |
| LastModified: Jan 11, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

import { ByteStream } from './ByteStream';
import { Tags } from './Tags';

export function writeInteger(stream: ByteStream, value: number): void {
    if (0 <= value && value <= 9) {
        stream.writeByte(0x30 + value);
    } else {
        if (value === (value | 0)) {
            stream.writeByte(Tags.TagInteger);
        } else {
            stream.writeByte(Tags.TagLong);
        }
        stream.writeAsciiString('' + value);
        stream.writeByte(Tags.TagSemicolon);
    }
}

export function writeDouble(stream: ByteStream, value: number): void {
    if (isNaN(value)) {
        stream.writeByte(Tags.TagNaN);
    } else if (isFinite(value)) {
        stream.writeByte(Tags.TagDouble);
        stream.writeAsciiString('' + value);
        stream.writeByte(Tags.TagSemicolon);
    } else {
        stream.writeByte(Tags.TagInfinity);
        stream.writeByte((value > 0) ? Tags.TagPos : Tags.TagNeg);
    }
}

export function writeBigInt(stream: ByteStream, value: bigint): void {
    if (0 <= value && value <= 9) {
        stream.writeByte(0x30 + Number(value));
    } else {
        stream.writeByte(Tags.TagLong);
        stream.writeAsciiString('' + value);
        stream.writeByte(Tags.TagSemicolon);
    }
}

export function writeStringBody(stream: ByteStream, value: string) {
    const n = value.length;
    if (n > 0) stream.writeAsciiString('' + n);
    stream.writeByte(Tags.TagQuote);
    stream.writeString(value);
    stream.writeByte(Tags.TagQuote);
}

export function writeUTCDate(stream: ByteStream, value: Date) {
    const year = value.getUTCFullYear();
    const month = value.getUTCMonth() + 1;
    const day = value.getUTCDate();
    const hour = value.getUTCHours();
    const minute = value.getUTCMinutes();
    const second = value.getUTCSeconds();
    const millisecond = value.getUTCMilliseconds();
    writeDateTime(stream, year, month, day, hour, minute, second, millisecond, true);
}

export function writeLocalDate(stream: ByteStream, value: Date) {
    const year = value.getFullYear();
    const month = value.getMonth() + 1;
    const day = value.getDate();
    const hour = value.getHours();
    const minute = value.getMinutes();
    const second = value.getSeconds();
    const millisecond = value.getMilliseconds();
    writeDateTime(stream, year, month, day, hour, minute, second, millisecond, false);
}

export function writeDateTime(stream: ByteStream, year: number, month: number, day: number, hour: number, minute: number, second: number, millisecond: number, utc: boolean) {
    if ((hour === 0) && (minute === 0) && (second === 0) && (millisecond === 0)) {
        writeDate(stream, year, month, day);
    } else if ((year === 1970) && (month === 1) && (day === 1)) {
        writeTime(stream, hour, minute, second, millisecond);
    } else {
        writeDate(stream, year, month, day);
        writeTime(stream, hour, minute, second, millisecond);
    }
    stream.writeByte(utc ? Tags.TagUTC : Tags.TagSemicolon);
}

export function writeDate(stream: ByteStream, year: number, month: number, day: number) {
    stream.writeByte(Tags.TagDate);
    stream.writeAsciiString(('0000' + year).slice(-4));
    stream.writeAsciiString(('00' + month).slice(-2));
    stream.writeAsciiString(('00' + day).slice(-2));
}

export function writeTime(stream: ByteStream, hour: number, minute: number, second: number, millisecond: number) {
    stream.writeByte(Tags.TagTime);
    stream.writeAsciiString(('00' + hour).slice(-2));
    stream.writeAsciiString(('00' + minute).slice(-2));
    stream.writeAsciiString(('00' + second).slice(-2));
    if (millisecond > 0) {
        stream.writeByte(Tags.TagPoint);
        stream.writeAsciiString(('000' + millisecond).slice(-3));
    }
}

