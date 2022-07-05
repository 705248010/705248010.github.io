# 8.18LPC开发调试与错误排查


# 8.18 LPC开发调试与错误排查

## LPC开发调试

游戏开发时，总会遇到各种错误，这个需要我们会调试问题，排查错误，在讲具体排查前，先说说相关基础知识，包括日志是怎么生成的，有哪些调试方式。

当然，如果你不想了解原理和底层的东西，只想解决代码问题，前面部分的内容可以跳过，直接从**代码错误排查**部分开始阅读，但是，如果想成为优秀的开发者，最好从头开始阅读，做到**知其然并知其所以然**。



## 日志追踪方式

游戏运行时我们可以根据需要记录日志，另外对错误驱动会自动调整相关方法让开发者方便处理。

驱动提供了几个核心方法：

```
log_error(4), error_handler(4), debug_message(3)
```

另外还有 debug_info、cache_stats、mud_status、query_load_average、dump_prog、dumpallobj、memory_info 等外部函数和 valid 系列 apply 方法，可以参考mud.wiki查函数文档。

多数ＭＵＤ至少有三个日志文件：

- debug.log - 运行时配置文件中`debug log file`项指定的文件，记录驱动运行日志和`debug_message`日志
- log_error - 主控对象中`log_error`方法中记录的日志，记录代码基本错误和警告
- error_handler - 主控对象中`error_handler`方法中记录的日志，记录编译错误的详细追踪

> 提示：不同ＭＵＤ的日志文件名不一定一样，所以具体请看以上文件中指定的名称。

这日志中除了`debug.log`是驱动固定自动生成的外，其它的是有开发者实现的，具体是通过 `error_handler` 和 `log_error` 这二个 MASTER_OB 中的核心 apply 方法记录游戏编译错误。使用语法如下：

> 名称

```
error_handler - 主控对象中处理错误的函数
```

> 语法

```
void error_handler( mapping error, int caught );
```

> 描述

```
此方法在驱动程序编译时定义了 MUDLIB_ERROR_HANDLER 才有效。

这个方法允许 mudib 代替驱动程序处理错误，映射 `error` 中的内容如下：

([
    "error"   : string,     // 错误
    "program" : string,     // 出错程序
    "object"  : object,     // 当前对象
    "line"    : int,        // 错误所在行
    "trace"   : mapping*    // 错误追溯
])

每行错误追溯是一个包括以下内容的映射：

([
    "function"  : string,   // 函数名
    "program"   : string,   // 程序
    "object"    : object,   // 对象
    "file"      : string,   // 行号指向的文件
    "line"      : int       // 行号
])

如果错误被 catch() 外部函数捕获，标识符参数 `caught` 值为 1 。
```

------

> 名称

```
log_error - 灵活的记录错误
```

> 语法

```
void log_error( string file, string message );
```

> 描述

```
在编译过程中出现错误时，驱动程序以发生错误的对象的文件名 `file` 和 错误信息 `message` 为参数调用主控对象中的 log_error() 方法。之后，log_error() 方法可以根据这些信息自由的做任何它认为可以做的事情，通常，log_error() 会根据文件名决定错误信息应该记录在哪里并写入对应的文件。
```

`error_handler` 主要用来追踪编译错误，包括出错程序、错误位置等，是在编译出错时自动调用；而 `log_error` 主要是记录错误信息，可以提示编译错误的原因，还记录可以通过编译的警告信息，如未用变量、重复定义、重复继承等。这二个方法示例代码如下：

```c
// 记录错误和警告日志
void log_error(string file, string message)
{
    if (strsrch(message, "Warning") == -1)
    {
        if (this_player(1))
        {
            if (wizardp(this_player(1)))
                efun::write("编译时段错误：" + message + "\n");
            else
                efun::write(get_config(__DEFAULT_ERROR_MESSAGE__) + "\n");
        }
        // 记录错误日志
        efun::write_file(LOG_DIR + "log_error", message);
    }
    else
    {
        // 记录警告日志
        efun::write_file(LOG_DIR + "log", message);
    }
}
// 编译错误追踪
void error_handler(mapping map, int caught)
{
    string str = "[" + ctime(time()) + "]";

    str += sprintf("\n%O\n\n", map);

    if (caught)
        printf("%s", map["error"]);
    else
        debug("出错啦！详情记录在 error_handler 日志。");

    write_file(LOG_DIR + "error_handler", str);
}
```

`log_error` 记录错误信息到日志目录`log/` 下的 `log_error` 文件中，而 `error_handler` 记录编译错误到日志目录`log/` 下的 `error_handler` 文件中。

> 如果你不想修复未用变量警告，可以修改以上代码，关闭警告日志。

当游戏报错时优先查看 `log_error` 输出的日志，常见错误示例：

```
/cmds/demo/8.3.7.c line 20: Warning: Unused local variable 'qrcode' before the end of line
/cmds/demo/8.3.7.c line 40: Undefined variable 'receiver' before  me;
/cmds/demo/8.3.7.c line 40: Illegal lvalue before  me;
```

> 提示：如果你的master中没有实现这二个方法，错误日志会记录到debug.log中

除了以上二个方法外，我们还可以主动输出内容调试，为避免用write等方法输出到客户端，推荐使用`debug_message`方法。

`debug_message` 的作用是可以在代码中输出内容到驱动 `debug.log` 日志中，用来调试输出非常方便，其语法如下：

> 名称

```
debug_message() - 记录调试信息到日志文件
```

> 语法

```
void debug_message(string msg);
```

> 描述

```
在驱动程序的标准错误输出界面中打印给定的信息并附加到 debug 日志文件。
```

当你出输逻辑错误时，可以使用这个函数做断点调试。另外，有一个和 `debug_message` 类似的`#echo` ,也可以输出信息到驱动标准错误界面中，但和`debug_message`不同的是 `#echo` 不是函数，而是预处理指令，可以在任何在地方使用，而且只能原样输出信息，不会输出变量的值。另外还有 `catch`、`error`、`throw`用来捕获或强制生成错误的函数。

### 常见错误

错误相关代码：[simulate.cc](https://github.com/fluffos/fluffos/blob/master/src/vm/internal/simulate.cc)

```
Error in mudlib error handler: *Object cannot be loaded during compilation.
```



## 驱动级别到调试

除了以上介绍的方法和函数记录日志分析调试外，还有驱动层面的调试。

在驱动启动时可以增加 -d 参数来跟踪驱动运行，可用参数包括 -d、-dconnections、-ddns、-devent、-dsockets、-dLPC、-dLPC_line、-dfile等。

```
./driver -d<type>
```

> Current choice of type includes

- "-dconnections", shows all player connection related events.
- "-devent", shows internal event loop messages.
- "-ddns", shows async dns resolution messages.
- "-dsockets", shows all lpc socket related messages.
- "-dLPC", shows current LPC execution informations.
- "-dLPC_line", shows current LPC line being executed.
- "-dfile", shows some file related messages.
- "-dadd_action", show add_action related logs.
- empty (aka. "-d"), this currently shows connections + dns + sockets messages, will change later.
- other debug message is not yet fully categorized, like "-dflag".

通过以上方式在运行时会在驱动界面输出更多的内容方便追踪问题。

如果你想跟踪驱动运行的细节，还可以在驱动启动时使用 `--tracing trace_driver.json` 输出游戏驱动运行细节到 `trace_driver.json` 文件中分析。关于trace的分析使用，可参考此文：[FluffOS v2019 正式版 lpc tracing 说明](https://bbs.mud.ren/threads/84)

另外还有一个 -f 参数来标记一些驱动状态，配合 valid 系列方法实现游戏运行流程追踪，当然这又回到代码层面的调试了。

### 针对驱动的调试

如果在游戏中出现驱动crash，在确定不是代码错误而是驱动问题造成的情况下，需要做驱动调式，可以使用gdb工具，常用gdb调试命令汇总：

![file](https://api.mud.ren/storage/uploads/2021/10/18/bbedc1a83f8f8942c9be99d5c1be026f.png)

驱动调式操作示例：

```bash
$ gdb --args driver config.ini
```

然后在GDB界面输入：

```bash
> handle SIGPIPE nostop noprint pass
> run
```

启动游戏后再次触发crash，然后输入：

```bash
> bt
> info locals
```

把看到的调式消息反馈到fluffos项目issue中吧。

> 提示：我们的绝大数据错误都是代码问题，不是驱动问题，所以出BUG后请优先调试你的代码，不要有我的代码是好的出错了是驱动的问题这种思想，只有100%确定你的代码没有问题后再考虑是驱动的锅并使用gdb调试。



## 代码错误排查

前面讲了LPC的开发调试相关内容，了解了日志记录相关知识，也知道了各种调试方式，实际的游戏开发中，我们并不会用到多少深度的调试，更多的是根据日志记录的错误修复代码。

代码错误主要有三种类型：

- 编译时段错误：在代码编译时报错，文件无法正常载入内存
- 运行时段错误：代码编译正常，可以正常载入内存，但运行时会报错
- 代码逻辑错误：代码编译和运行时都不报错，但是结果不符合预期

我们分别对这三种错误做示例说明。

### 编译时段错误

编译时段错误包括**错误**和**警告**。错误是致命的，都是代码语法问题，如语句结束缺少分号，必须修复，否则无法编译运行；警告一般不影响结果，基本是语法规范问题，如定义了变量但没有使用。

所有编译时段错误都会在`log_error`和`error_handler`中记录日志，当出现编译错误时，打开日志查看错误，以下是常见错误示例：

…………

### 运行时段错误

未完成

### 代码逻辑错误

未完成

