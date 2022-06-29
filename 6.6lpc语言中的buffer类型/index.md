# 6.6LPC语言中的buffer类型


# 6.6 LPC语言中的buffer类型

在教程第二章第二节中有介绍buffer数据类型，缓冲(buffer)类型是LPC语言中介于数组和字符串类型之间的一种数据类型，这个数据类型更多是为了方便对二进制数据操作。类似于C语言中的字符串，缓冲类型是一个字符数组，每个元素都是一个字符，长度是一个字节(byte)，但和C语言的字符串不同，缓冲数据不是零值终止，需要指定长度。

这里先列出LPC语言中buffer相关efun：

```c
buffer allocate_buffer(int);
buffer buffer_transcode(buffer, string, string);
buffer compress(string | buffer);
buffer string_encode(string, string);
buffer uncompress(string | buffer);
int bufferp(mixed);
int crc32(string | buffer);
int sizeof(mixed);
int write_buffer(string | buffer, int, string | buffer | int);
mixed read_buffer(string | buffer, void | int, void | int);
string sha1(string|buffer);
string string_decode(buffer, string);
void receive(string | buffer);
```

我们先看看buffer类型的基本操作，初始化与赋值：

```c
int main(object me, string arg)
{
    // 初始化10个字节的buffer
    buffer bf = allocate_buffer(10);
    string str;
    printf("bf = %O", bf);
    bf[0] = 0x61; // ascii字符a
    bf[1] = 0x62; // ascii字符b
    bf[2] = 0x63; // ascii字符c
    bf[3] = 0x64; // ascii字符d

    // 汉字你utf8编码E4BDA0
    bf[4] = 0xe4;
    bf[5] = 0xbd;
    bf[6] = 0xa0;
    // 汉字好utf8编码E5A5BD
    bf[7] = 0xe5;
    bf[8] = 0xa5;
    bf[9] = 0xbd;
    printf("bf = %O", bf);
    str = string_decode(bf, "utf8");
    printf("str = %s, strlen = %d\n", str, sizeof(str));

    // 汉字你GBK编码C4E3
    bf[4] = 0xc4;
    bf[5] = 0xe3;
    // 汉字好GBK编码BAC3
    bf[6] = 0xba;
    bf[7] = 0xc3;
    printf("bf = %O", bf);
    str = string_decode(bf, "gbk");
    printf("str = %s, strlen = %d\n", str, sizeof(str));

    return 1;
}
```

运行以上代码显示：

```
bf = BUFFER ( /* sizeof() == 10 */
  0x0,
  0x0,
  0x0,
  0x0,
  0x0,
  0x0,
  0x0,
  0x0,
  0x0,
  0x0
)bf = BUFFER ( /* sizeof() == 10 */
  0x61,
  0x62,
  0x63,
  0x64,
  0xe4,
  0xbd,
  0xa0,
  0xe5,
  0xa5,
  0xbd
)str = abcd你好, strlen = 6
bf = BUFFER ( /* sizeof() == 10 */
  0x61,
  0x62,
  0x63,
  0x64,
  0xc4,
  0xe3,
  0xba,
  0xc3,
  0xa5,
  0xbd
)str = abcd你好ソ, strlen = 7
```

代码中我们初始化了长度为10个字节的buffer,buffer是字节数组，可以和数组一样的操作。这里我们分别针对每个字节赋值，并使用`string_decode`函数把buffer转为字符串，这里测试了汉字**你好**直接以字节的方式处理，对于汉字如果是UTF8编码，每个汉字占3个字节，你utf8编码E4BDA0，好utf8编码E5A5BD，如果是GBK编码每个汉字占2个字节，你GBK编码C4E3，好GBK编码BAC3。

注意：buffer类型类似数组，变量存的是地址，不是值。

以上示例只是展示了我们可以直接以字节的方式赋值操作内存，在实际开发中很少这样做，更多是以buffer的方式读取二进制流然后做处理，比如：把utf8编码的内容转换成gbk编码后和GBK编码的MUD通信。

关于buffer的使用案例可以参考：[在MUD中实现ASCII点阵输出汉字](https://bbs.mud.ren/threads/73) 这个案例中，汉字字库信息是以buffer格式读取，然后处理为点阵字符画输出。

