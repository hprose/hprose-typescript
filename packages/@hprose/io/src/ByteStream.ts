/*--------------------------------------------------------*\
|                                                          |
|                          hprose                          |
|                                                          |
| Official WebSite: https://hprose.com                     |
|                                                          |
| ByteStream.ts                                            |
|                                                          |
| hprose ByteStream for TypeScript.                        |
|                                                          |
| LastModified: Jan 15, 2019                               |
| Author: Ma Bingyao <andot@hprose.com>                    |
|                                                          |
\*________________________________________________________*/

const EMPTY_BYTES = new Uint8Array(0);
const INIT_SIZE = 1024;

export function writeInt32BE(bytes: Uint8Array, offset: number, value: number): number {
    bytes[offset++] = value >>> 24 & 0xFF;
    bytes[offset++] = value >>> 16 & 0xFF;
    bytes[offset++] = value >>> 8 & 0xFF;
    bytes[offset++] = value & 0xFF;
    return offset;
}

export function writeInt32LE(bytes: Uint8Array, offset: number, value: number): number {
    bytes[offset++] = value & 0xFF;
    bytes[offset++] = value >>> 8 & 0xFF;
    bytes[offset++] = value >>> 16 & 0xFF;
    bytes[offset++] = value >>> 24 & 0xFF;
    return offset;
}

function pow2roundup(value: number): number {
    --value;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    return value + 1;
}

let arrayLikeObjectArgumentsEnabled = true;

try {
    fromCharCode(new Uint8Array([1, 2]));
}
catch (e) {
    arrayLikeObjectArgumentsEnabled = false;
}

function toArray<T>(arraylike: ArrayLike<T>): T[] {
    const n = arraylike.length;
    const array = new Array(n);
    for (let i = 0; i < n; ++i) {
        array[i] = arraylike[i];
    }
    return array;
}

function fromCharCode(charCodes: ArrayLike<number>): string {
    if (arrayLikeObjectArgumentsEnabled) {
        return String.fromCharCode.apply(String, charCodes as number[]);
    }
    return String.fromCharCode.apply(String, toArray(charCodes));
}

function readString(bytes: Uint8Array, charLength: number): [string, number] {
    if (charLength < 0) charLength = bytes.length;
    if (charLength === 0) return ['', 0];
    let charOffset = 0;
    let byteOffset = 0;
    let n = (charLength < 0x7FFF) ? charLength : 0x7FFF;
    const charCodes = new Uint16Array(n + 1);
    const byteLength = bytes.length;
    const buf: string[] = [];
    do {
        for (; charOffset < n && byteOffset < byteLength; charOffset++) {
            const unit = bytes[byteOffset++];
            switch (unit >> 4) {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                    charCodes[charOffset] = unit;
                    break;
                case 12:
                case 13:
                    if (byteOffset < byteLength) {
                        charCodes[charOffset] = ((unit & 0x1F) << 6)
                            | (bytes[byteOffset++] & 0x3F);
                        break;
                    }
                    throw new Error('Unfinished UTF-8 octet sequence');
                case 14:
                    if (byteOffset + 1 < byteLength) {
                        charCodes[charOffset] = ((unit & 0x0F) << 12)
                            | ((bytes[byteOffset++] & 0x3F) << 6)
                            | (bytes[byteOffset++] & 0x3F);
                        break;
                    }
                    throw new Error('Unfinished UTF-8 octet sequence');
                case 15:
                    if (byteOffset + 2 < byteLength) {
                        const rune = (((unit & 0x07) << 18)
                            | ((bytes[byteOffset++] & 0x3F) << 12)
                            | ((bytes[byteOffset++] & 0x3F) << 6)
                            | (bytes[byteOffset++] & 0x3F)) - 0x10000;
                        if (0 <= rune && rune <= 0xFFFFF) {
                            charCodes[charOffset++] = (((rune >> 10) & 0x03FF) | 0xD800);
                            charCodes[charOffset] = ((rune & 0x03FF) | 0xDC00);
                            break;
                        }
                        throw new Error('Character outside valid Unicode range: 0x' + rune.toString(16));
                    }
                    throw new Error('Unfinished UTF-8 octet sequence');
                default:
                    throw new Error('Bad UTF-8 encoding 0x' + unit.toString(16));
            }
        }
        buf.push(fromCharCode(charCodes.subarray(0, charOffset)));
        charLength -= charOffset;
        charOffset = 0;
        if (n > charLength) n = charLength;
    } while (charOffset < charLength && byteOffset < byteLength);
    return [buf.length === 1 ? buf[0] : buf.join(''), byteOffset];
}

export function fromUint8Array(bytes: Uint8Array): string {
    return readString(bytes, bytes.length)[0];
}

export function toBinaryString(bytes: Uint8Array | ArrayBufferLike): string {
    let data = (bytes instanceof Uint8Array) ? bytes : new Uint8Array(bytes);
    const n = data.length;
    if (n === 0) return '';
    if (n < 0xFFFF) return fromCharCode(data);
    const remain = n & 0x7FFF;
    const count = n >> 15;
    const buf = new Array(remain ? count + 1 : count);
    for (let i = 0; i < count; ++i) buf[i] = fromCharCode(data.subarray(i << 15, (i + 1) << 15));
    if (remain) buf[count] = fromCharCode(data.subarray(count << 15, n));
    return buf.join('');
}

export class ByteStream {
    protected buffer: Uint8Array = EMPTY_BYTES;
    protected size: number = 0;
    protected offset: number = 0;
    protected rmark: number = 0;
    protected wmark: number = 0;
    /**
     * Decodes data to a string according to the Type.
     * @param data to be decoded to a string.
     */
    public static toString(data?: string | Uint8Array | ByteStream | ArrayBuffer | ArrayLike<number>): string {
        if (data === undefined) return Object.toString.apply(ByteStream);
        if (typeof data === 'string') return data;
        if (data instanceof ByteStream) return data.toString();
        if (data instanceof Uint8Array) return fromUint8Array(data);
        if (data instanceof ArrayBuffer) return fromUint8Array(new Uint8Array(data, 0));
        return fromCharCode(data);
    }
    /**
     * Constructs a ByteStream object with no bytes in it and the specified initial capacity.
     * @param capacity the initial capacity.
     */
    constructor(capacity: number);
    /**
     * Constructs a ByteStream object initialized to the contents of the data.
     * @param data the initial contents of this stream.
     */
    constructor(data?: string | Uint8Array | Uint8ClampedArray | ByteStream | ArrayLike<number> | ArrayBufferLike);
    constructor(value: any) {
        if (value) {
            if (typeof value === 'number') {
                this.buffer = new Uint8Array(value);
            } else if (typeof value === 'string') {
                this.writeString(value);
            } else {
                if (value instanceof ByteStream) {
                    this.buffer = value.toBytes();
                } else if (value instanceof Uint8Array) {
                    this.buffer = value;
                } else if (value instanceof Uint8ClampedArray) {
                    this.buffer = new Uint8Array(value.buffer, value.byteOffset, value.length);
                } else {
                    this.buffer = new Uint8Array(value);
                }
                this.size = value.length;
            }
            this.mark();
        }
    }

    protected grow(n: number): void {
        const capacity = this.capacity;
        n = this.size + n;
        if (n > capacity) {
            if (capacity > 0) {
                const buf = new Uint8Array(pow2roundup(n));
                buf.set(this.buffer);
                this.buffer = buf;
            }
            else {
                this.buffer = new Uint8Array(Math.max(pow2roundup(n), INIT_SIZE));
            }
        }
    }
    /**
     * Returns the current capacity of this stream.
     */
    public get capacity(): number {
        return this.buffer.length;
    }
    /**
     * Returns the current length of the data in this stream.
     */
    public get length(): number {
        return this.size;
    }
    /**
     * Returns the position of the next reading operation in this stream.
     */
    public get position(): number {
        return this.offset;
    }
    /**
     * Returns all bytes data in this stream.
     * If the returned data is changed, the data in this stream will be also changed.
     */
    public get bytes(): Uint8Array {
        return this.buffer.subarray(0, this.size);
    }
    /**
     * Returns all bytes data in this stream that has not been read.
     * If the returned data is changed, the data in this stream will be also changed.
     */
    public get remains(): Uint8Array {
        return this.buffer.subarray(this.offset, this.size);
    }
    /**
     * Sets this stream's mark at its reading and writing position.
     */
    public mark(): void {
        this.wmark = this.size;
        this.rmark = this.offset;
    }
    /**
     * Resets this stream's reading and writing position to the previously-marked position.
     * Invoking this method neither changes nor discards the mark's value.
     */
    public reset(): void {
        this.size = this.wmark;
        this.offset = this.rmark;
    }
    /**
     * Clears this stream.
     * The position is set to zero, the limit is set to the capacity, and the mark is discarded.
     */
    public clear(): void {
        this.buffer = EMPTY_BYTES;
        this.size = 0;
        this.offset = 0;
        this.wmark = 0;
        this.rmark = 0;
    }
    /**
     * Writes a byte to the stream as a 1-byte value.
     * @param byte a byte value to be written.
     */
    public writeByte(byte: number): void {
        this.grow(1);
        this.buffer[this.size++] = byte;
    }
    /**
     * Writes value to this stream with big endian format.
     * @param value number to be written to this stream. value should be a valid signed 32-bit integer.
     * TypeError will be throwed when value is anything other than a signed 32-bit integer.
     */
    public writeInt32BE(value: number): void {
        if (value !== (value | 0)) {
            throw new TypeError('value is out of bounds');
        }
        this.grow(4);
        this.size = writeInt32BE(this.buffer, this.size, value);
    }
    /**
     * Writes value to this stream with big endian format.
     * @param value number to be written to this stream. value should be a valid unsigned 32-bit integer.
     * TypeError will be throwed when value is anything other than an unsigned 32-bit integer.
     */
    public writeUInt32BE(value: number): void {
        if (value < 0 || value !== (value | 0) && (value & 0x7FFFFFFF) + 0x80000000 !== value) {
            throw new TypeError('value is out of bounds');
        }
        this.grow(4);
        this.size = writeInt32BE(this.buffer, this.size, value | 0);
    }
    /**
     * Writes value to this stream with little endian format.
     * @param value number to be written to this stream. value should be a valid signed 32-bit integer.
     * TypeError will be throwed when value is anything other than a signed 32-bit integer.
     */
    public writeInt32LE(value: number): void {
        if (value !== (value | 0)) {
            throw new TypeError('value is out of bounds');
        }
        this.grow(4);
        this.size = writeInt32LE(this.buffer, this.size, value);
    }
    /**
     * Writes value to this stream with little endian format.
     * @param value number to be written to this stream. value should be a valid unsigned 32-bit integer.
     * TypeError will be throwed when value is anything other than an unsigned 32-bit integer.
     */
    public writeUInt32LE(value: number): void {
        if (value < 0 || value !== (value | 0) && (value & 0x7FFFFFFF) + 0x80000000 !== value) {
            throw new TypeError('value is out of bounds');
        }
        this.grow(4);
        this.size = writeInt32LE(this.buffer, this.size, value | 0);
    }
    /**
     * Writes binary data to this stream.
     * @param data to be written to this stream.
     */
    public write(data: Uint8Array | Uint8ClampedArray | ByteStream | ArrayLike<number> | ArrayBuffer): void {
        const n = (data instanceof ArrayBuffer) ? data.byteLength : data.length;
        if (n === 0) return;
        this.grow(n);
        const bytes = this.buffer;
        const offset = this.size;
        if (data instanceof ByteStream) {
            bytes.set(data.bytes, offset);
        } else if (data instanceof ArrayBuffer) {
            bytes.set(new Uint8Array(data), offset);
        } else {
            bytes.set(data, offset);
        }
        this.size += n;
    }
    /**
     * Writes str to this stream with ascii encoding.
     * @param str to be written to this stream.
     */
    public writeAsciiString(str: string): void {
        const n = str.length;
        if (n === 0) return;
        this.grow(n);
        const bytes = this.buffer.subarray(this.size);
        for (let i = 0; i < n; ++i) {
            bytes[i] = str.charCodeAt(i);
        }
        this.size += n;
    }
    /**
     * Writes str to this stream with utf8 encoding.
     * @param str to be written to this stream.
     */
    public writeString(str: string): void {
        const n = str.length;
        if (n === 0) return;
        // The single code unit occupies up to 3 bytes.
        this.grow(n * 3);
        const bytes = this.buffer;
        let offset = this.size;
        for (let i = 0; i < n; ++i) {
            const charCode = str.charCodeAt(i);
            if (charCode < 0x80) {
                bytes[offset++] = charCode;
            } else if (charCode < 0x800) {
                bytes[offset++] = 0xC0 | (charCode >> 6);
                bytes[offset++] = 0x80 | (charCode & 0x3F);
            } else if (charCode < 0xD800 || charCode > 0xDFFF) {
                bytes[offset++] = 0xE0 | (charCode >> 12);
                bytes[offset++] = 0x80 | ((charCode >> 6) & 0x3F);
                bytes[offset++] = 0x80 | (charCode & 0x3F);
            } else {
                if (i + 1 < n) {
                    const nextCharCode = str.charCodeAt(i + 1);
                    if (charCode < 0xDC00 && 0xDC00 <= nextCharCode && nextCharCode <= 0xDFFF) {
                        const rune = (((charCode & 0x03FF) << 10) | (nextCharCode & 0x03FF)) + 0x010000;
                        bytes[offset++] = 0xF0 | (rune >> 18);
                        bytes[offset++] = 0x80 | ((rune >> 12) & 0x3F);
                        bytes[offset++] = 0x80 | ((rune >> 6) & 0x3F);
                        bytes[offset++] = 0x80 | (rune & 0x3F);
                        ++i;
                        continue;
                    }
                }
                throw new Error('Malformed string');
            }
        }
        this.size = offset;
    }
    /**
     * Reads and returns a single byte.
     * If no byte is available, returns -1.
     */
    public readByte(): number {
        if (this.offset >= this.size) return -1;
        return this.buffer[this.offset++];
    }
    /**
     * Reads a signed 32-bit integer from this stream with the big endian format.
     * If the remaining data is less than 4 bytes, Error('EOF') will be throw.
     */
    public readInt32BE(): number {
        const bytes = this.buffer;
        let offset = this.offset;
        if (offset + 3 >= this.size) {
            throw new Error('EOF');
        }
        const result = bytes[offset++] << 24 | bytes[offset++] << 16 | bytes[offset++] << 8 | bytes[offset++];
        this.offset = offset;
        return result;
    }
    /**
     * Reads an unsigned 32-bit integer from this stream with the big endian format.
     * If the remaining data is less than 4 bytes, Error('EOF') will be throw.
     */
    public readUInt32BE(): number {
        const result = this.readInt32BE();
        if (result >= 0) return result;
        return (result & 0x7FFFFFFF) + 0x80000000;
    }
    /**
     * Reads a signed 32-bit integer from this stream with the little endian format.
     * If the remaining data is less than 4 bytes, Error('EOF') will be throw.
     */
    public readInt32LE(): number {
        const bytes = this.buffer;
        let offset = this.offset;
        if (offset + 3 >= this.size) {
            throw new Error('EOF');
        }
        let result = bytes[offset++] | bytes[offset++] << 8 | bytes[offset++] << 16 | bytes[offset++] << 24;
        this.offset = offset;
        return result;
    }
    /**
     * Reads an unsigned 32-bit integer from this stream with the little endian format.
     * If the remaining data is less than 4 bytes, Error('EOF') will be throw.
     */
    public readUInt32LE(): number {
        const result = this.readInt32LE();
        if (result >= 0) return result;
        return (result & 0x7FFFFFFF) + 0x80000000;
    }
    /**
     * Reads n bytes of data from this stream and returns the result as a Uint8Array.
     * If n is negative, reads to the end of this stream.
     * @param n The maximum number of bytes to read.
     */
    public read(n: number): Uint8Array {
        if (n < 0 || this.offset + n > this.size) n = this.size - this.offset;
        if (n === 0) return EMPTY_BYTES;
        return this.buffer.subarray(this.offset, this.offset += n);
    }
    /**
     * Skips over and discards n bytes of data from this stream.
     * The actual number of bytes skipped is returned.
     * If n is negative, all remaining bytes are skipped.
     * @param n the number of bytes to be skipped.
     */
    public skip(n: number): number {
        if (n === 0) return 0;
        if (n < 0 || this.offset + n > this.size) {
            n = this.size - this.offset;
            this.offset = this.size;
        } else {
            this.offset += n;
        }
        return n;
    }
    /**
     * Returns a Uint8Array from the current position to the delimiter. The result includes delimiter.
     * Returns all remaining data if no delimiter is found.
     * After this method is called, The new position is after the delimiter.
     * @param delimiter a byte, which represents the end of reading data.
     */
    public readBytes(delimiter: number): Uint8Array {
        const pos = this.buffer.indexOf(delimiter, this.offset);
        let result;
        if (pos === -1) {
            result = this.buffer.subarray(this.offset, this.size);
            this.offset = this.size;
        } else {
            result = this.buffer.subarray(this.offset, pos + 1);
            this.offset = pos + 1;
        }
        return result;
    }
    /**
     * Returns a string from the current position to the delimiter. The result doesn't include delimiter.
     * Returns all remaining data if no delimiter is found.
     * After this method is called, the new position is after the delimiter.
     * @param delimiter a byte, which represents the end of reading data.
     */
    public readUntil(delimiter: number): string {
        const pos = this.buffer.indexOf(delimiter, this.offset);
        let result = '';
        if (pos === this.offset) {
            this.offset++;
        } else if (pos === -1) {
            result = fromUint8Array(this.buffer.subarray(this.offset, this.size));
            this.offset = this.size;
        } else {
            result = fromUint8Array(this.buffer.subarray(this.offset, pos));
            this.offset = pos + 1;
        }
        return result;
    }
    /**
     * Reads n bytes of data from this stream and returns the result as an ascii string.
     * If n is negative, reads to the end of this stream.
     * @param n The maximum number of bytes to read.
     */
    public readAsciiString(n: number): string {
        return toBinaryString(this.read(n));
    }
    /**
     * Returns a Uint8Array containing a string of length n.
     * If n is negative, reads to the end of this stream.
     * @param n is the string(UTF16) length.
     */
    public readStringAsBytes(n: number): Uint8Array {
        if (n === 0) return EMPTY_BYTES;
        let bytes = this.buffer.subarray(this.offset, this.size);
        if (n < 0) {
            this.offset = this.size;
            return bytes;
        }
        let offset = 0;
        for (let i = 0, length = bytes.length; i < n && offset < length; i++) {
            const unit = bytes[offset++];
            switch (unit >> 4) {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                    break;
                case 12:
                case 13:
                    if (offset < length) {
                        offset++;
                        break;
                    }
                    throw new Error('Unfinished UTF-8 octet sequence');
                case 14:
                    if (offset + 1 < length) {
                        offset += 2;
                        break;
                    }
                    throw new Error('Unfinished UTF-8 octet sequence');
                case 15:
                    if (offset + 2 < length) {
                        const rune = (((unit & 0x07) << 18)
                            | ((bytes[offset++] & 0x3F) << 12)
                            | ((bytes[offset++] & 0x3F) << 6)
                            | (bytes[offset++] & 0x3F)) - 0x10000;
                        if (0 <= rune && rune <= 0xFFFFF) {
                            i++;
                            break;
                        }
                        throw new Error('Character outside valid Unicode range: 0x' + rune.toString(16));
                    }
                    throw new Error('Unfinished UTF-8 octet sequence');
                default:
                    throw new Error('Bad UTF-8 encoding 0x' + unit.toString(16));
            }
        }
        this.offset += offset;
        return bytes.subarray(0, offset);
    }
    /**
     * Returns a string of length n.
     * If n is negative, reads to the end of this stream.
     * @param n is the string(UTF16) length.
     */
    public readString(n: number): string {
        let [str, length] = readString(this.buffer.subarray(this.offset, this.size), n);
        this.offset += length;
        return str;
    }
    /**
     * Returns a view of the the internal buffer and clears `this`.
     */
    public takeBytes(): Uint8Array {
        const bytes = this.bytes;
        this.clear();
        return bytes;
    }
    /**
     * Returns a copy of the current contents and leaves `this` intact.
     */
    public toBytes(): Uint8Array {
        return new Uint8Array(this.bytes);
    }
    /**
     * Returns a string representation of this stream.
     */
    public toString(): string {
        return fromUint8Array(this.bytes);
    }
    /**
     * Creates an exact copy of this stream.
     */
    public clone(): ByteStream {
        return new ByteStream(this.toBytes());
    }
    /**
     * Truncates this stream, only leaves the unread data.
     * The position is reset to 0.
     * The mark is cleared.
     */
    public trunc(): void {
        this.buffer = this.remains;
        this.size = this.buffer.length;
        this.offset = 0;
        this.wmark = 0;
        this.rmark = 0;
    }
}