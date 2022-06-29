# 7.3条件编译


# 7.3 条件编译

LPC条件编译的使用和C语言完全相同,主要包括如下：

## 7.3.1 if...#endif

`#if` 命令的完整格式为：

```
#if 整型常量表达式1
    程序段1
#elif 整型常量表达式2
    程序段2
#elif 整型常量表达式3
    程序段3
#else
    程序段4
#endif
```

`#if...#endif`指令用于预处理器的条件判断，满足条件时，内部的行会被编译，否则就被编译器忽略。

```c
#if 0
  float pi = 3.1415; // 不会执行
#endif
```

上面示例中，`#if`后面的`0`，表示判断条件不成立。所以，内部的变量定义语句会被编译器忽略。`#if 0`这种写法常用来当作注释使用，不需要的代码就放在`#if 0`里面。

`#if`后面的判断条件，通常是一个表达式。如果表达式的值不等于`0`，就表示判断条件为真，编译内部的语句；如果表达式的值等于0，表示判断条件为伪，则忽略内部的语句。

`#if...#end`之间还可以加入`#else`指令，用于指定判断条件不成立时，需要编译的语句。

```c
#define FOO 1

#if FOO
  printf("defined\n");
#else
  printf("not defined\n");
#endif
```

上面示例中，宏`FOO`如果定义过，会被替换成`1`，从而输出`defined`，否则输出`not defined`。

如果有多个判断条件，还可以加入`#elif`命令。

```c
#if HAPPY_FACTOR == 0
  printf("I'm not happy!\n");
#elif HAPPY_FACTOR == 1
  printf("I'm just regular\n");
#else
  printf("I'm extra happy!\n");
#endif
```

上面示例中，通过`#elif`指定了第二重判断。注意，`#elif`的位置必须在`#else`之前。如果多个判断条件皆不满足，则执行`#else`的部分。

没有定义过的宏，等同于`0`。因此如果`UNDEFINED`是一个没有定义过的宏，那么`#if UNDEFINED`为伪，而`#if !UNDEFINED`为真。

`#if`的常见应用就是打开（或关闭）调试模式。

```c
#define DEBUG 1

#if DEBUG
printf("value of i : %d\n", i);
printf("value of j : %d\n", j);
#endif
```

上面示例中，通过将`DEBUG`设为`1`，就打开了调试模式，可以输出调试信息。

**在LPC中有一个特殊的预编译判断函数`efun_defined`，可以判断指定efun是否定义**，如：

```c
#if efun_defined(parse_command)
    // todo
#else
    // todo
#endif
```



## 7.3.2 ifdef...#endif

`#ifdef` 命令的格式为：

```
#ifdef  宏名
    程序段1
#else
    程序段2
#endif
```

`#ifdef...#endif`指令用于判断某个宏是否定义过。

有时源码文件可能会重复加载某个库，为了避免这种情况，可以在库文件里使用`#define`定义一个空的宏。通过这个宏，判断库文件是否被加载了。

```c
#define EXTRA_HAPPY
```

上面示例中，`EXTRA_HAPPY`就是一个空的宏。

然后，源码文件使用`#ifdef...#endif`检查这个宏是否定义过。

```c
#ifdef EXTRA_HAPPY
  printf("I'm extra happy!\n");
#endif
```

上面示例中，`#ifdef`检查宏`EXTRA_HAPPY`是否定义过。如果已经存在，表示加载过库文件，就会打印一行提示。

`#ifdef`可以与`#else`指令配合使用。

```c
#ifdef EXTRA_HAPPY
  printf("I'm extra happy!\n");
#else
  printf("I'm just regular\n");
#endif
```

上面示例中，如果宏`EXTRA_HAPPY`没有定义过，就会执行`#else`的部分。

`#ifdef...#else...#endif`可以用来实现条件加载。

```c
#ifdef MAVIS
  #include "foo.h"
  #define STABLES 1
#else
  #include "bar.h"
  #define STABLES 2
#endif
```

上面示例中，通过判断宏`MAVIS`是否定义过，实现加载不同的头文件。



## 7.3.3 ifndef...#endif

`#ifndef` 命令的格式为：

```
#ifndef 宏名
    程序段1
#else
    程序段2
#endif
```

`#ifndef...#endif`指令跟`#ifdef...#endif`正好相反。它用来判断，如果某个宏没有被定义过，则执行指定的操作。

```c
#ifdef EXTRA_HAPPY
  printf("I'm extra happy!\n");
#endif

#ifndef EXTRA_HAPPY
  printf("I'm just regular\n");
#endif
```

上面示例中，针对宏`EXTRA_HAPPY`是否被定义过，`#ifdef`和`#ifndef`分别指定了两种情况各自需要编译的代码。

`#ifndef`常用于防止重复加载。举例来说，为了防止头文件`myheader.h`被重复加载，可以把它放在`#ifndef...#endif`里面加载。

```c
#ifndef MYHEADER_H
  #define MYHEADER_H
  #include "myheader.h"
#endif
```

上面示例中，宏`MYHEADER_H`对应文件名`myheader.h`的大写。只要`#ifndef`发现这个宏没有被定义过，就说明该头文件没有加载过，从而加载内部的代码，并会定义宏`MYHEADER_H`，防止被再次加载。

在LPC编程中，推荐使用`#ifndef`防止头文件重复定义，如：

```
#ifndef ANSI_H
#define ANSI_H

// 定义头文件

#endif
```

推荐把所有头文件都以这种方式定义，注意定义的宏不要重名就好。

**注意在LPC语言中没有 `defined` 预处理**

```c
// 示例：7.3.1
#define X 11

int main(object me, string arg)
{
#ifdef FLUFFOS
    debug("driver 是 FLUFFOS!");
#else
    #ifdef MUDOS
        debug("driver 是 MUDOS!");
    #else
        debug("未知 driver!");
    #endif
#endif

#if X < 1 || X > 10
    debug("X = " + X);
#else
    debug("...");
#endif

#ifdef __PACKAGE_DB__
    debug("支持数据库！");
#endif

    return 1;
}
```

