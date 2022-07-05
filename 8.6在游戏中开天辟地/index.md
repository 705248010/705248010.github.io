# 8.6在游戏中开天辟地


# 8.6 在游戏中开天辟地

在正常的 MUD 游戏中，我们进入游戏会看到很多信息，而且还可以移动。那么MUD游戏开发者是如何把这个世界呈现在玩家眼前的呢？我相信，在看本教程的网友，在连接教程配套的MUD后，都有输入一个指令 `l`，想看看自己在哪儿，也想走两步，可惜让你失望了。教程的MUDLIB除了测试指令，除了有 `say` 和 `shout` 让玩家能说话，即不能走，也不能看，根本没有游戏的基本体验。

一个游戏世界的玩家最基本的需求是什么？能说、能看、能动。能说话的功能已经实现了，现在就是要能看和能动了。怎么才能动？就是使用 `move_object` 外部函数实现。怎么才能看？我们可以实现一个指令，通过这个指令把需要展示给玩家的信息按格式显示给玩家。

下面，我们来实现这些基本的功能，让玩家输入指令 `look` 可以看到以下信息：

```
客店
    这是一家价钱低廉的客栈，生意却是非常兴隆。外地游客
多选择这里落脚，你可以在这里打听到各地的风土人情。店小
二里里外外忙得团团转，接待着南腔北调的客人。
    这里明显的出口是 south、west 和 up。
```

在 `/cmds/test/` 目录下新建一个文件 `kedian.c`（注意：`kedian.c`文件并不是一个指令，创建在哪儿都行，比如自己建 `/d/city/` 目录，只是为让教程的示例代码文件不乱，才继续放在 `/cmds/test/` 目录中），代码如下：

```c
// kedian.c
inherit DBASE;

void create()
{
    set("short", "客店");
    set("long", @LONG
    这是一家价钱低廉的客栈，生意却是非常兴隆。外地游客
多选择这里落脚，你可以在这里打听到各地的风土人情。店小
二里里外外忙得团团转，接待着南腔北调的客人。
LONG );
    set("exits", ([
        "west":__DIR__ "beidajie1",
        "up":__DIR__ "kedian2",
        "south":__DIR__ "liaotian",
    ]));
}
```

在游戏开发中，要会对标准对象规范一个标准的参数模板，我们规定用 `short` 、`long`、`exits` 来描述房间的短名称、长描述和出口。在以上代码中，按规范实现了相关功能。现在我们再实现一个 `look` 指令读取规范的参数值，在本教程最新的代码中已实现了，文件为 `/cmds/look.c`，具体代码如下：

```c
// look 指令
#include <ansi.h>

int main(object me, string arg)
{
    object env = environment(me);
    string desc, *dirs;
    mapping exits;

    if (arg)
        return notify_fail("暂时不支持查看指定的对象\n");

    if (objectp(env))
    {
        if (desc = env->query("short"))
        {
            desc = sprintf(HIC "%s\n" NOR "%s", desc, env->query("long"));

            if (mapp(exits = env->query("exits")))
            {
                dirs = keys(exits);

                if (sizeof(dirs) == 0)
                    desc += "    这里没有任何明显的出路。\n";
                else if (sizeof(dirs) == 1)
                    desc += "    这里唯一的出口是 " + BOLD + dirs[0] + NOR + "。\n";
                else
                    desc += sprintf("    这里明显的出口是 " + BOLD + "%s" + NOR + " 和 " + BOLD + "%s" + NOR + "。\n", implode(dirs[0..sizeof(dirs)-2], "、"), dirs[sizeof(dirs) - 1]);
            }
            write(desc);
        }
        else
        {
            debug("这里一片虚无，什么也没有。");
        }
    }
    else
    {
        debug("你现在不在任何环境中。");
    }

    return 1;
}
```

现在，我们移动到这个房间中，这里使用教程提供的测试移动指令 `move_object /cmds/test/kedian`，然后输入指令 `look` 看看。是不是很激动，感觉自己看到了光明？

实现了看的功能，现在再实现走的功能，毕竟普通玩家直接使用 `move_object` 也太不安全了，真的可以为所欲为，我们需要限制玩家只能从开发者提供的出口移动。比如，以上代码中规定了房间有三个出口：`west`、`up` 和 `south`，我们需要玩家直接输入 `west`、`up` 和 `south` 移动。

在本章第二节玩家指令系统中我们讲了指令的实现，而要实现需要的移动功能，我们需要对 `command_hook` 方法做一个改造。为了不动现有教程 MUDLIB 的基础代码，我们自己重新写一个用户对象，然后使用 `exec()` 外部函数把当前玩家改到新的用户对象上。

新建一个文件 `/cmds/test/user.c`，具体代码如下：

```c
// 自定义 user 对象
#define CMD_PATH "/cmds/"
#define TEST_PATH "/cmds/test/"
#define GO_CMD "/cmds/go"

varargs void create(string arg)
{
    if (clonep())
    {
        enable_commands();
        add_action("command_hook", "", 1);
        seteuid(arg);
        set_living_name(arg);
        move_object(__DIR__ "kedian");
    }
}

int main(object me, string arg)
{
    object user;
    string file;

    if (base_name(me) == (file = file_name()))
    {
        debug("请不要重复操作。");
    }
    else
    {
        user = new(file, geteuid(me));
        exec(user, me);
        destruct(me);
    }

    return 1;
}

nomask int command_hook(string arg)
{
    string verb, cmd, test;
    object me, cmd_ob;

    verb = query_verb();
    cmd = CMD_PATH + verb;
    test = TEST_PATH + verb;
    me = this_object();

    if ((verb = trim(verb)) == "")
        return 0;

    if (!arg && (objectp(environment()) && stringp(environment()->query("exits/" + verb))))
    {
        call_other(GO_CMD, "main", me, verb);
    }
    else if (cmd_ob = load_object(cmd) || cmd_ob = load_object(test))
    {
        call_other(cmd_ob, "main", me, arg);
    }
    else
    {
        return notify_fail("指令不存在 ^_^\n");
    }

    return 1;
}

int move(mixed dest)
{
    move_object(dest);
    command("look");

    return 1;
}

int move_or_destruct(object dest)
{
    debug("突然一阵时空扭曲，你被传送到虚空。");
    move(VOID_OB);

    return 1;
}
```

代码中我们重写了 `command_hook()` 方法，不再是简单的执行指令文件，而是优先判断玩家输入的是否是出口，如果是，会调用指令 `/cmds/go` 实现玩家的移动，否则再查找指令文件是否存在并调用。

游戏中玩家移动到新的环境会自动显示环境的描述，其实现方式就是先 `move_object` 移动玩家，然后让玩家自动执行 `look` 指令，为了方便，我们直接在玩家对象中实现一个 `move()` 方法来实现移动和查看的功能。

在这个对象中，我们还实现了 `move_or_destruct()` 方法，这是一个 apply 方法，作用是如果玩家所在环境对象被摧毁（比如更新环境就会先摧毁对象）移动玩家到 VOID_OB 中，如果玩家对象中没有这个方法，更新玩家所在环境时也会摧毁玩家对象。在默认的玩家对象中就没有实现这个功能，大家可以先把默认登录时控制的玩家对象移动到某个对象中，然后更新(`update here`)或使用 `destruct` 指令摧毁这个对象看看结果。

因为这个新的 `user` 直接在 `/cmds/test/` 目录下，也可以当指令使用，为了方便切换玩家到这个新实现的玩家对象，我们直接在这个对象中实现了 `main()` 方法来切换并自动移动玩家对象到环境 `kedian` 中，需要切换时直接执行 `user` 这个指令就搞定需求。因为切换对象后旧的对象就不再需要了，开发时需要主动销毁无用对象节省内存，而不是让这些对象继续留在游戏中，在这里使用 `destruct(me)` 清理对象，在以后的章节中会介绍其它内存清理方法，我们先养成这个意识。请注意：教程只是为来方便测试才这样做的，这不是规范动作，正式游戏开发一定要遵循功能单一原则，不能把一个对象即做指令文件又做玩家对象的。

我们再实现指令 `go` ，作用就是根据玩家输入的方向移动，新建文件 `/cmds/go.c`（本教程最新的代码中已经实现了这个功能），具体代码如下：

```c
// go.c
int main(object me, string arg)
{
    object env, dest;
    mapping exits;
    string exit;

    if (!arg)
    {
        debug("你要往哪个方向走？");
    }
    else if (objectp(me))
    {
        env = environment(me);
        if (!env)
        {
            debug("你哪里也去不了。\n");
        }
        else if (!mapp(exits = env->query("exits")) || undefinedp(exit = exits[arg]))
        {
            if (query_verb() == "go")
                debug("这个方向没有出路。");
        }
        else if (!objectp(dest = load_object(exit)))
        {
            debug(sprintf("目标区域无法加载，无法向 %s 移动。", exit));
        }
        else
        {
            me->move(dest);
        }
    }

    return 1;
}
```

现在，我们先执行指令 `user` 切换玩家到功能强大的新玩家对象上，再输入 `look` 看看，测试输入一下 `up`、`south` 等方向看看效果。

因为对应方向的环境对象都不存在，所以无法移动，我们再新建一个文件 `/cmds/test/kedian2.c`，代码如下：

```c
// kedian2.c
inherit DBASE;

void create()
{
    set("short", "客店二楼");
    set("long", @LONG
    这里是客店二楼的走廊，不时有风尘仆仆的旅客进进出出，
如果需要开房请到楼下的掌柜处付钱。
LONG);
    set("exits", ([
        "down":__DIR__ "kedian",
    ]));
}
```

现在再输入指令 `up` 试试，有没有感觉良好？能说能看又能移动了,总算有点游戏的感觉了吧。

MUD游戏世界的创造基本就是基于以上的核心指令实现的功能，房屋之间做好连接就能让玩家根据路径移动了。有了这些基本功能，你就可以在游戏中开天辟地，是不是很简单？正式的游戏中 `look` 和 `go` 指令有更多完善的功能，比如查看玩家、物品、装备、移动描述和限制等等，有兴趣的可以参考游戏代码学习。

提示：如果你不想自己在 `/cmds/test/` 目录下新建实操，可以输入 `tutorial user` 直接体验。

