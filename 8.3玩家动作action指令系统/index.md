# 8.3玩家动作（action）指令系统


# 8.3 玩家动作(action)指令系统

玩家连接游戏后输入的所有内容除了被 `input_to` 和 `get_char` 捕获的外，都会被当成指令处理。

## 指令系统实现方式

指令功能的实现有二种方式：一种以`add_action`为核心的动作(action)指令系统，一种以`parse_sentence`为核心的谓词(verb)指令系统。动作指令实现起来比较简单，容易理解，国内ＭＵＤ基本只有动作指令系统，谓词指令系统实现起来相对麻烦，但功能强大，可以实现简单的自然语言的语义理解，国外ＭＵＤ用的比较多。本人推荐的方式是二种方式结合使用，`look`、`fight`等游戏互动性的指令用谓词指令系统实现，`update`、`who`等管理性的指令使用动作指令系统实现。

这里先讲解action指令系统的实现，verb指令系统后续教程中讲解。



## action指令系统

动作指令系统相关外部函数为 `enable_commands`、`disable_commands`、`add_action`、`remove_action`、`query_verb`、`command`、`commands`、`process_input`，另外还有一个 apply 方法 `init`。

在本教程中为了方便测试实现了enable_commands 和 disable_commands 二个指令，我们先做一个测试：使用 disable_commands 关闭自己的指令功能，我们先看看自己的玩家对象是什么，可以使用 `users` 测试指令查看在线玩家列表，也可以直接使用 `find_player` 测试指令直接查找，假如玩家登录是输入的ID是 `mud`， `find_player mud` 返回的对象是 `/system/object/user#1` ，输入 `disable_commands /system/object/user#1` 后，玩家输入任何指令都不再有效了，只会返回 `什么？`(这是在运行时配置文件中设置的 `default fail message`)。

在前面第五章第六节已经讲过 `enable_commands` 的对象有活着的特性，在游戏中是一个生物，相应的没有 `enable_commands` 或使用 `disable_commands` 后，就变成了非生物对象，不可以使用任何命令，`add_action` 和 `command` 等外部函数失效。

在本教程的 mudlib 中，玩家对象是 `/system/object/user`，我们看看代码：

```c
#define CMD_PATH "/cmds/"
#define TEST_PATH "/cmds/test/"

int command_hook(string arg);

varargs void create(string arg)
{
    if (clonep())
    {
        enable_commands();
        add_action("command_hook", "", 1);
        seteuid(arg);
        set_living_name(arg);
        move_object(VOID_OB);
    }
}

int command_hook(string arg)
{
    string cmd, test;
    object cmd_ob;

    cmd = CMD_PATH + query_verb();
    test = TEST_PATH + query_verb();

    if (cmd_ob = load_object(cmd) || cmd_ob = load_object(test))
    {
        return (int)cmd_ob->main(this_object(), arg);
    }
    else
    {
        return notify_fail("指令不存在 T_T\n");
    }
}
```

从代码看，功能非常简单：

1. 使用 `enable_commands()` 让玩家对象成为生物(使 `add_action()` 外部函数生效，并能使用 `command()` 外部函数)
2. 使用 `add_action("command_hook", "", 1)` 获取玩家对象的输入并使用局部函数 `int command_hook(string arg)` 处理
3. 局部函数 `command_hook` 获取玩家输入后再 `/cmds/` 和 `/cmds/test/` 目录中查找这个文件，如果找到会执行文件的 `main(object ob, string arg)` 方法，如果没找到就返回提示 `指令不存在 T_T`
4. 使用 `seteuid(arg)` 设置玩家对象的有效用户ID为玩家输入的ID，方便在其它地方使用 `geteuid()` 外部函数获取玩家名，比如指令 `shout` 和 `say` 中
5. 使用 `set_living_name(arg)` 设置玩家的生物名称为玩家输入的ID，方便可以使用 `find_player()` 和 `find_living()` 外部函数查找玩家(教程提供了同名指令)
6. 使用 `move_object(VOID_OB)` 把玩家移动到对象 VOID_OB 中，让玩家有一个环境，可以使用 `environment()` 查看所在环境(教程提供了同名指令)

这里演示了最基础的指令系统，实际游戏中 `command_hook` 并不是这样简单，在游戏中我们有聊天表情、方向移动等功能，`command_hook` 会做判断后再决定怎么处理，可能类似如下：

```c
nomask int command_hook(string arg)
{
    string verb;
    object me, file;

    me = this_object();

    verb = query_verb();
    if ((verb = trim(verb)) == "")
        return 0;

    if (!arg && (objectp(environment()) && stringp(environment()->query("exits/" + verb))) &&
        objectp(file = find_command("go")) &&
        call_other(file, "main", me, verb))
        ;
    else if (objectp(file = find_command(query_verb())) && call_other(file, "main", me, arg))
        ;
    else if (EMOTE_D->do_emote(me, verb, arg))
        ;
    else if (CHANNEL_D->do_channel(me, verb, arg))
        ;
    else
        return 0;

    return 1;
}
```

这里需要重点说明的是 `add_action()` 外部函数的用法：

> 名称

```
add_action() - 绑定一个玩家指令到自定义函数
```

> 语法

```
void add_action( string | function fun, string | string * cmd);
void add_action( string | function fun, string | string * cmd, int flag );
```

> 描述

**当玩家键入的指令匹配 `cmd` 时，呼叫局部函数 `fun`，玩家指令的参数会做为字符串参数传给函数 `fun`，如果指令错误必须返回0，否则 `fun` 必须返回1。如果第二个参数 `cmd` 是一个数组，所有在数组中的指令都会呼叫函数 `fun`，你可以使用 query_verb() 外部函数找到呼叫函数的指令。如果指令错误，会继续查找其它命令，直到返回 1 或错误信息给玩家。**

通常 add_action() 只会从 init() apply 方法中调用，而且定义命令的对象必须是玩家可以接触到的，或者是玩家本身，或者被玩家携带，或者是玩家所在的房间，或者是玩家所在房间中的其它对象。如果不指定参数 `flag`，默认为0，代表输入指令必须完全匹配 `cmd` 才可生效，如果参数 `flag` 大于 0，只需玩家输入的指令前面部分匹配 `cmd` 即可生效。其中如果 `flag` 是 1 时 query_verb() 会返回输入的完整指令，如果参数 `flag` 是 2 时 query_verb() 会返回匹配部分以后的内容，而且这两种模式下获取的参数也不一样。

在我们以上代码中 `add_action("command_hook", "", 1)`，玩家指令 `cmd` 其实是空的，在指定 `flag` 为 1 的情况下，就可以获取玩家的任何输入。

指令调用的局部函数 `fun` 必须返回 1 代表成功，我们自己实现的 `command_hook` 中指定的 `fun` 是 `main(this_object(), arg)`，所以，现在明白我们学习中的指令代码为什么要在 `int main(object me, string arg){}` 中且返回值为 1 了吧？

通过以上方式的指令，都是有具体的文件，在游戏中任何时候都可以使用，而我们在游戏时有在特殊情况下才能执行的指令，比如：在有床的房间才能 `sleep`，这其实时把 `sleep` 指令定义在床这个对象中在，当玩家进入床所在环境时可以使用相关指令，这个功能是通过 apply 方法 `init` 实现的，其语法如下：

> 名称

```
init - move_object() 函数呼叫对象中的 init() 方法以初始化指令(verb)和动作(action)
```

> 语法

```
void init( void );
```

> 描述

```
当 MUDLIB 移动对象 `A` 进入对象 `B`时，游戏驱动的 move_object() 外部函数会做以下行为：

1. 如果 `A` 是生物(living)，让 `A` 呼叫 `B` 的 init() 方法。
2. 不管 `A` 是否是生物，让 `B` 中的所有生物呼叫 `A` 的 init() 方法。
3. 如果 `A 是生物，让 `A 呼叫 `B` 中所有对象的 init() 方法。

注意：如果一个对象呼叫过 enable_commands() 外部函数，就被认为是生物。

通常，对象中的 init() 方法用来呼叫 add_action()增加对象自身提供的指令(command)。
```

我们来做个实例演示一下相关功能。在 `/cmds/test/` 目录下新建一个文件 `test_room.c`，代码如下：

```c
// test_room
void init()
{
    add_action("act1", "test1");
    add_action("act2", "test2");
}

int act1(string arg)
{
    debug("[act1]你输入的指令是：" + query_verb());
    debug("[act1]指令的参数是：" + arg);
    return 1;
}

int act2(string arg)
{
    debug("[act2]你输入的指令是：" + query_verb());
    debug("[act2]指令的参数是：" + arg);
    remove_action("act1", "test1");
    return 1;
}
```

注意：`test_room.c`文件并不是一个指令，创建在哪儿都行，只是为让教程的示例代码文件不乱，才继续放在 `/cmds/test/` 目录中。我们先把自己移动到这个房间中去，在这里可以使用教程提供的 `move_object()` 外部函数同名指令 `move_object`，如果我们玩家对象是 `/system/object/user#1`，使用 `move_object /system/object/user#1 to /cmds/test/test_room` 后，会自动调用 test_room 中的 `init` 方法，这个方法的 `add_action()` 外部函数增加了二个指令 `test1` 和 `test2`。输入 `test1`、`test1 xxx`、`test2`等试试，注意，示例代码中如果执行了 `test2` 会自动移除了指令 `test1`。

除了触发所在环境的指令，玩家还会触发在自己身上或在相同环境中的对象的指令。你还可以自己测试建立一个提供指令的对象移动到玩家身上或所在环境中测试。

在开发中活用 `init` 、 `add_action` 和 `remove_action` 外部函数，可以实现精彩的游戏解迷，就看你脑洞有多大了。



## 序号的秘密：present

在游戏互动中我们肯定会遇到一种情况，房间有多个一样的对象，我们要查看时可以指定编号来查看指定的对象，如：look npc 3　查看第３个npc。这个功能是如何实现的？你的代码中应该没有相关处理吧？但为什么可以正常使用？

这是`present`外部函数的功能，我们在实现相关指令时肯定有类似这样的代码`ob = present(arg, env);`在环境env中查找名称为`arg`的对象，而`present`支持当有多个相同ID的对象时，可以字符串参数加数字序号查找，格式`id n`，如 `present("npc 1", environment(me));`，其中首个序号代表的是最后进入环境的对象，这也是为什么看起来我们在指令中没有写`l npc 3`的功能实现却能使用这个功能的原因。

