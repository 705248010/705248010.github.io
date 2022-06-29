# 5.4游戏最常用的外部函数


# 5.4 游戏最常用的外部函数

在本章第一节 《LPC语言的函数和方法》 中说明有一类函数叫模拟外部函数（simulated external function），但我们一直没有使用到。为方便后续章节学习，我们先实现几个模拟外部函数，当然，在要教程配套的 mudlib 中，已经写好。

我们打开 `/system/kernel/simul_efun.c` 文件看看代码：

```c
#include <ansi.h>

...

void debug(mixed arg)
{
    string *color = ({HIB, HIC, HIG, HIM, HIR, HIW, HIY});

    write(element_of(color) + arg + NOR "\n");
}

// 数字字符串转数字
int atoi(string str)
{
    int v;

    if (!stringp(str) || !sscanf(str, "%d", v))
        return 0;

    return v;
}

// 数组打印
varargs void print_r(mixed *arr, int step)
{
    int i, j;
    if (sizeof(arr))
    {
        write(YEL "({\n" NOR);

        for (i = 0; i < sizeof(arr); i++)
        {
            if (arrayp(arr[i]))
            {
                step++;
                for (j = 0; j < step; j++)
                {
                    write("    ");
                }
                write(i + " => ");
                print_r(arr[i], step);
                step--;
            }
            else
            {
                for (j = 0; j <= step; j++)
                {
                    write("    ");
                }
                write(i + " => " + arr[i] + "\n");
            }
        }

        for (j = 0; j < step; j++)
        {
            write("    ");
        }
        write(YEL "})\n" NOR);
    }
    else
    {
        write(YEL "({ })\n" NOR);
    }
}

...
```

这里实现了部分 sefun，其中 debug()、atoi() 和 print_r()的作用简单说明：debug() 的作用就是 write() 自动换行并随机配色，这样不用每次调试代码时都要用 "\n" 换行；atoi() 主要用来把指令中的参数中的字符串型数字转为整型；print_r() 则是自己实现的一个打印数组函数，方便测试数组输出(比 printf() 等方式更简单更美观)。以后的学习中我们会使用这些模拟外部函数，请注意和外部函数区分。

sefun 除了实现全局可用的自定义函数，还可以保护重要的外部函数，这种情况下需要实现一个和外部函数同名的模拟外部函数，实现自己的功能，而需要使用原始的外部函数时需要使用 `efun::` 前缀。比如对关闭游戏的外部函数 `shutdown()`，为了安全需要记录是谁关闭的，或者限制谁才有权限使用这个指令，可以定义类似下以的模拟外部函数：

```c
void shutdown(int how)
{
    // 用户权限判断功能实现
    // 关闭日志记录功能实现

    // 调用外部函数
    efun::shutdown(how);
}
```

需要注意的是，如果使用了 `efun::` 就会触发 apply 方法 `valid_override()`，这个方法在对象 `/system/kernel/master` 中。这个方法的用法如下：

> 名称

```
valid_override - 控制 `efun::` 前缀的使用
```

> 语法

```
int valid_override( string file, string efun_name , string main_file );
```

> 描述

```
在主控对象中增加 valid_override() 方法以控制 `efun::` 前缀的使用。每当驱动程序试图编译一个以 `efun::` 为前缀调用外部函数的文件时都会呼叫主控对象中的 valid_override() 方法。如果 valid_override() 返回 0 ，编译会失败。因此 valid_override() 提供了一种方式保证修改过功能的外部函数（同名模拟外部函数）无法使用 efun:: 绕过。

参数 `file` 是实际使用 efun:: 的文件，参数 `efun_name` 是通过 efun:: 调用的外部函数名称，参数 `main_file` 是准备编译的文件（包含扩展名 `.c`，而且通过使用 #include，`file` 和 `main_file` 可以不同）。
```

这里是一个通过 valid_override 限制重写外部函数的示例：

```c
    int valid_override(string file, string name, string main_file)
    {
        if (file == "/system/kernel/simul_efun")
        {
            return 1;
        }
        if (name == "destruct")
            return 0;
        if (name == "shutdown")
            return 0;
        if (name == "snoop")
            return 0;
        if (name == "exec")
            return 0;
        return 1;
    }
```

在本教程代码中，默认所有 `efun::` 调用都返回 1。

