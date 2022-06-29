# 5.3基本输入输出函数


# 5.3 基本输入输出函数

和C语言比，LPC语言中提供了更多的输入输出函数。输出函数上，除了前面章节已经讲解并使用的 printf()/sprintf() 外部函数，还有以下主要函数：

## 5.3.1 输出函数

第一个输出函数是 write() 外部函数，作用是对当前玩家送出信息。

> 名称

```
write() - 对当前玩家送出信息
```

> 语法

```
void write(mixed str);
```

> 描述

```
对当前玩家显示 'str' 信息。 'str' 如果是数字会自动转换成字符串。对象类型也可以正常显示，但其它类型比如数组、映射、函数指针或缓冲区类型会显示为<ARRAY>、<MAPPING>、<FUNCTION>和<BUFFER>。
```

这个外部函数比 printf() 使用更简单，而且可以自动类型判断，在后续教程中会更多的使用这个函数输出。

第二个输出函数是 say() 外部函数，作用是把信息发送给在相同环境中指定对象以外的所有用户。

> 名称

```
say() - 把信息发送给在相同环境中的所有用户
```

> 语法

```
void say( string str );
void say( string str, object obj );
void say( string str, object *obj );
```

> 描述

```
把信息发送给发送者所在环境中的所有对象及所在环境是发送者的所有对象。发送者只能是 `this_player()` 或者 `this_player() == 0` 的 `this_object()`。第二个参数是可选的，如果指定第二个参数 `obj`，信息不会发给 `obj`，`obj` 可以是一个对象或者是对象数组。
```

在正常的游戏中，我们经常使用一个指令 `say` 和同一个房间中的玩家聊天。这里我们先实现这个指令，直接在 `cmds` 目录中新建文件 `say.c`，代码如下：

```c
#include <ansi.h>

int main(object me, string arg)
{
    if (!arg)
        arg = "...。";

    arg = HIC + arg + NOR + "\n";

    write("你说到：" + arg);
    say(HIY "玩家(" + geteuid(me) + ")说到：" NOR + arg);

    return 1;
}
```

以上代码实现了玩家输入指令 `say 内容` 聊天的功能。因为外部函数 say() 只是发送消息给别人，自己看不到，所以使用 write() 让自己也能看到。

代码中使用 `#include <ansi.h>` 这个头文件的位置在 `include` 目录中，主要作用是让我们的内容输出带彩色，其中定义的常量 `HIC` 代表使用天青色，`NOR` 代表取消颜色。主要颜色及控制符可以输入指令 `color` 查看。比如以下代码显示出来的是红色的：

```
write(HIR"这句内容是亮红色的\n"NOR);
```

另外使用了 geteuid(me) 外部函数获取玩家的有效用户ID，关于 UID 和 EUID 的内容在以后章节会讲，暂时大家记得在本测试项目中可以使用这个取得玩家的ID就好。

第三个输出函数是 shout()，其作用是对当前玩家以外的所有生物发送信息。

> 名称

```
shout() - 对所有活着的（living）对象发送信息
```

> 语法

```
void shout( string str );
```

> 描述

```
对 this_player() 以外的所有活着的对象发送信息 `str`。
```

和 say() 不同的是，say() 发送的消息只有玩家所在环境的其它玩家可以玩家可以看到，而 shout() 是游戏中所有玩家都可以收到。同样，我们先在 `cmds` 目录新建一个文件 `shout.c` 实现游戏聊天功能。代码如下：

```c
#include <ansi.h>

int main(object me, string arg)
{
    if (!arg)
        arg = "...。";

    arg = HIM "【聊天】" NOR HIY "玩家(" + geteuid(me) + ")：" NOR HIC + arg + NOR "\n";

    write(arg);
    shout(arg);

    return 1;
}
```

请注意，实际游戏中我们的 `chat 内容` 聊天并不是简单的使用 shout() 指令完成的，为了实现聊天、表情及禁言功能，使用了更高级的方式，具体内容会在本教程《从零开发LPMUD游戏》 高级篇中讲解实现。

第四个输出函数是 tell_object()，其作用是向指定对象发送消息。

> 名称

```
tell_object() - 向一个对象发送消息
```

> 语法

```
void tell_object( object ob, string str );
```

> 描述

```
向 `ob` 对象发送消息 `str`，如果对象是玩家，消息会显示给对方，否则会被此对象中的 apply 方法 `catch_tell()` 捕获。
```

使用这个指令可以很容易实现游戏中的私聊功能，具体实现这里先不演示了。

第五个输出函数是 tell_room()，其作用是对指定房间中的所有对象发出消息。

> 名称

```
tell_room() - 对一个房间中的所有对象发送消息
```

> 语法

```
void tell_room( mixed ob, string str );
void tell_room( mixed ob, string str, object *exclude );
```

> 描述

```
向房间 `ob` 中的所有对象发送消息 `str`，`ob` 既可以是房间对象，也可以是房间文件名字符串。如果指定 `exclude` 参数，所有在此数组中的对象不会收到消息。
```

这个外部函数和 say() 不同的是 say() 只能发给玩家所在房间，tell_room() 可以发给任何房间。

第六个输出函数是 message()，这个外部函数功能很灵活，需要结合 receive_message() apply 方法和 receive() 外部函数使用。在开发中推荐使用这个外部函数来控制玩家的所有信息输出，教程目前阶段如果演示还得补充一些知识，所以本函数暂不演示和讲解，在以后的教程中会给具体使用方式讲解。



## 5.3.2 输入函数

相对 C 语言中提供的scanf()、getchar()、getche()、getch()、gets()等各种接收输入的函数，在LPC语言中就简单了很多，因为 LPC 语言是针对游戏环境，随时接收玩家的指令，没有这些输入函数，玩家的所有输入都会以指令的方式处理，比如本教程中大家输入的所有执行代码示例指令。

具体关于指令的处理流程基本篇暂不讲解，这里先介绍LPC中存在的特别的输入函数 `input_to()` 和 `get_char()`。在我们连接游戏时有提示大家输入英文名，这个就是使用 `input_to()` 外部函数处理的。

> 名称

```
input_to()  - 把玩家接下来输入的内容传递给指定的函数
```

> 语法

```
varargs void input_to( string | function fun, int flag, ... );
```

> 描述

```
把玩家接下来输入的内容做为参数传给局部函数 `fun`。驱动程序不会解析（parse）输入的字符。

请注意： input_to() 是非阻塞式监听，也就是说呼叫 input_to() 的对象不会暂停下来等待用户输入，而是继续执行后续程序。

如果在同一次执行时多次调用 input_to()，仅第一次呼叫有效。

如果可选参数 `flag` 非零，用户输入的字符不会回显，在被窃听(snoop)时也不会显示（这在输入密码时很有用）。

函数 `fun` 执行时用户输入的字符会做为第一个参数（字符串类型），input_to() 函数 `flag` 之后的参数会做为额外参数传递给 `fun`。

说明：这个外部函数的用法和 get_char() 外部函数及其类似，只是获取的输入从单个字符改为字符串。
```

外部函数 `get_char()` 的作用和 `input_to()` 类似，只是从获取输入的字符串内容变为获取输入的第一个字符。以下是示例代码：

```c
// 示例：5.4.1.c
void input(string arg)
{
    if (!arg || arg == "")
    {
        write("内容不能为空，请重新输入：");
        input_to("input");
    }
    else
    {
        write("你输入的内容是：" + arg + "\n");
        write("请输入英文字符：");
        get_char("getchar");
    }
}

void getchar(string arg)
{
    // 注意，这里还应该加上非英文字符判断，否则获取的可能不是你期望的
    if (!arg || arg == "")
    {
        write("字符不能为空，请重新输入：");
        input_to("getchar");
    }
    else
    {
        write("你输入的字符是：" + arg + "\n");
    }
}

int main(object me, string arg)
{
    write("请输入内容：");
    input_to("input");

    return 1;
}
```

