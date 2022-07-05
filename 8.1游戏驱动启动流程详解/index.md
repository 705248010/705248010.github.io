# 8.1游戏驱动启动流程详解


# 8.1 游戏驱动启动流程详解

在学习所有LPC语言的基础知识后，得学以致用准备MUD游戏开发，不过，在MUD游戏开发前，先了解以下游戏驱动启动的流程，才能真正的从零开始开发MUD游戏。

## driver运行机制

MUDLIB必须通过驱动程序运行，驱动在运行过程中做哪些事情呢？

1. 通过通信端口接受来自远程机器的连接（调用MASTER_OB中的connect方法），并将这些连接附加到登录对象(调用connect方法返回的对象中的logon方法)
2. 提供一组外部函数（efun），这些函数可以从LPC对象中调用。
3. 通过new(filename)（或clone_object(filename)）efun将文件编译成紧凑的内部标记形式。
4. 解释（执行）已编译的对象。代码执行的两种主要方式如下：
   1. 驱动程序根据从用户接收的输入（通过通信端口）调用对象中的函数（具体函数通过`add_action()`方法指定），另外也会在特定时机自动调用驱动提供的apply方法（如create、clean_up、init等）
   2. 游戏对象使用`call_other()`外部函数调用其它对象中的方法，`call_other()`外部函数还有一种变体就是大家熟悉的 `object->function(args)`



## 运行时配置文件

MUD游戏服务端包括三部分：驱动程序、运行时配置文件、MUDLIB。运行时配置文件名称一般为 `config.cfg`、`config.ini`或`mudos.cfg`。

在运行时配置文件指定了MUD的名称、游戏端口、MUDLIB目录位置、驱动程序/运行时配置文件目录位置、日志文件目录位置、头文件目录位置、主控文件位置、模拟外部函数文件位置、驱动日志文件名、全局包含头文件名称等等重要信息，也包含驱动程序运行时的重要参数，如:clean up 时间间隔、reset 时间间隔、单位心跳时间、数组最大长度、映射最大长度等等，具体可以直接查看运行时配置文件说明。

对多数配置使用默认值即可，主要有以下几项需要根据 MUDLIB 针对性设置：

```ini
# absolute pathname of mudlib
mudlib directory : .

# absolute pathname of driver/config dir
binary directory : .

# debug.log and author/domain stats are stored here
log directory : /log

# the directories which are searched by #include <...>
# for multiple dirs, separate each path with a ':'
include directories : /include

# the file which defines the master object
master file : /system/kernel/master

# the file where all global simulated efuns are defined.
simulated efun file : /system/kernel/simul_efun
```

配置文件中 `#` 开始的行为注释，以上配置中MUDLIB和驱动程序对路径为为当前目录，主控文件为 `/system/kernel/master`,模拟外部函数文件为 `/system/kernel/simul_efun`，日志目录为 `/log`，头文件目录为 `/include`。

以下是炎黄MUD的运行时配置文件：

```ini
# FluffOS v2019 运行时配置
name : 炎黃群俠傳

external_port_1 : telnet 5555
external_port_2 : telnet 6666
external_port_3 : websocket 8000
; external_port_3_tls : cert=cert.crt key=cert.key

mudlib directory : .
websocket http dir : www

log directory : /log
include directories : /include

master file : /adm/single/master
simulated efun file : /adm/single/simul_efun
debug log file : debug.log

global include file : <globals.h>

default fail message : 指令错误，如需帮助可输入：help cmds
default error message : [1;33m你发现事情不大对了，但是又说不上来。[2;37;0m
```

以下参数都有默认值，且不同版本驱动默认值有差别，如果你没有特殊的需求，可以不用配置，列表中显示的是2021年7月版本的默认设置：

```ini
#==== Runtime Config Table ====
time to clean up : 600 # default: 600
time to reset : 900 # default: 900
time to swap : 300 # default: 300
evaluator stack size : 65536 # default: 65536
inherit chain size : 30 # default: 30
maximum evaluation cost : 30000000 # default: 30000000
maximum local variables : 48 # default: 64 # 修改无效
maximum call depth : 150 # default: 150
maximum array size : 30000 # default: 15000
maximum buffer size : 1048576 # default: 1048576
maximum mapping size : 150000 # default: 150000
maximum string length : 1048576 # default: 1048576
maximum bits in a bitfield : 12000 # default: 12000
maximum byte transfer : 262144 # default: 262144
maximum read file size : 262144 # default: 262144
hash table size : 65536 # default: 65536
object table size : 4096 # default: 4096
living hash table size : 2048 # default: 256
gametick msec : 1000 # default: 1000
heartbeat interval msec : 1000 # default: 1000
sane explode string : 1 # default: 1
reversible explode string : 0 # default: 0
sane sorting : 1 # default: 1
warn tab : 0 # default: 0
wombles : 0 # default: 0
call other type check : 0 # default: 0
call other warn : 0 # default: 0
mudlib error handler : 1 # default: 1
no resets : 0 # default: 0
lazy resets : 0 # default: 0
randomized resets : 1 # default: 1
no ansi : 1 # default: 1
strip before process input : 1 # default: 1
this_player in call_out : 1 # default: 1
trace : 1 # default: 1
trace code : 0 # default: 0
interactive catch tell : 0 # default: 0
receive snoop : 1 # default: 1
snoop shadowed : 0 # default: 0
reverse defer : 0 # default: 0
has console : 1 # default: 1
noninteractive stderr write : 0 # default: 0
trap crashes : 1 # default: 1
old type behavior : 0 # default: 0
old range behavior : 0 # default: 0
warn old range behavior : 1 # default: 1
suppress argument warnings : 0 # default: 1
enable_commands call init : 1 # default: 1
sprintf add_justified ignore ANSI colors : 1 # default: 1
call_out(0) nest level : 1000 # default: 1000
trace lpc execution context : 0 # default: 0
trace lpc instructions : 0 # default: 0
enable mxp : 0 # default: 0
enable gmcp : 0 # default: 0
enable zmp : 0 # default: 0
enable mssp : 1 # default: 1
#==============================
```



## 驱动启动指令

驱动程序文件名在 linux 系统下一般为 `driver`，在 windows 系统下一般为 `driver.exe`。如果驱动程序和运行时配置文件 `config.cfg` 在相同目录下，驱动启动的指令为：

```
driver config.cfg
```

为了保证通过指令在线关闭驱动时自动重启，推荐做如下设置；

如果是 windows 系统，新建批处理文件 `runmud.bat`，内容如下：

```batch
:start
driver.exe config.cfg
goto start
:end
```

运行 `runmud.bat` 启动游戏会保证MUD关闭后自动重启。如果你对windows批处理语法不熟悉，可以参考这里学习：https://www.cnblogs.com/baiqiantao/p/12122023.html

如果是 linux 系统，新建文件 `runmud` 并设置权限为可执行，内容如下：

```shell
#!/bin/bash

if [ $1 ]
then
    export DRIVER=$1
else
    export DRIVER="driver"
fi

if [ $2 ]
then
    export CFG="mudos."$2".cfg"
else
    export CFG="config.cfg"
fi

echo "driver: "$DRIVER
echo "cfg: "$CFG

# 指定 MUDLIB 路径
MUDHOME=""

while [ true ]; do

    if [ $MUDHOME ] && [ -f $MUDHOME/bin/$DRIVER ]  && [ -f $MUDHOME/bin/$CFG ]
        then
            $MUDHOME/bin/$DRIVER $MUDHOME/bin/$CFG
        else
        if [ -f ./$DRIVER ]  && [ -f ./$CFG ]
            then
                ./$DRIVER ./$CFG
            else
                break
        fi
    fi

done
```

除了 `driver config_file` 这中默认启动指令，驱动启动时还可以指定参数 `-d` 和 `-f`，第一个参数开启默认调试模式，第二个参数可以指定一个值，如 `driver config.cfg -fvalue` 会把值 `value` 做为参数传递给主控文件中的 apply 方法 `flag()`，使用这个功能可以自己定义驱动启动模式和功能。在本教程的 mudlib 中可以指定值 `debug` 开启调试模式。



## 驱动启动流程

LPMUD 启动时驱动程序会按以下顺序载入文件：第一步，载入模拟外部函数文件，第二步，载入主控对象文件。注意：所有文件都会自动包含运行时配置文件指定的全局头文件 `globals.h`。

另外，主控对象中必须实现以下 apply 方法：`get_root_uid()`、`author_file()`、`get_bb_uid()`、`domain_file()`、`creator_file()`，这些方法的具体语法请看文档：https://wiki.mud.ren/index.php?title=Lpc:Apply

在模拟外部函数文件和主控文件载入成功后，驱动进入等待玩家连线状态，当有玩家连线时会自动调用主控对象中的 `connect()` 方法处理玩家连线。`connect()` 方法返回连线对象，并自动调用玩家对象的 `logon()` 方法。

所有对象加载时都会调用主控对象的以下 apply 方法：`domain_file()`、`author_file()`、`creator_file()`。



## 核心 apply 方法

除了以上必须的 apply 方法，还有以下 apply 方法会在特定时间调用：

1. `create()` 方法，如果对象中存在这个方法，在对象载入时会自动调用 `create()` 方法完成对象初始化。
2. `clean_up()` 方法，如果对象存在这个方法，会定期呼叫。
3. `reset()` 方法，如果对象中存在这个方法，会定期呼叫。
4. `heart_beat()` 方法，如果对象中存在这个方法且对象有心跳，会在每次心跳时呼叫。
5. `move_or_destruct()` 方法，如果对象中存在这个方法，当对象所在环境被摧毁时会呼叫。
6. `init()` 方法，如果对象中存在这个方法，当有对象移动（move_object()）时会呼叫。
7. `net_dead()` 方法，如果玩家对象中存在这个方法，会在玩家断线时呼叫。
8. `process_input()` 方法，如果玩家对象中存在这个方法，所有玩家命令都会传给此方法。
9. `valid_bind()`、`valid_database()`、`valid_hide()`、`valid_link()`、`valid_object()`、`valid_override()`、`valid_read()`、`valid_seteuid()`、`valid_shadow()`、`valid_socket()`、`valid_write()` valid 系列方法，这些方法都定义在主控对象中，其中 `valid_read()`、`valid_write()` 和 `valid_object()` 方法是读写文件和载入对象时自动调用，但不是必须实现的，如果主控对象中不存在这几个方法，默认相应功能全部允许执行，而其它 valid 方法必须在主控对象中实现，否则对应的外部函数功能无法正常使用。

还有 `compile_object`、`crash`、`epilog`、`error_handler`、`get_include_path`、`log_error`、`object_name`、`preload` 等更多 apply 方法请看文档：https://wiki.mud.ren/index.php?title=Lpc:Apply

