# 1.2LPMUD游戏驱动说明


# 1.2 LPMUD游戏驱动说明

## 1.2.1 游戏驱动

C语言是编译型编程语言，源程序需要编译后运行，而LPC语言是解释型编译语言，源程序需要通过解释器运行，这个解释器就是游戏引擎，习惯称之为游戏驱动(driver)，早期的驱动是 mudos，但是作者早已停止维护，现在由叶雨飞大神在 mudos 最后版本上继续维护，并取名为 [fluffos](https://github.com/fluffos/fluffos) 持续更新，官方网址为：https://www.fluffos.info/ 。

本书开发MUD也以 fluffos 为游戏驱动，使用版本为 v2019。因为本书重点是LPC教程，对驱动的编译不是重心，具体编译流程请看官网文档：https://www.fluffos.info/build.html 或参考：[fluffos v2017及v2019在windows和ubuntu系统下的编译说明](https://bbs.mud.ren/threads/2)

对新入门的同学，推荐先从 windows 系统下开始，直接下载编译好的驱动，下载地址：[fluffos v2019 正式版](https://bbs.mud.ren/threads/4) 。



## 1.2.2 运行时配置文件

不同项目的目录结构不同、项目入口不同、服务端口不同、环境参数不同，这些通过配置文件配置。

游戏驱动配合配置文件运行，这个配置文件指定游戏驱动运行时的一些必须参数，在下载的 lpmud-driver 中的 config.test。我们使用记事本或 notepad++ 等编辑器打开文件config.test，会看到类似以下内容：

```ini
# name of this mud
name : Testsuite

# port number to accept users on
port number : 4000
external_port_2: websocket 4001

websocket http dir : ./www

# Restrict IP binding, if omitted, bind to all addresses.
mud ip : 0.0.0.0

# absolute pathname of mudlib
mudlib directory : ./testsuite

# debug.log and author/domain stats are stored here
log directory : /log

# the directories which are searched by #include <...>
# for multiple dirs, separate each path with a ':'
include directories : /include

# the file which defines the master object
master file : /single/master

# the file where all global simulated efuns are defined.
simulated efun file : /single/simul_efun

# alternate debug.log file name (assumed to be in specified 'log directory')
debug log file : debug.log

# This is an include file which is automatically #include'd in all objects
global include file : <globals.h>

.
.
.
```

配置文件中指定了 mud 的名字(name)、连接端口(port number)、mudlib的路径(mudlib directory)、主控文件的路径(master file)、模拟外部函数文件的路径(simulated efun file)等。

配置好正确的路径后，使用以下指令启动游戏驱动：

```
driver config.test
```

如果是windows系统下，推荐建立一个批处理文件放在LIB目录中，如 `driver.bat` 或 `driver.cmd`，内容如下：

```batch
:start
REM bin\driver.exe 可以换成你的驱动的绝对路径
bin\driver.exe config.ini
goto start
```

注意：运行时配置文件的扩展名并没有严格要求，一般使用 `.cfg` 或 `.ini`，如 mudos.cfg 、 config.ini等，而且配置文件一般由MUDLIB配套提供。

