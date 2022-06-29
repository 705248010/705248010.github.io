# 6.3映射常用外部函数


# 6.3 映射常用外部函数

数组其实是一种有序映射，相比映射中的 `key` 是指定的字符串类型，数组的 `key` 固定为从 0 开始的整型索引。在其它高级语言中，数组/映射已经合体了，在LPC语言中虽然是分开的，但在语法上有很多相通之处。

## 6.3.1 映射初始化

映射变量定义和初始化可以使用以下方式：

```
mapping x = ([key0 : value0, key1 : value1, ...]);
mapping y = ([]);
mapping z = allocate_mapping(10);
```

提示：映射的key和value可以是任意数据类型。

映射必须初始化后才能向其中插入值，否则会报错：`Illegal type of index`。其中 `allocate_mapping()` 是外部函数，具体语法说明如下：

> 名称

```
allocate_mapping() - 为一个映射（mapping）变量预分空间
```

> 语法

```
mapping allocate_mapping( int size );
```

> 描述

```
返回一个预分配了 `size` 个元素的映射变量。
```

使用 allocate_mapping 初始化变量是首选方式。因为这样一次性分配所有空间的内存利用效率更高。如果你要使用映射存储 200 项资料，使用 `allocate_mapping(200)` 初始化是相当适合的。注意，这并不代表只能存储 200 项资料，只是前 200 项资料能更有效的存储。如果映射的元素不固定，比如你需要从映射中删除大量的元素，使用 x = ([]) 来初始化映射比使用 allocate_mapping(size) 更好，因为在这种情况下 `size` 是无意义的。

另外 `allocate_mapping()`还支持以下语法：

```
mapping allocate_mapping(mixed *key, mixed value);
```

这里key是映射的键组成的数组，value如果是数组则对应映射的值，这个数组必须和key一样大小，value如果是function则映射的值为evaluate(value, key)，否则映射的值就是value。

如：

```c
int main(object me, string arg)
{
    string *keys = ({"a", "b", "c"});
    mapping m1 = allocate_mapping(keys, ({"一", "二", "三"}));
    mapping m2 = allocate_mapping(keys, "mud");
    mapping m3 = allocate_mapping(keys, (: repeat_string($1, 5) :));

    printf("m1 = %O\n", m1);
    printf("m2 = %O\n", m2);
    printf("m3 = %O\n", m3);

    return 1;
}
```

输出结果：

```
m1 = ([ /* sizeof() == 3 */
  "a" : "一",
  "b" : "二",
  "c" : "三",
])
m2 = ([ /* sizeof() == 3 */
  "a" : "mud",
  "b" : "mud",
  "c" : "mud",
])
m3 = ([ /* sizeof() == 3 */
  "a" : "aaaaa",
  "b" : "bbbbb",
  "c" : "ccccc",
])
```

注意：和数组一样，映射也是复合类型，变量存的是引用（地址）不是值，如果映射 m1 = m2，那们他们指向的是同一个地址，对 m1 或 m2 任何一个的改变都会改变另一个变量(在下面讲解赋值时会给具体案例)。如果不要二个相等的变量有关联，请使用上一节数组中介绍的`copy()`函数，如：`m1 = copy(m2)`；



## 6.3.2 映射赋值

向映射中插入值可以使用以下方式：

```
x[key] = value;
x += ([key:value]);
```

执行以上语句时驱动会在映射 x 中寻找指定的 key，如果映射中包含这个 key，会更新 key 的值为 value，如果映射中不存在指定 key，会新增对应的键和值到映射中。

重要冷知识：对映射运算 `m1 += m2;` 和 `m1 = m1 + m2;` 不完全等价，后一种方式改变了m1的引用地址。

看如下示例：

```c
{
    mapping a, b, c;
    string *key1 = ({"a", "b"});
    string *key2 = ({"c", "d"});
    a = allocate_mapping(key1, "val1");
    b = allocate_mapping(key2, "val2");

    c = b;
    b += a;
    // b = b + a;
    b["a"] = "val3";
    printf("a= %O b = %O c = %O\n", a, b, c);
}
```

以上示例中，映射c等于映射b，指向同一个地址，对`b += a;`没有改变映射b的地址，所以`b["a"]="val3";`的改变也造成了映射c值的改变，但`b = b + a;`改变了映射b的地址，对映射b的操作不再改变映射a。

获取映射指定键的值直接使用 `x[key]`，但注意但是如果映射中不存在对应但 key ，返回值默认为 0 。可以使用 `undefinedp()` 外部函数判断映射中是否存在指定的 key：

```c
    if (undefinedp(x["key"]))
    {
        // 如果映射 x 中没有定义 key
    }
```

外部函数 `undefinedp()`的具体语法说明如下：

> 名称

```
undefinedp() - 检测指定变量是否未定义（undefined）
```

> 语法

```
int undefinedp( mixed arg );
```

> 描述

```
如果变量 `arg` 未定义返回 1。`arg` 在以下几种情况下算未定义：
1. 变量是 call_other 外部函数呼叫对象中不存在的函数的返回值(如： arg = call_other(obj, "???"))
2. 变量是映射变量中不存在的元素。(如： arg = map[not_there])
3. 变量没有初始化。
4. 变量是函数的形式参数，但在调用时没有传递实参。
```

映射的值可以是任何支持的数据类型。



## 6.3.3 映射元素删除

从映射中删除元素可以使用 `map_delete()` 外部函数：

```
map_delete(x, key);
```

外部函数 `map_delete()` 的具体语法说明如下：

> 名称

```
map_delete() - 通过 key 从一个映射移除一组值(key:value)
```

> 语法

```
void map_delete( mapping m, mixed element );
```

> 描述

```
map_delete 从映射 `m` 中移除 key 为 `element` 的键值对(key : value)。
```

注意，不能像数组一样用运算符 `-` 移除元素。



## 6.3.4 获取映射所有键和值

可以使用外部函数 `keys()` 和 `values()` 获取映射的所有键和值，函数返回值是数组格式。具体语法说明如下：

> 名称

```
keys() - 返回一个映射 m 的所有 key 组成的数组。
```

> 语法

```
mixed *keys( mapping m );
```

> 描述

```
keys() 返回一个包括映射 `m` 的所有索引（key）的数组
```

------

> 名称

```
values() - 返回一个映射 m 所有 value 组成的数组
```

> 语法

```
mixed *values( mapping m );
```

> 描述

```
values() 返回一个映射 `m` 所有 value 组成的数组
```

请注意，`key()` 返回的 key 并不会有固定的顺序，不过其顺序和 `values()` 外部函数返回的值 value 顺序相同。



## 6.3.5 多维映射

和数组一样，映射也可以定义，如果映射的值还是映射，就构成多维映射。如下示例，可以使用 `x["key"]["test"]` 返回映射值 value。

```c
    mapping x = ([
        "key" : ([
            "test" : "value"
        ])
    ]);
```



## 6.3.6 映射的合并运算

在映射中可以和数组一样使用 `+` 运算符合并映射，如下示例：

```c
    mapping x = (["key1" : "value1"]);
    x += (["key2" : " value2"]);
```

结果 x = (["key1":"value1","key2":"value2"])

注意前面提的知识点： x += y 不同于 x = x + y，对映射合并运算，一般情况下推荐使用`+=`。

另外，映射还可以使用运算符 `*`，如下示例：

```c
    mapping x = (["key1" : "value1"]);
    x *= (["value1" : " value2"]);
```

结果 x = (["key1":"value2"])

映射其它相关外部函数还有：filter_mapping、map_mapping、mapp、match_path、unique_mapping，具体语法可以看：https://wiki.mud.ren/index.php?title=Lpc:Efun

