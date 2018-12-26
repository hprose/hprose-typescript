import { ByteStream, Reader } from '../../lib/io'
import { Guid } from 'guid-typescript';

test('test boolean deserialization', () => {
    let reader = new Reader(new ByteStream('tftftf'));
    expect(reader.deserialize()).toBe(true);
    expect(reader.deserialize()).toBe(false);
    expect(reader.deserialize(Boolean)).toBe(true);
    expect(reader.deserialize(Boolean)).toBe(false);
    expect(reader.deserialize(Number)).toBe(1);
    expect(reader.deserialize(Number)).toBe(0);
});

test('test null | undefined deserialization', () => {
    let reader = new Reader(new ByteStream('nnnnnnn'));
    expect(reader.deserialize()).toBeUndefined();
    expect(reader.deserialize(Boolean)).toBeUndefined();
    expect(reader.deserialize(Number)).toBeUndefined();
    expect(reader.deserialize(String)).toBeUndefined();
    expect(reader.deserialize(Date)).toBeUndefined();
    expect(reader.deserialize(Array)).toBeUndefined();
    expect(reader.deserialize(null)).toBeNull();

});

test('test array deserialization', () => {
    let reader = new Reader(new ByteStream('a3{123}a3{456}s5"hello"e'));
    expect(reader.deserialize()).toEqual([1,2,3]);
    expect(reader.deserialize(Array)).toEqual([4,5,6]);
    expect(reader.deserialize(Array)).toEqual(['h','e','l','l','o']);
    expect(reader.deserialize(Array)).toEqual([]);
});

test('test map deserialization', () => {
    let reader = new Reader(new ByteStream('m{}m{}m2{s4"name"s3"Tom"s3"age"i18;}r2;m2{r3;s5"Jerry"r5;i17;}r6;'));
    expect(reader.deserialize()).toEqual({});
    expect(reader.deserialize()).toEqual(Object.create(null));
    expect(reader.deserialize()).toEqual({name: "Tom", age: 18});
    expect(reader.deserialize()).toEqual({name: "Tom", age: 18});
    let map = new Map<string, any>();
    map.set("name", "Jerry");
    map.set("age", 17);
    expect(reader.deserialize(Map)).toEqual(map);
    expect(reader.deserialize()).toEqual(map);
});

test('test object deserialization', () => {
    class User {
        public name: string = '';
        public age: number = 0;
    }
    let user = new User();
    user.name = "Tom";
    user.age = 18;
    let user2 = new User();
    user2.name = "Jerry";
    user2.age = 17;
    let reader = new Reader(new ByteStream('c4"User"2{s4"name"s3"age"}o0{s3"Tom"i18;}o0{s5"Jerry"i17;}'));
    expect(reader.deserialize()).toEqual(user);
    expect(reader.deserialize(User)).toEqual(user2);
})

test('test guid deserialization', () => {
    let reader = new Reader(new ByteStream('g{bf3066cf-7b5b-1edf-731e-05b2d25a4408}r0;'));
    let guid: Guid = Guid.parse('bf3066cf-7b5b-1edf-731e-05b2d25a4408');
    expect(reader.deserialize()).toEqual(guid);
    expect(reader.deserialize()).toEqual(guid);
})