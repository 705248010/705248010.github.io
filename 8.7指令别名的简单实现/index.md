# 8.7指令别名的简单实现


# 8.7 指令别名的简单实现

在上一节中我们实现了玩家移动了观看这个世界，但是，移动必须输入完整的方向，如 `west`、`up`，观看也必须使用完整的 `look` 指令，这在用户体验上很不好，在MUD游戏中，一般会用 `l` 代表 `look`，用 `w`、`u`等首字母代替 `west`、`up`等方向。怎么实现这个功能呢？

在这里，我们利用一个 apply 方法 `process_input()` 实现，这个方法的语法说明如下：

> 名称

```
process_input - 获取(并可以修改)用户的输入指令
```

> 语法

```
mixed process_input( string arg );
```

> 描述

**如果玩家对象中存在 process_input() 方法，驱动程序会把玩家输入的每一行内容发送给此方法。 如果 process_input() 方法返回字符串，此字符串会取代玩家的输入；如果返回 0 则保持玩家输入的内容不变；如果返回 1 则完全过滤掉此输入内容，不再做任何处理。**

严格的说`process_input()`才是所有指令的入口，玩家输入的所有指令必定会传给这个方法。所以开发中只要利用 process_input() 方法可以很容易的实现指令历史记录等功能，也可以用来限制管理指令的使用，还可以在指令解析前修改玩家的输入，实现游戏别名的功能。

我们在玩家对象中实现简化移动和查看的别名功能，不过为了不改变现有教程的代码，我们还是新建一个玩家对象来实现需求，在 `/cmds/test/` 目录下新建玩家对象文件 `user2.c`，具体代码如下：

```c
// user2.c
inherit __DIR__ "user";

nosave mapping alias = ([
        "s":"go south",
        "n":"go north",
        "w":"go west",
        "e":"go east",
       "sd":"go southdown",
       "nd":"go northdown",
       "wd":"go westdown",
       "ed":"go eastdown",
       "su":"go southup",
       "nu":"go northup",
       "wu":"go westup",
       "eu":"go eastup",
       "sw":"go southwest",
       "se":"go southeast",
       "nw":"go northwest",
       "ne":"go northeast",
        "d":"go down",
     "down":"go down",
        "u":"go up",
       "up":"go up",
      "out":"go out",
    "enter":"go enter",
     "chat":"shout",
      "who":"users",
        "i":"all_inventory",
        "l":"look",
]);

mixed process_input(string arg)
{
    arg = lower_case(arg);

    if (sscanf(arg, "l %s", arg))
    {
        arg = "look " + arg;
    }
    else if (sscanf(arg, "chat %s", arg))
    {
        arg = "shout " + arg;
    }
    else if (!undefinedp(alias[arg]))
    {
        arg = alias[arg];
    }

    return arg;
}
```

新的 `user2` 对象继承了上一章节实现的 `user` 对象，并新增了 `process_input` 方法。

现在使用 `user2` 指令切换你的玩家对象到 `user2` 上，然后输入 `l`、`u` 总算可以更方便的观看和移动了，是不是找到熟悉的感觉了？代码还实现了别名 `chat` 用大家更习惯的指令聊天，其它别名可以直接看代码。提示：也可直接输入 `tutorial user2` 使用教程中提供的演示代码直接测试。

别名的实现还有其它方式，大家有兴趣可以看看主流MUD游戏的源码学习。

