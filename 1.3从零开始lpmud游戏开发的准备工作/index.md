# 1.3从零开始LPMUD游戏开发的准备工作


# 1.3 从零开始 LPMUD 游戏开发的准备工作

我们学C语言时已经熟悉C语言程序的编译运行流程，如下面的代码：

```c
#include <stdio.h>
int main()
{
    puts("www.mud.ren");
    return 0;
}
```

我们需要先编译生成可执行程序，然后运行这个程序，程序自动从int main(void)函数开始执行。

前面也介绍了LPMUD通过MUD游戏引擎驱动，但我们写的代码怎么运行呢？因为是入门教程，这里不做过多分析，只是先简单的描述游戏启动顺序：游戏引擎运行后，首先载入运行时配置文件中指定的 `simul_efun` 文件，然后载入运行时配置文件中指定的 `master` 文件完成启动并等待玩家连线。如果有玩家连线，驱动自动调用 `master` 文件中的 `object connect(int port)` 方法处理连接，此方法会返回连线对象，并自动调用对象中的 `object logon(void)` 方法处理登录。注意，在 lpmud 中所有对象都会自动包含一个头文件 `globals.h` （运行时配置文件中指定位置和文件名)。和C语言不同的是，lpc 程序没有结束，只要启动后不销毁会一直在内存中保持运行，而且也没有 int main() 入口函数，不过有一个类似的 `void create(void)` 方法，在游戏文件加载时自动调用此方法。

在LPC语言中，没有编译并生成可执行程序的过程，所有 .c 源程序都可以随时加载并生效。



## 1.3.1 服务端配置

关于启动流程的问题，这里不理解也没有关系，我们先从基础语法开始学习，因为LPC代码不能单独运行，只能在项目中执行，为了方便学习LPC语言，这里提供一个基础的 mudlib，可以正常的使用游戏引擎驱动。

下载地址：https://github.com/mudren/lpc-test/archive/master.zip

从下一章开始，我们就在此 mudlib 中学习LPC语言。这个项目目录的文件并不多，主要结构如下：

```
.
├── area                    游戏环境区域所在目录
│   ├── tower.c             勇者之塔
│   └── virtual.c           虚拟环境控制文件
├── cmds                    游戏指令（包括教程演示代码）所在目录
│   ├── demo                教程示例代码所在目录
│   │   └── ...
│   ├── test                个人学习代码存放目录
│   │   ├── test.c
│   │   └── ...
│   ├── update.c
│   └── ...
├── config.ini              *运行时配置文件*
├── data                    存档文件保存目录
│   └── ...
├── include                 头文件所在目录
│   ├── ansi.h              *颜色控制头文件*
│   └── globals.h           *全局默认包含头文件*
├── inherit                 继承功能文件目录
│   ├── clean_up.c          内存清理接口
│   └── dbase.c             数据存取接口
├── log                     日志记录目录
│   ├── author_stats        author 统计
│   ├── debug.log           驱动日志
│   ├── domain_stats        domain 统计
│   ├── error_handler       编译错误日志
│   └── log_error           代码错误及警告日志
├── README                  说明文件
├── system                  系统文件目录
│   ├── kernel              核心文件目录
│   │   ├── master.c        *主控对象*
│   │   └── simul_efun.c    *模拟外部函数*
│   └── object              核对对象目录
│       ├── login.c         *连线对象*
│       ├── user.c          *玩家对象*
│       └── void.c          *默认环境对象*
└── tree.txt                当前文档结构说明文件
```

> 提示：因为项目持续更新，目录结构可能稍有不同，具体可以看项目README.md。

先把下载的 mudlib 解压到D盘根目录（其它盘也可以），把目录改名为 `lpc-test`,同时把游戏驱动也解压到D盘根目录，把驱动目录改名为 `lpmud-driver`，在 `lpc-test` 目录中新建 `driver.cmd` 文件，使用记事本打开，输入以下内容并保存：

```
:start
D:\lpmud-driver\driver.exe config.ini
goto start
```

双击 `driver.cmd`，MUD服务器启动，如图1所示：

![driver启动界面](https://oiuv.oss-cn-beijing.aliyuncs.com/images/lpc_book/1.3.1.jpg)

> 如果启动失败，请确认你的驱动目录是否正确，没有驱动的在此下载[fluffos v2019 正式版](https://bbs.mud.ren/threads/4)。

请注意：早期开发的 MUDLIB 都是使用 GBK 编码，但FluffOS v2019开始只支持 utf-8 编码，本教程代码统一为 utf-8 编码。



## 1.3.2 客户端连接

服务启动后，使用MUD游戏客户端连接 127.0.0.1:4000 或网页访问 http://127.0.0.1:4001/ 可以成功连接游戏。测试 mud 支持 help、update 等指令，对应的文件在 `lpc-test` 的 `cmds` 目录中，输入`help`可以查看帮助。

在 `cmds` 目录下我们还有 `demo` 和 `test` 二个目录，其中 `demo` 目录是后续教程中对应的代码示例，可以直接在游戏中输入 `示例名` 测试对应的示例，如输入`2.1.1`；而 `test` 目录是给大家学习用的目录，在这个目录中新建的文件都可以直接输入文件名运行，其中有一个默认的测试文件 `test.c`，我们打开 `test.c`,可以看到以下代码：

```c
int main(object me, string arg)
{
    // 请在此实现你的代码

    return 1;
}
```

从下章开始，我们一直保持游戏驱动运行，并使用客户端连接。学习过程中我们以 `test.c` 文件为模板测试我们的代码，把自己的学习代码文件存放在 `cmds/test/` 目录中，然后在客户端直接输入文件名可执行。

注意这里的 `int main(object me, string arg)` 是我们自定义的函数，作为指令执行的入口，和C语言中的 `int main(void)` 函数没有任何关系，返回值是 1 ，而不是C语言中的 0，这里先不解释，通过后续章节的学习你会理解为什么是这样。

> 提示：除了把代码写在`/cmds/test/`目录中外，还可以使用`eval`指令执行代码片段，方便简易测试，如：`eval return this_player();`，不过`eval`指令需要先输入指令`wizard`进入wizard角色才能使用。

在开发测试中，我们推荐直接网页访问 http://127.0.0.1:4001/ 打开游戏，如果要客户端，推荐使用 [tintin++](https://tintin.sourceforge.io/) 客户端，小巧方便,下载地址：https://tintin.sourceforge.io/download.php

> 在线测试地址：https://test.mud.ren/



## 1.3.3 开发工具的准备

在开发工具上，只推荐一个：Visual Studio Code，简称VS code，官方网站：https://code.visualstudio.com/ 。

为了方便 LPC 开发，需要在项目配置文件 `.vscode\c_cpp_properties.json` 中指定 include 位置并自动包含 globals.h。具体配置如下：

```json
{
    "configurations": [
        {
            "name": "LPC",
            "includePath": [
                "${workspaceFolder}/include/"
            ],
            "forcedInclude": [
                "${workspaceFolder}/include/globals.h"
            ],
            "defines": [
                "FLUFFOS",
                "MUDOS"
            ],
            "cStandard": "c89",
            "cppStandard": "c++11",
            "intelliSenseMode": "${default}"
        }
    ],
    "version": 4
}
```

另外，因为LPC代码使用的 .c 扩展名，但并不完全是C语言的语法，所以会提示各种错误，我们需要**禁用错误下划线**,需要在项目配置文件 `.vscode\settings.json` 中做类似以下配置：

```json
{
    "C_Cpp.errorSquiggles": "Disabled",
    "editor.formatOnType": true,
    "files.autoGuessEncoding": true,
    "files.insertFinalNewline": true,
    "files.trimFinalNewlines": true,
    "files.trimTrailingWhitespace": true,
    "editor.renderWhitespace": "all"
}
```

具体操作：

1. 请用 VS CODE 打开你的MUDLIB后，打开命令面板（在 windows 系统下，按 `ctrl+shift+p`）
2. 选择 `C/C++:编辑配置(JSON)` 打开 `c_cpp_properties.json` 编辑
3. 选择 `C/C++:禁用错误下划线` 关闭错误提示。

配置后基本能实现LPC开发的友好提示和格式化，只是对函数指针、格式定界符（[@XXX](https://bbs.mud.ren/XXX) ...XXX）的支持不够，需要手动微调。

在本教程提供的最新代码中已做好配置，大家无需再做任何设置即可直接生效。

