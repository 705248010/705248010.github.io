# 2.4LPC语言中的转义字符和颜色控制


# 2.4 LPC语言中的转义字符和颜色控制

## 2.4.1 转义字符

字符集（Character Set）为每个字符分配了唯一的编号，我们不妨将它称为编码值。在C语言中，一个字符除了可以用它的实体（也就是真正的字符）表示，还可以用编码值表示。这种使用编码值来间接地表示字符的方式称为转义字符（Escape Character）。

转义字符以\或者\x开头，以\开头表示后跟八进制形式的编码值，以\x开头表示后跟十六进制形式的编码值。对于转义字符来说，只能使用八进制或者十六进制或规定的字母。

转义字符既可以用于单个字符，也可以用于字符串，并且一个字符串中可以同时使用八进制形式和十六进制形式。

LPC 语言在这方面和C语言完全一样。

下面的例子演示了转义字符的用法，新建演示代码 `2.5.1.c`，代码如下：

```c
int main()
{
    // 转义字符输出
    write("\61\11\62\11\63\12");
    write("\141\x9\142\x9\143\xa");
    write("\61\62\63\t\x61\x62\x63\n");
    write("\123");
    write("\n");
    write('\123');
    write("\n");
    return 1;
}
```

运行输出如下：

```
1   2   3
a   b   c
123 abc
S
83
```

字符 1、2、3、a、b、c 对应的 ASCII 码的八进制形式分别是 61、62、63、141、142、143，十六进制形式分别是 31、32、33、61、62、63。字符S对应 ASCII 码八进制为123，十进制为83。

`\n`和`\t`是最常用的两个转义字符，它们是控制字符换行（八进制`\12`，十六进制`\xa`）和水平制表(八进制`\11`，十六进制`\x9`)的简写形式。

所有的转义字符和所对应的意义：

| 转义字符 | 意义                                | ASCII码值（八进制） | 备注      |
| -------- | ----------------------------------- | ------------------- | --------- |
| `\a`     | 响铃(BEL)                           | 007                 |           |
| `\b`     | 退格(BS) ，将当前位置移到前一列     | 010                 |           |
| `\e`     | 换码(ESC)                           | 033                 |           |
| `\f`     | 换页(FF)，将当前位置移到下页开头    | 014                 | LPC不支持 |
| `\n`     | 换行(LF) ，将当前位置移到下一行开头 | 012                 |           |
| `\r`     | 回车(CR) ，将当前位置移到本行开头   | 015                 |           |
| `\t`     | 水平制表(HT) （跳到下一个TAB位置）  | 011                 |           |
| `\v`     | 垂直制表(VT)                        | 013                 | LPC不支持 |
| `\\`     | 代表一个反斜线字符''\'              | 134                 |           |
| `\'`     | 代表一个单引号（撇号）字符          | 047                 |           |
| `\"`     | 代表一个双引号字符                  | 042                 |           |
| `\0`     | 空字符(NUL)                         | 000                 |           |
| `\ddd`   | 1到3位八进制数所代表的任意字符      | 三位八进制          |           |
| `\xhh`   | 十六进制所代表的任意字符            | 十六进制            |           |



## 2.4.2 ANSI颜色转义字符

在MUD游戏中我们看到的文字是五颜六色的，这就是ANSI颜色的功能，在各种MUD的 include 目录下都有一个 `ansi.h`，这里定义了各种颜色的符号常量，大家可能都只是使用，但并不能很好的理解。这里补充一下相关知识。

ANSI COLOR的格式如下：

```
ESC控制字符 + [ + 属性值 + m
```

其中ESC控制字符是不可显示的字符，难以正常输入，我们可以使用转义字符，此字符在ASCII码表中对应的是八进制`033`（十六进制`x1b`）或者使用`\e`，属性值为数字，如`\033[1m`为加粗显示文字，`\033[31m`为红色显示文字。具体主要属性值如下：

> 文本属性效果

| 属性值 | 文本效果说明                   |
| ------ | ------------------------------ |
| 0      | 清除所有属性                   |
| 1      | 加粗显示                       |
| 2      | Set color intensity to `faint` |
| 3      | 斜体显示                       |
| 4      | 加下划线显示                   |
| 5      | 慢速闪烁显示(每分钟少于150次)  |
| 6      | 快速闪烁显示(每分钟至少150次)  |
| 7      | 反色显示                       |
| 8      | 清除显示（隐藏内容，显示空格） |
| 9      | 加删除线显示                   |
| 21     | 双下划线显示                   |
| 22     | 取消加粗显示                   |
| 23     | 取消斜体显示                   |
| 24     | 取消加下划线显示               |
| 25     | 关闭慢速闪烁                   |
| 26     | 关闭快速闪烁                   |
| 27     | Reverse video: off             |
| 28     | Erase: off                     |
| 29     | Strikethrough: Off             |

> 前景色效果

| 属性值 | 颜色效果说明        |
| ------ | ------------------- |
| 30     | 黑色Black           |
| 31     | 红色Red             |
| 32     | 绿色Green           |
| 33     | 黃色Yellow          |
| 34     | 蓝色Blue            |
| 35     | 紫色Magenta         |
| 36     | 青色Cyan            |
| 37     | 白色White           |
| 39     | 默认色Default       |
| 90     | 浅灰色Light Gray    |
| 91     | 浅红色Light Red     |
| 92     | 浅绿色Light Green   |
| 93     | 浅黃色Light Yellow  |
| 94     | 浅蓝色Light Blue    |
| 95     | 浅紫色Light Magenta |
| 96     | 浅青色Light Cyan    |
| 97     | 浅白色Light White   |

> 背景色效果

| 属性值 | 颜色效果说明        |
| ------ | ------------------- |
| 40     | 黑色Black           |
| 41     | 红色Red             |
| 42     | 绿色Green           |
| 43     | 黃色Yellow          |
| 44     | 蓝色Blue            |
| 45     | 紫色Magenta         |
| 46     | 青色Cyan            |
| 47     | 白色White           |
| 49     | 默认色Default       |
| 100    | 浅灰色Light Gray    |
| 101    | 浅红色Light Red     |
| 102    | 浅绿色Light Green   |
| 103    | 浅黃色Light Yellow  |
| 104    | 浅蓝色Light Blue    |
| 105    | 浅紫色Light Magenta |
| 106    | 浅青色Light Cyan    |
| 107    | 浅白色Light White   |

请注意，属性值可以组合使用，每个值使用 `;` 分隔，顺序随意。如 `\033[3;4;33m` 为斜体+下划线黃色显示，`\033[1;33m`为加粗红色显示（高亮效果）。

另外，因为在终端加的颜色效果一直有效，为了避免给不想加效果的文字加上了颜色，一定要加上清除效果`\033[0m`或者省略0直接写为`\033[m`。

因为每次写颜色控制太麻烦，在游戏的 `ansi.h` 文件中把常用的控制字符定义成了字符常量方便使用，如：把红色定义为 `RED` ，把清除效果定义为 `NOR`，所以我们在开发中可以直接这样显示颜色：

```
RED "这是想显示为红色的文字" NOR
```

目前`ansi.h`中多数对 `NOR` 定义为 `ESC[2;37;0m"` 这有点多余，而且现在LIB中的颜色控制是不全的，如果有需要你可以自己补充更多的宏定义，具体定义了哪些颜色控制可以自己看文件。

> 参考资料：https://tintin.mudhalla.net/info/ansicolor/



## 2.4.3 256颜色和真彩色

除了ansi颜色外，现在多数客户端支持更丰富的颜色，相关说明如下：

| Code                     | Effect    | Note                                       |
| ------------------------ | --------- | ------------------------------------------ |
| `\e[`                    | CSI       | Control Sequence Indicator                 |
| CSI n m                  | ANSICOLOR | ANSI color code (Select Graphic Rendition) |
| CSI 38 ; 5 ; n m         | 256COLOR  | Foreground 8 bit 256 color code            |
| CSI 48 ; 5 ; n m         | 256COLOR  | Background 8 bit 256 color code            |
| CSI 38 ; 2 ; r ; g ; b m | TRUECOLOR | Foreground 24 bit rgb color code           |
| CSI 48 ; 2 ; r ; g ; b m | TRUECOLOR | Background 24 bit rgb color code           |

### 256 Color Options

| Code    | Effect               | Note                                                         |
| ------- | -------------------- | ------------------------------------------------------------ |
| 0-7     | 8 colors: normal     | The traditional 8 ANSI colors in normal intensity            |
| 8-15    | 8 colors: bold       | The traditional 8 ANSI colors in bold intensity              |
| 16-231  | 216 colors: rgb      | Each RGB color has a value between 0 and 5. Red is multiplied by 36, Green by 6, and Blue by 1. |
| 232-255 | 24 colors: grayscale | 24 shades of gray, not including black and white             |

![file](https://api.mud.ren/storage/uploads/2021/10/11/5f5501535abb2046fdc85ec7beb01d65.png)![file](https://api.mud.ren/storage/uploads/2021/10/11/c05419857099511773b5e9640dcbff21.png)

在`ansi.h`中增加以下宏定义：

```c
// Escape Sequences
#define CSI ESC + "[" /* Control Sequence Introducer */
// CSI Color Sequences
#define SGR(x) CSI + x + "m"                                      /* ANSI color code (Select Graphic Rendition) */
#define FCC(x) CSI + "38;5;" + x + "m"                            /* Foreground 256 color code */
#define BCC(x) CSI + "48;5;" + x + "m"                            /* Background 256 color code */
#define RGB(r, g, b) CSI + "38;2;" + r + ";" + g + ";" + b + "m"  /* Foreground 24 bit rgb color code */
#define BRGB(r, g, b) CSI + "48;2;" + r + ";" + g + ";" + b + "m" /* Background 24 bit rgb color code */
```

以后就可以直接用`RGB(0x00,0x88,0xff)"你好ABC123"NOR`给内容增加RGB颜色。

```c
int main(object me, string arg)
{
    int *rgb = ({0x00, 0x33, 0x66, 0x99, 0xcc, 0xff});

    printf("ANSI颜色测试：\n");
    for (int i = 30; i < 50; i++)
    {
        printf(SGR(i) "%d. 你好ABC" NOR, i);
        if (i % 5)
        {
            write("\t");
        }
        else
        {
            write("\n");
        }
    }

    printf("\n256颜色测试：\n");
    for (int i = 0; i < 256; i++)
    {
        printf(FCC(i) "%3d. 你好ABC" NOR, i);
        if (i % 5)
        {
            write("\t");
        }
        else
        {
            write("\n");
        }
    }

    printf("\nRGB颜色测试：\n");
    for (int r = 0; r < sizeof(rgb); r++)
    {
        for (int g = 0; g < sizeof(rgb); g++)
        {
            for (int b = 0; b < sizeof(rgb); b++)
            {
                printf(RGB(rgb[r], rgb[g], rgb[b]) "%'0'2x%'0'2x%'0'2x\t" NOR, rgb[r], rgb[g], rgb[b]);
            }
            write("\n");
        }
        write("\n");
    }

    return 1;
}
```

![file](https://api.mud.ren/storage/uploads/2021/10/11/e4e87e3a9ac0b6f8d5758d52fe964090.png)

注意：zMud只支持ANSI颜色，2008年以后的客户端基本都支持256颜色，2018年以后的客户端基本都支持RGB颜色。

### ECMA-48 CSI Sequences

聊了终端颜色转义外，还有光标控制，相关效果与说明如下表：

![file](https://api.mud.ren/storage/uploads/2021/10/24/03670f36e7644eb1eab3b3dc2a4595b8.png)

| Code        | Effect  | Note                                                         |
| ----------- | ------- | ------------------------------------------------------------ |
| CSI n @     | ICH     | Insert n blank characters                                    |
| CSI n A     | CUU     | Move cursor up n rows                                        |
| CSI n B     | CUD     | Move cursor down n rows                                      |
| CSI n C     | CUF     | Move cursor forward n columns                                |
| CSI n D     | CUB     | Move cursor backward n columns                               |
| CSI n E     | CNL     | Move cursor down n rows, to column 1                         |
| CSI n F     | CPL     | Move cursor up n rows, to column 1                           |
| CSI n G     | CHA     | Move cursor to column n                                      |
| CSI n ; m H | CUP     | Move cursor to row n, and column m                           |
| CSI n J     | ED      | 0 erase from cursor to end of display, 1 erase from start of display to cursor, 2 erase display, 3 erase display and buffer |
| CSI n K     | EL      | 0 erase from cursor to end of line, 1 erase from start of line to cursor, 2 erase line |
| CSI n L     | IL      | Insert n blank lines                                         |
| CSI n M     | DL      | Delete n lines                                               |
| CSI n P     | DCH     | Delete n characters                                          |
| CSI n S     | SU      | Scroll whole page up by n (default 1) lines. New lines are added at the bottom. (not ANSI.SYS) |
| CSI n T     | SD      | Scroll whole page down by n (default 1) lines. New lines are added at the top. (not ANSI.SYS) |
| CSI n X     | ECH     | Erase n characters                                           |
| CSI n ; m r | DECSTBM | Set scrolling region between top row n and bottom row m      |

在炎黄MUD的F_MESSAGE模块`void receive_message(string msgclass, string msg)`中有如下代码：

```c
if (written && !this_object()->is_attach_system())
{
    if (written == COMMAND_RCVD)
    {
        written = NONE;
        msg = CSI "256D" CSI "K" + msg;
    }
    else
        msg = CSI "256D" CSI "K" + msg + prompt();
}
```

这就就是光标转义控制，当收到消息会清除当前行prompt内容后再输出。注意光标控制不是所有客户端都支持，使用时要注意~

> 关于终端颜色，最直观的体验请看这里：http://mud.ren/websocket.html 连接游戏后上面显示的是原始数据，下面显示的是游戏效果。![file](https://api.mud.ren/storage/uploads/2022/03/28/67950914999e171eb1fbefd4aa527ff6.png)

