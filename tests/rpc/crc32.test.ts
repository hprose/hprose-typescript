import { crc32 } from '../../src/rpc/Utils';

test('test crc32', async () => {
    const data = new Uint8Array([0x68, 0x65, 0x6C, 0x6C, 0x6F, 0x20, 0x77, 0x6F, 0x72, 0x6C, 0x64]);
    expect(crc32(data)).toBe(222957957);
});