import ByteStream from '../../io/ByteStream'

test('test writeByte & readAsciiString', () => {
    const stream = new ByteStream();
    const array = [];
    for (let i = 0; i < 256; ++i) {
        stream.writeByte(i);
        array.push(i);
    }
    expect(stream.readAsciiString(256)).toBe(String.fromCharCode.apply(String, array));
});

test('test writeString & toString', () => {
    const stream = new ByteStream();
    stream.writeString("你好🌏");
    expect(stream.toString()).toBe("你好🌏");
});

test('test writeInt32BE & readInt32BE', () => {
    const stream = new ByteStream();
    stream.writeInt32BE(2^31-1);
    stream.writeInt32BE(-(2^31));
    stream.writeInt32BE(0);
    stream.writeInt32BE(1);
    stream.writeInt32BE(-1);
    expect(stream.readInt32BE()).toBe(2^31-1);
    expect(stream.readInt32BE()).toBe(-(2^31));
    expect(stream.readInt32BE()).toBe(0);
    expect(stream.readInt32BE()).toBe(1);
    expect(stream.readInt32BE()).toBe(-1);
});

test('test writeInt32LE & readInt32LE', () => {
    const stream = new ByteStream();
    stream.writeInt32LE(2**31-1);
    stream.writeInt32LE(-(2**31));
    stream.writeInt32LE(0);
    stream.writeInt32LE(1);
    stream.writeInt32LE(-1);
    expect(stream.readInt32LE()).toBe(2**31-1);
    expect(stream.readInt32LE()).toBe(-(2**31));
    expect(stream.readInt32LE()).toBe(0);
    expect(stream.readInt32LE()).toBe(1);
    expect(stream.readInt32LE()).toBe(-1);
})

test('test writeUInt32BE & readUInt32BE', () => {
    const stream = new ByteStream();
    stream.writeUInt32BE(2**31);
    stream.writeUInt32BE(2**32-1);
    stream.writeUInt32BE(0);
    stream.writeUInt32BE(1);
    expect(stream.readUInt32BE()).toBe(2**31);
    expect(stream.readUInt32BE()).toBe(2**32-1);
    expect(stream.readUInt32BE()).toBe(0);
    expect(stream.readUInt32BE()).toBe(1);
});

test('test writeUInt32LE & readUInt32LE', () => {
    const stream = new ByteStream();
    stream.writeUInt32LE(2**31);
    stream.writeUInt32LE(2**32-1);
    stream.writeUInt32LE(0);
    stream.writeUInt32LE(1);
    expect(stream.readUInt32LE()).toBe(2**31);
    expect(stream.readUInt32LE()).toBe(2**32-1);
    expect(stream.readUInt32LE()).toBe(0);
    expect(stream.readUInt32LE()).toBe(1);
});

