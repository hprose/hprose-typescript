<p align="center"><img src="https://hprose.com/banner.@2x.png" alt="Hprose" title="Hprose" width="650" height="200" /></p>

# Hprose IO 3.0 for TypeScript

[![npm version](https://img.shields.io/npm/v/@hprose/io.svg)](https://www.npmjs.com/package/@hprose/io)
[![npm download](https://img.shields.io/npm/dm/@hprose/io.svg)](https://www.npmjs.com/package/@hprose/io)
[![License](https://img.shields.io/npm/l/@hprose/io.svg)](http://opensource.org/licenses/MIT)

## 简介

@hprose/io 是一个轻量级、自描述、半文本、格式紧凑、动态类型、语言无关、平台无关的序列化库。

该库包含了众多的类与函数。这里先大致介绍一下。

`ByteStream` 是一个方便操作字节流输入输出的封装类。通过创建 `Writer` 类的对象，我们可以将任何可序列化类型的数据以 hprose 序列化格式写入到与其绑定的 `ByteStream` 对象中，同样，通过创建 `Reader` 类的对象，我们可以从与其绑定的 `ByteStream` 对象中读取 hprose 序列化格式的数据，并反序列化为指定类型的数据。

`Formatter` 简化了上面的序列化和反序列化的步骤，它包含两个静态方法：`serialize` 和 `deserialize`。其中 `serialize` 方法可以一步到位的将任何可序列化类型的数据，序列化为 hprose 序列化格式的字节数组（`Uint8Array` 类型）。而 `deserialize` 方法则可以一步到位的将 hprose 序列化格式的数据，反序列化为指定类型的数据。

`TypeManager` 是一个用来管理自定义类型的静态类。其中 `register` 方法将自定义类型以一个指定的名称进行注册。`isRegistered` 方法判断指定的名称是否已经注册。`getName` 方法通过注册的自定义类型来获取注册的名称。`getType` 方法通过注册的名称来获取注册的自定义类型。用户通常只需要使用 `register` 和 `isRegistered` 方法。`getName` 和 `getType` 方法会在序列化和反序列化的内部过程中被调用。通过类型注册，就可以在同一种或不同语言之间通过 hprose 序列化和反序列化来传递自定义类型的数据了，尤其是在 RPC 过程中，哪怕序列化的原始自定义类型的名称与反序列化后的原始自定义类型的名称不同，只要注册成了相同的名称，就可以被映射为同一种类型进行处理。

如果希望能够更细粒度的定制和使用序列化和反序列化，可以使用 `Serializer` 类的 `register` 方法来为某个类型注册一个序列化器，或者使用 `Deserializer` 类的 `register` 方法来为某个类型注册一个反序列化器。事实上，hprose 内部已经定义并注册了基础类型和容器类型的序列化器和反序列化器，自定义类型的通用的序列化器和反序列化器也已经定义并注册。因此，在没有特别需求的情况下，通常是不需要使用这两个方法的。另外，可以通过 `Serializer` 的 `getInstance` 方法来得到已经注册过的所指定数据类型的序列化器，或者通过 `Deserializer` 的 `getInstance` 方法来得到已经注册过的所指定数据类型的反序列化器。

如果确实有特别的需求，需要自己定制某个类型的序列化器和反序列化器，那么应该了解一下 [hprose 的序列化格式](https://github.com/hprose/hprose/blob/master/3.0/serialization.spec_zh_CN.mediawiki)，`Tags` 枚举中已经定义了上面序列化格式中的所有标记。因为该枚举类型是使用 TypeScript 语言编写的常量枚举类型，因此，只能在使用 TypeScript 编写的序列化器或反序列化器中引用它。`ValueWriter` 和 `ValueReader` 中提供了基础类型的常用序列化和反序列化实现的函数片段，`ReferenceReader` 中提供了引用类型的反序列化实现的函数片段，在自己实现序列化器或反序列化器时可以直接引用它们，以节省时间。具体的使用方式可以参考 `serializers` 和 `deserializers` 目录中现有的序列化器和反序列化器的实现。

## 安装

```
npm install @hprose/io
```

## 使用

在 JavaScript 中可以使用：

```js
const hprose = {
    io: require('@hprose/io')
};
```

的方式来引入整个包。

如果使用 TypeScript 或者 ES6+，也可以使用 `import` 语法：

```ts
import * as hprose_io from '@hprose/io';
```

来引入整个包。

但是通常我们不需要把整个包都引入，比如我们只需要 `Formatter` 类的话，可以使用：

```ts
import { Formatter } from '@hprose/io';
```

来单独引入它。

## 序列化

序列化最简单的方式是使用 `Formatter.serialize` 方法。例如：

```ts
import { Formatter } from '@hprose/io';

console.log(Formatter.serialize("hello world"));
```

输出结果为：

    Uint8Array [ 115, 49, 49, 34, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 34 ]


从上面的结果可以看出，`Formatter.serialize` 的返回结果是 `Uint8Array` 类型的。为了让输出结果具有更好的可读性，我们可以使用 `ByteStream.toString` 方法，将 `Uint8Array` 按照 `UTF-8` 编码解析成字符串，然后再输出。例如：

```ts
import { ByteStream, Formatter } from '@hprose/io';

console.log(ByteStream.toString(Formatter.serialize(123)));
console.log(ByteStream.toString(Formatter.serialize(3.1415926)));
console.log(ByteStream.toString(Formatter.serialize("hello world")));
console.log(ByteStream.toString(Formatter.serialize([1, 2, 3, 4, 5])));
console.log(ByteStream.toString(Formatter.serialize({ "name": "Tom", "age": 18 })));
```

输出结果为：

    i123;
    d3.1415926;
    s11"hello world"
    a5{12345}
    m2{s4"name"s3"Tom"s3"age"i18;}

对于自定义类型，也可以进行序列化。例如：

```ts
import { ByteStream, Formatter } from '@hprose/io';

class User {
    public name: string;
    public age: number;
}

const users = [];

const user1 = new User();
user1.name = "Tom";
user1.age = 18;

users.push(user1);

const user2 = new User();
user2.name = "Jerry";
user2.age = 16;

users.push(user2);

console.log(ByteStream.toString(Formatter.serialize(users)));
```

输出结果为：

    a2{c4"User"2{s4"name"s3"age"}o0{s3"Tom"i18;}o0{s5"Jerry"i16;}}

如果序列化的数据中包含递归结构，那么使用 hprose 序列化可以正常工作的，这是 json 序列化做不到的。例如：

```ts
import { ByteStream, Formatter } from '@hprose/io';

const a = [];
a[0] = a;

console.log(ByteStream.toString(Formatter.serialize(a)));
```

输出结果为：

    a1{r0;}

从上面的数据结果可以看出，递归结构的数据是按照引用方式来序列化的。

除了递归结构，相同的字符串也会按照引用序列化。例如：

```ts
import { ByteStream, Formatter } from '@hprose/io';

console.log(ByteStream.toString(Formatter.serialize([
    { "name": "Tom", "age": 18 },
    { "name": "Jerry", "age": 16 }
])));
```

输出结果为：

    a2{m2{s4"name"s3"Tom"s3"age"i18;}m2{r2;s5"Jerry"r4;i16;}}

从上面的结果可以看出，通过引用，可以有效的缩短序列化后的数据大小。

当然，在序列化时也可以不使用引用，例如：

```ts
import { ByteStream, Formatter } from '@hprose/io';

console.log(ByteStream.toString(Formatter.serialize([
    { "name": "Tom", "age": 18 },
    { "name": "Jerry", "age": 16 }
], true)));
```

加上 `true` 这个参数之后，输出结果就变成了下面的样子：

    a2{m2{s4"name"s3"Tom"s3"age"i18;}m2{s4"name"s5"Jerry"s3"age"i16;}}

如果希望能够把一批数据分多次序列化到一个 `Uint8Array` 中，可以使用 `ByteStream` + `Writer` 组合。例如：

```ts
import { ByteStream, Writer } from '@hprose/io';

const stream = new ByteStream();
const writer = new Writer(stream);
writer.serialize(123);
writer.serialize(3.1415926);
writer.serialize("hello world");
writer.serialize([1, 2, 3, 4, 5]);
writer.serialize({ "name": "Tom", "age": 18 });
console.log(stream.toString());
```

输出结果为：

    i123;d3.1415926;s11"hello world"a5{12345}m2{s4"name"s3"Tom"s3"age"i18;}

`Writer` 除了 `serialize` 方法以外，还有一个 `write` 方法，它的作用跟 `serialize` 一样，在序列化基础类型时，它们的效果完全相同，但是在写入引用类型的数据时，`serialize` 会先查找已经序列化的数据中，是否已经包含了将要序列化的数据，如果之前已经序列化了，则按照引用序列化将要写入的数据，而 `write` 方法则没有这个过程，也就是说 `write` 方法序列化的数据，不会以引用方式表示，但是如果序列化的数据是一个复杂类型的数据，例如数组，对象，那么只有该数组或对象本身不会以引用方式表示，而对该数组或对象内部的数据来说，则引用有效时，仍然以引用方式进行序列化。

如果希望所有数据都不采用引用方式序列化，那么在创建 `Writer` 对象时，将第二个参数设定为 `true` 就可以了。

 通过 `Writer` 序列化的每个引用数据都有一个引用编号，该引用编号会自动递增。当序列化自定义类型的对象时，自定义类型本身也会有一个引用编号，如果希望重新开始编号的计数，又不想重新创建一个 `Writer` 对象，那么可以调用 `reset` 方法。

 至于 `Writer` 对象上的 `writeReference`，`setReference`，`addReferenceCount` 和 `writeClass` 方法，只有在实现自定义序列化时才可能会用到，平时是不需要使用这几个方法的，因此，这里就不做详细说明了。如果有兴趣想要了解这几个方法，可以把 `serializers` 目录中现有序列化器的实现代码当作参考示例。

 ## 反序列化

 反序列化最简单的方式是使用 `Formatter.deserialize` 方法。例如：

```ts
import { Formatter } from '@hprose/io';

const data = Uint8Array.from([115, 49, 49, 34, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 34]);
console.log(Formatter.deserialize(data));
```

输出结果为：

    hello world

上面的 `data` 数据，就是我们在[序列化](#序列化)一节中第一个例子的输出。

`Formatter.deserialize` 除了可以接收 `Uint8Array` 类型的数据以外，还支持字符串、`ByteStream`、字节数组等类型。例如：

```ts
import { Formatter } from '@hprose/io';

console.log(Formatter.deserialize('s11"hello world"'));
```

输出结果跟上面例子的结果是一样的。

反序列化时，可以指定反序列化类型，如果不指定反序列化的类型，将采用默认反序列化类型。例如：

```ts
import { Formatter } from '@hprose/io';

const value = Formatter.deserialize('d3.1415926;');
console.log(value);
console.log(typeof value);

const value2 = Formatter.deserialize('d3.1415926;', String);
console.log(value2);
console.log(typeof value2);
```

输出结果为：

```
3.1415926
number
3.1415926
string
```

注意，指定的反序列化类型虽然可以与原始类型不同，必须是与原始类型相容的类型，否则在反序列化时会抛出异常。

自定义类型在反序列化时，如果自定义类型没有注册，则会自动生成反序列化的类型，例如：

```ts
import { Formatter, TypeManager } from '@hprose/io';

class User {
    public name: string;
    public age: number;
}

TypeManager.register(User, 'User');

const data = 'a2{c4"User"2{s4"name"s3"age"}o0{s3"Tom"i18;}o0{s5"Jerry"i16;}}';
const values = Formatter.deserialize(data);
console.log(values);
console.log(values[0].constructor == User);
```

输出结果为：

    [ User { name: 'Tom', age: 18 },
      User { name: 'Jerry', age: 16 } ]
    true

而：

```ts
import { Formatter } from '@hprose/io';

class User {
    public name: string;
    public age: number;
}

const data = 'a2{c4"User"2{s4"name"s3"age"}o0{s3"Tom"i18;}o0{s5"Jerry"i16;}}';
const values = Formatter.deserialize(data);
console.log(values);
console.log(values[0].constructor == User);
```

输出则是：

    [ User { name: 'Tom', age: 18 },
      User { name: 'Jerry', age: 16 } ]
    false

由此可见，在第二个例子中，反序列化出来的 `User` 对象的类并不是我们定义的那个 `User` 类，而是自动生成了一个 `User` 类。为了进一步证明这一点，我们可以把 `User` 类的定义去掉：

```ts
import { Formatter } from '@hprose/io';

const data = 'a2{c4"User"2{s4"name"s3"age"}o0{s3"Tom"i18;}o0{s5"Jerry"i16;}}';
const values = Formatter.deserialize(data);
console.log(values);
```

我们会发现输出结果仍然为：

    [ User { name: 'Tom', age: 18 },
      User { name: 'Jerry', age: 16 } ]

可见，反序列化出来的这个 `User` 对象所在的类确实是自动生成的。如果希望反序列化出的自定义类型是我们自定义的类型，一定不要忘记使用 `TypeManager.register` 方法对它进行注册。注册时，原始类型的名称，不需要跟序列化的类型名称相同，例如：

```ts
import { Formatter, TypeManager } from '@hprose/io';

class Person {
    public name: string;
    public age: number;
}

TypeManager.register(Person, 'User');

const data = 'a2{c4"User"2{s4"name"s3"age"}o0{s3"Tom"i18;}o0{s5"Jerry"i16;}}';

const values = Formatter.deserialize(data);
console.log(values);
console.log(values[0].constructor == Person);
```

输出结果为：

    [ Person { name: 'Tom', age: 18 },
      Person { name: 'Jerry', age: 16 } ]
    true

对于使用 `Writer` 类分次序列化的数据，需要与之对应的 `Reader` 类来分次反序列化。例如：

```ts
import { ByteStream, Writer, Reader } from '@hprose/io';

const stream = new ByteStream();
const writer = new Writer(stream);
writer.serialize(123);
writer.serialize(3.1415926);
writer.serialize("hello world");
writer.serialize([1, 2, 3, 4, 5]);
writer.serialize({ "name": "Tom", "age": 18 });
const reader = new Reader(stream);
console.log(reader.deserialize());
console.log(reader.deserialize());
console.log(reader.deserialize());
console.log(reader.deserialize());
console.log(reader.deserialize());
```

输出结果为：

    123
    3.1415926
    hello world
    [ 1, 2, 3, 4, 5 ]
    [Object: null prototype] { name: 'Tom', age: 18 }

`Reader` 除了 `deserialize` 方法以外，还有一个 `read` 方法，当你从 `stream` 中已经读取了标记字节的话，那么你可以使用 `read` 方法来进行反序列化。否则你应该用 `deserialize` 方法进行反序列化了。

如果你在使用 `Writer` 序列化时，设定了 `simple` 属性为 `true`。那么你在创建 `Reader` 对象时，也可以将 `simple` 属性设置为 `true`。这对反序列化可能会起到加速的作用，但如果序列化时，没有设置 `simple` 属性为 `true`，那么请不要创建 `simple` 属性为 `true` 的 `Reader` 对象，否则在反序列化时，会发生异常。

 通过 `Reader` 调用 `deserialize` 方法的次数应该跟调用 `Writer` 序列化方法的次数相同，如果在使用 `Writer` 进行序列化时，在中间调用了 `reset` 方法，那么在使用 `Reader` 进行反序列化时，也应该在调用同样次数的反序列化操作后，调用 `reset` 来重置引用计数，否则会因为引用计数错误而发生异常。

 至于 `Reader` 对象上的其它方法，只有在实现自定义反序列化时才可能会用到，平时不需要使用这几个方法。这里也不做详细说明了。如果有兴趣想要了解这几个方法，可以把 `deserializers` 目录中现有反序列化器的实现代码当作参考示例。