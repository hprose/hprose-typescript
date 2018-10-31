const EMPTY_BYTES = new Uint8Array(0);
const INIT_SIZE = 1024;

function writeInt32BE(bytes: Uint8Array, offset: number, i: number): number {
    bytes[offset++] = i >>> 24 & 0xFF;
    bytes[offset++] = i >>> 16 & 0xFF;
    bytes[offset++] = i >>> 8 & 0xFF;
    bytes[offset++] = i & 0xFF;
    return offset;
}

function writeInt32LE(bytes: Uint8Array, offset: number, i: number): number {
    bytes[offset++] = i & 0xFF;
    bytes[offset++] = i >>> 8 & 0xFF;
    bytes[offset++] = i >>> 16 & 0xFF;
    bytes[offset++] = i >>> 24 & 0xFF;
    return offset;
}

function pow2roundup(i: number): number {
    --i;
    i |= i >> 1;
    i |= i >> 2;
    i |= i >> 4;
    i |= i >> 8;
    i |= i >> 16;
    return i + 1;
}

function fromCharCode(charCodes: ArrayLike<number>): string {
    return String.fromCharCode.apply(String, charCodes);
}

function readString(bytes: Uint8Array, charLength: number): [string, number] {
    if (charLength < 0) {
        charLength = bytes.length;
    }
    if (charLength === 0) {
        return ['', 0];
    }
    let charOffset = 0, byteOffset = 0;
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
                        charCodes[charOffset] = ((unit & 0x1F) << 6) |
                            (bytes[byteOffset++] & 0x3F);
                        break;
                    }
                    throw new Error('Unfinished UTF-8 octet sequence');
                case 14:
                    if (byteOffset + 1 < byteLength) {
                        charCodes[charOffset] = ((unit & 0x0F) << 12) |
                            ((bytes[byteOffset++] & 0x3F) << 6) |
                            (bytes[byteOffset++] & 0x3F);
                        break;
                    }
                    throw new Error('Unfinished UTF-8 octet sequence');
                case 15:
                    if (byteOffset + 2 < byteLength) {
                        const rune = (((unit & 0x07) << 18) |
                            ((bytes[byteOffset++] & 0x3F) << 12) |
                            ((bytes[byteOffset++] & 0x3F) << 6) |
                            (bytes[byteOffset++] & 0x3F)) - 0x10000;
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
        if (n > charLength) {
            n = charLength;
        }
    } while (charOffset < charLength && byteOffset < byteLength);
    return [buf.length === 1 ? buf[0] : buf.join(''), byteOffset];
}

function fromUint8Array(bytes: Uint8Array): string {
    return readString(bytes, bytes.length)[0];
}

function toBinaryString(bytes: Uint8Array | ArrayBufferLike): string {
    let data = (bytes instanceof Uint8Array) ? bytes : new Uint8Array(bytes);
    const n = data.length;
    if (n < 0xFFFF) {
        return fromCharCode(data);
    }
    const remain = n & 0x7FFF;
    const count = n >> 15;
    const buf = new Array(remain ? count + 1 : count);
    for (let i = 0; i < count; ++i) {
        buf[i] = fromCharCode(data.subarray(i << 15, (i + 1) << 15));
    }
    if (remain) {
        buf[count] = fromCharCode(data.subarray(count << 15, n));
    }
    return buf.join('');
}

function isBytesIO(value: BytesIO | any): value is BytesIO {
    return value instanceof BytesIO;
}

class BytesIO {
    private buffer: Uint8Array = EMPTY_BYTES;
    private size: number = 0;
    private offset: number = 0;
    private rmark: number = 0;
    private wmark: number = 0;

    static toString(data: string | Uint8Array | BytesIO | ArrayBuffer | ArrayLike<number>): string {
        if (typeof data === 'string') {
            return data;
        }
        else if (isBytesIO(data)) {
            return data.toString();
        }
        else if (data instanceof Uint8Array) {
            return fromUint8Array(data);
        }
        else if (data instanceof ArrayBuffer) {
            return fromUint8Array(new Uint8Array(data, 0));
        }
        else {
            return fromCharCode(data);
        }
    }

    constructor(capacity: number);
    constructor(data: string | Uint8Array | BytesIO | ArrayLike<number> | ArrayBufferLike);
    constructor(data: ArrayBufferLike, length: number);
    constructor(data: ArrayBufferLike, offset: number, length: number);
    constructor(a1: any, a2?: number, a3?: number) {
        if (a2) {
            if (a3) {
                this.buffer = new Uint8Array(a1, a2, a3);
                this.size = a3;
            }
            else {
                this.buffer = new Uint8Array(a1, a2);
                this.size = a2;
            }
        }
        else {
            if (typeof a1 === 'number') {
                this.buffer = new Uint8Array(a1);
            }
            else if (typeof a1 === 'string') {
                this.writeString(a1);
            }
            else {
                if (a1 instanceof Uint8Array) {
                    this.buffer = a1;
                }
                else if (a1 instanceof BytesIO) {
                    this.buffer = a1.toBytes();
                }
                else {
                    this.buffer = new Uint8Array(a1);
                }
                this.size = a1.length;
            }
        }
        this.mark();
    }

    private grow(n: number): void {
        n = pow2roundup(this.size + n);
        const capacity = this.capacity;
        if (capacity > 0) {
            n *= 2;
            if (n > capacity) {
                const buf = new Uint8Array(n);
                buf.set(this.buffer);
                this.buffer = buf;
            }
        }
        else {
            n = Math.max(n, INIT_SIZE);
            this.buffer = new Uint8Array(n);
        }
    }

    public get capacity(): number {
        return this.buffer.length;
    }
    public get length(): number {
        return this.size;
    }
    public get position(): number {
        return this.offset;
    }
    public get bytes(): Uint8Array {
        return this.buffer.subarray(0, this.size);
    }
    public get remains(): Uint8Array {
        return this.buffer.subarray(this.offset, this.size);
    }

    public mark(): void {
        this.wmark = this.size;
        this.rmark = this.offset;
    }
    public reset(): void {
        this.size = this.wmark;
        this.offset = this.rmark;
    }
    public clear(): void {
        this.buffer = EMPTY_BYTES;
        this.size = 0;
        this.offset = 0;
        this.wmark = 0;
        this.rmark = 0;
    }
    public writeByte(byte: number): void {
        this.grow(1);
        this.buffer[this.size++] = byte;
    }
    public writeInt32BE(i: number): void {
        if ((i === (i | 0)) && (i <= 2147483647)) {
            this.grow(4);
            this.size = writeInt32BE(this.buffer, this.size, i);
            return;
        }
        throw new TypeError('value is out of bounds');
    }
    public writeUInt32BE(i: number): void {
        if (((i & 0x7FFFFFFF) + 0x80000000 === i) && (i >= 0)) {
            this.grow(4);
            this.size = writeInt32BE(this.buffer, this.size, i | 0);
            return;
        }
        throw new TypeError('value is out of bounds');
    }
    public writeInt32LE(i: number): void {
        if ((i === (i | 0)) && (i <= 2147483647)) {
            this.grow(4);
            this.size = writeInt32LE(this.buffer, this.size, i);
            return;
        }
        throw new TypeError('value is out of bounds');
    }
    public writeUInt32LE(i: number): void {
        if (((i & 0x7FFFFFFF) + 0x80000000 === i) && (i >= 0)) {
            this.grow(4);
            this.size = writeInt32LE(this.buffer, this.size, i | 0);
            return;
        }
        throw new TypeError('value is out of bounds');
    }
    public write(data: Uint8Array | BytesIO | ArrayLike<number> | ArrayBuffer): void {
        const n = (data instanceof ArrayBuffer) ? data.byteLength : data.length;
        if (n === 0) {
            return;
        }
        this.grow(n);
        const bytes = this.buffer;
        const offset = this.size;
        if (data instanceof Uint8Array) {
            bytes.set(data, offset);
        }
        else if (isBytesIO(data)) {
            bytes.set(data.bytes, offset);
        }
        else {
            bytes.set(new Uint8Array(data), offset);
        }
        this.size += n;
    }
    public writeAsciiString(str: string): void {
        const n = str.length;
        if (n === 0) {
            return;
        }
        this.grow(n);
        const bytes = this.buffer.subarray(this.size);
        for (let i = 0; i < n; ++i) {
            bytes[i] = str.charCodeAt(i);
        }
        this.size += n;
    }
    public writeString(str: string): void {
        const n = str.length;
        if (n === 0) {
            return;
        }
        // Single code unit uses at most 3 bytes.
        // Double code units use at most 4 bytes.
        this.grow(n * 3);
        const bytes = this.buffer;
        let offset = this.size;
        for (let i = 0; i < n; ++i) {
            const charCode = str.charCodeAt(i);
            if (charCode < 0x80) {
                bytes[offset++] = charCode;
            }
            else if (charCode < 0x800) {
                bytes[offset++] = 0xC0 | (charCode >> 6);
                bytes[offset++] = 0x80 | (charCode & 0x3F);
            }
            else if (charCode < 0xD800 || charCode > 0xDFFF) {
                bytes[offset++] = 0xE0 | (charCode >> 12);
                bytes[offset++] = 0x80 | ((charCode >> 6) & 0x3F);
                bytes[offset++] = 0x80 | (charCode & 0x3F);
            }
            else {
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
    public readByte(): number {
        if (this.offset < this.size) {
            return this.buffer[this.offset++];
        }
        return -1;
    }
    public readInt32BE(): number {
        const bytes = this.buffer;
        let offset = this.offset;
        if (offset + 3 < this.size) {
            const result =
                bytes[offset++] << 24 |
                bytes[offset++] << 16 |
                bytes[offset++] << 8 |
                bytes[offset++];
            this.offset = offset;
            return result;
        }
        throw new Error('EOF');
    }
    public readUInt32BE(): number {
        const result = this.readInt32BE();
        if (result < 0) {
            return (result & 0x7FFFFFFF) + 0x80000000;
        }
        return result;
    }
    public readInt32LE(): number {
        const bytes = this.buffer;
        let offset = this.offset;
        if (offset + 3 < this.size) {
            let result =
                bytes[offset++] |
                bytes[offset++] << 8 |
                bytes[offset++] << 16 |
                bytes[offset++] << 24;
            this.offset = offset;
            return result;
        }
        throw new Error('EOF');
    }
    public readUInt32LE(): number {
        const result = this.readInt32LE();
        if (result < 0) {
            return (result & 0x7FFFFFFF) + 0x80000000;
        }
        return result;
    }
    public read(length: number): Uint8Array {
        if (this.offset + length > this.size) {
            length = this.size - this.offset;
        }
        if (length === 0) {
            return EMPTY_BYTES;
        }
        return this.buffer.subarray(this.offset, this.offset += length);
    }
    public skip(length: number): number {
        if (this.offset + length > this.size) {
            length = this.size - this.offset;
            this.offset = this.size;
        }
        else {
            this.offset += length;
        }
        return length;
    }
    /**
     * Returns a Uint8Array from the current position to the delimiter. The result includes delimiter.
     * Returns all remaining data if no delimiter is found.
     * After this method is called, The new position is after the delimiter.
     */
    public readBytes(delimiter: number): Uint8Array {
        const pos = Array.prototype.indexOf.call(this.buffer, delimiter, this.offset);
        let result;
        if (pos === -1) {
            result = this.buffer.subarray(this.offset, this.size);
            this.offset = this.size;
        }
        else {
            result = this.buffer.subarray(this.offset, pos + 1);
            this.offset = pos + 1;
        }
        return result;
    }
    /**
     * Returns a string from the current position to the delimiter. The result doesn't include delimiter.
     * Returns all remaining data if no delimiter is found.
     * After this method is called, the new position is after the delimiter.
     */
    public readUntil(delimiter: number): string {
        const pos = Array.prototype.indexOf.call(this.buffer, delimiter, this.offset);
        let result = '';
        if (pos === this.offset) {
            this.offset++;
        }
        else if (pos === -1) {
            result = fromUint8Array(this.buffer.subarray(this.offset, this.size));
            this.offset = this.size;
        }
        else {
            result = fromUint8Array(this.buffer.subarray(this.offset, pos));
            this.offset = pos + 1;
        }
        return result;
    }
    public readAsciiString(n: number): string {
        if (this.offset + n > this.size) {
            n = this.size - this.offset;
        }
        if (n === 0) {
            return '';
        }
        return toBinaryString(this.buffer.subarray(this.offset, this.offset += n));
    }
    /**
     * Returns a Uint8Array containing a string of length n.
     * @param n is the string(UTF16) length.
     */
    public readStringAsBytes(n: number): Uint8Array {
        if (n === 0) {
            return EMPTY_BYTES;
        }
        let bytes = this.buffer.subarray(this.offset, this.size);
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
                    const rune = (((unit & 0x07) << 18) |
                                ((bytes[offset++] & 0x3F) << 12) |
                                ((bytes[offset++] & 0x3F) << 6) |
                                (bytes[offset++] & 0x3F)) - 0x10000;
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
        this.clear;
        return bytes;
    }
    /**
     * Returns a copy of the current contents and leaves `this` intact.
     */
    public toBytes(): Uint8Array {
        return new Uint8Array(this.bytes);
    }
    public toString(): string {
        return fromUint8Array(this.bytes);
    }
    public clone(): BytesIO {
        return new BytesIO(this.toBytes());
    }
    public trunc(): void {
        this.buffer = this.remains;
        this.size = this.buffer.length;
        this.offset = 0;
        this.wmark = 0;
        this.rmark = 0;
    }
}

export default BytesIO;