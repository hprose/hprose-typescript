import { ByteStream, Writer } from '../src/index';
import { Guid } from 'guid-typescript';

test('test boolean serialization', () => {
    let writer = new Writer(new ByteStream());
    writer.write(true);
    writer.write(false);
    writer.serialize(true);
    writer.serialize(false);
    writer.serialize(Boolean(1));
    writer.serialize(Boolean(0));
    expect(writer.stream.toString()).toBe('tftftf');
});

test('test null serialization', () => {
    let writer = new Writer(new ByteStream());
    writer.write(null);
    writer.write(undefined);
    writer.serialize(function f1() {});
    writer.serialize(()=>{});
    writer.serialize(function*() {yield 1;});
    writer.serialize(async function f2(){});
    writer.serialize(async()=>{});
    expect(writer.stream.toString()).toBe('nnnnnnn');
});

test('test array serialization', () => {
    let writer = new Writer(new ByteStream());
    (function f(x, y, z) {
        writer.write(arguments);
    })(1, 2, 3);
    writer.write([4, 5, 6]);
    expect(writer.stream.toString()).toBe('a3{123}a3{456}');
});

test('test map serialization', () => {
    let writer = new Writer(new ByteStream());
    writer.write(Object.create(null));
    writer.write({});
    writer.write({name: 'Tom', age: 18});
    let map = new Map<string, any>();
    map.set('name', 'Jerry');
    map.set('age', 17);
    writer.serialize(map);
    writer.serialize(map);
    let obj = Object.create(null);
    obj.field1 = 1;
    obj.field2 = 2;
    obj.field3 = 3;
    writer.serialize(obj);
    writer.serialize(obj);
    expect(writer.stream.toString()).toBe('m{}m{}m2{s4"name"s3"Tom"s3"age"i18;}m2{r3;s5"Jerry"r5;i17;}r6;m3{s6"field1"1s6"field2"2s6"field3"3}r8;');
});

test('test object serialization', () => {
    class User {
        public name: string = '';
        public age: number = 0;
    }
    let user = new User();
    user.name = 'Tom';
    user.age = 18;
    let user2 = new User();
    user2.name = 'Jerry';
    user2.age = 17;
    let writer = new Writer(new ByteStream());
    writer.write(user);
    writer.write(user2);
    expect(writer.stream.toString()).toBe('c4"User"2{s4"name"s3"age"}o0{s3"Tom"i18;}o0{s5"Jerry"i17;}');
});

test('test guid serialization', () => {
    let guid: Guid = Guid.parse('bf3066cf-7b5b-1edf-731e-05b2d25a4408');
    let writer = new Writer(new ByteStream());
    writer.serialize(guid);
    writer.serialize(guid);
    expect(writer.stream.toString()).toBe('g{bf3066cf-7b5b-1edf-731e-05b2d25a4408}r0;');
});

test('test error serialization', () => {
    let error: Error = new Error("error");
    let writer = new Writer(new ByteStream());
    writer.serialize(error);
    writer.serialize(error);
    expect(writer.stream.toString()).toBe('Es5"error"Es5"error"');
});

// test('test bigint serialization', () => {
//     if (typeof BigInt !== 'undefined') {
//         let writer = new Writer(new ByteStream());
//         writer.write(BigInt('1234567890987654321234567890'));
//         expect(writer.stream.toString()).toBe('l1234567890987654321234567890;');
//     }
// });
