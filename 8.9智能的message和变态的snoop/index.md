# 8.9智能的message和变态的snoop


# 8.9 智能的 message 和变态的 snoop

## 智能的 message

在前面的基础教程中讲了游戏中的基本输出函数，能满足大多数需求，但是还有一个外部函数没有讲解，就是 `message`，这个函数，这个函数的语法说明如下：

> 名称

```
message() - 发送信息给活着的（living）对象
```

> 语法

```
void message( mixed class, string message, mixed target, mixed exclude );
```

> 描述

message() 呼叫 target 参数列表中除 exclude 参数列表以外的所有对象的 receive_message(mixed class, string message) 方法，通过此方法向对象发送消息。

参数 `class` 是消息的类型（用于客户端消息处理），例如：`combat`，`shout`, `emergency`等。

参数 `message` 是需要发送的消息字符串。

参数 `target` 是需要接收消息的对象列表，此参数数据类型既可以是单一对象字符串或者对象指针，也可以是一个对象数组。如果对象是非活着的，那么在此对象环境中的所有对象都会收到信息。

可选参数 `exclude` 是不需要接收消息的对象列表，此参数数据类型可以是对象或对象数组。

在游戏开发中，推荐使用这个外部函数来控制消息的输出，结合 apply 方法 `receive_message` 可以指定不同 `class` 的消息用不同的颜色输出，还可以实现让不同的人看到不同的结果的功能。比如 ROOM 中 A 和 B 战斗，C、D、E、F 旁观，G 昏迷，对 `A 向 B 发起了攻击，但是 B 轻松的躲开了 A 的攻击！` 这条信息，A～G看到的应该是这样的（假如 A 是男性，B 是女性）：

```
A：你向 B 发起了攻击，但是她轻松的躲开了你的攻击！
B： A 向你发起了攻击，但是你轻松的躲开了他的攻击！
C、D、E、F： A 向 B 发起了攻击，但是 B 轻松的躲开了 A 的攻击！
G：[不显示任何消息]
```

要针对不同玩家显示不同消息的解决方案是什么？在提出解决方案前，先简单说说战斗功能的实施方案，战斗是游戏的核心功能之一，开发时应该做为一种服务独立，可以参考 linux 系统中的守护进程（Daemon），实际游戏开发时，我们也是这样做的，比如开发一个名称为 `combat_d` 的战斗守护进程,玩家战斗时调用这个进程实现战斗信息显示、伤害处理、奖惩机制等。

在以上情况下 A 是发起战斗的 this_player() 玩家，这条消息应该由 A 调用守护。

> 基础方案

直接把不同的信息发给不同的对象，比如守护进程做基础判断后：

```
tell_object(A, "你向 B 发起了攻击，但是她轻松的躲开了你的攻击！");
tell_object(B, "A 向你发起了攻击，但是你轻松的躲开了他的攻击！");
tell_room(ROOM, "A 向 B 发起了攻击，但是 B 轻松的躲开了 A 的攻击！", ({A, B, G}));
```

> 推荐方案

A 做为发起战斗的 this_player()，和其他对象的关系可以分为：A - 我，B - 你，C～G - 他们。把信息做个处理成 `$ME 向 $YOU 发起了攻击，但是 $YOU 轻松的躲开了 $ME 的攻击！`,定义一个模拟外部函数，比如 `msg`，把我、你、他们和信息作为参数传递给这个函数，函数针对不同的对象对 `$ME` 和 `$YOU` 做不同的替换处理，然后把处理过的信息使用 `message` 发送给对象，最后在对象的 `receive_message` 控制显示。

在本教程的最新代码中已经实现了模拟外部函数 `msg`，函数原型为 `varargs void msg(string type, string msg, object me, object you, object *exclude);`。

现在还没有实现战斗系统，但是我们先模拟一个表情 `hi`，测试信息对不同人的显示相关功能。在 `/cmds/test/` 目录新建文件 `hi.c`，具体代码如下：

```c
// hi.c
int main(object me, string arg)
{
    object ob;
    if (arg &&ob = find_player(arg))
    {
        if (ob == me)
        {
            msg("emote", "$ME热情的和$ME自己打招呼！", me);
        }
        else
        {
            msg("emote", "$ME热情的和$YOU打招呼！", me, ob);
        }
    }
    else
    {
        msg("emote", "$ME热情的和大家打招呼！", me);
    }

    return 1;
}
```

请注意，这个看起来像表情的指令只是测试用，我们在正式的游戏中的表情动作系统不是这样实现的，具体方式在后续进阶教程会具体实现。我们输入指令 `hi` 试试，你会发现没有任何显示。这是当前玩家对象中没有 apply 方法 `receive_message`。

为了不修改已有对教程代码，我们再次新建一个玩家对象来扩展功能，在 `/cmds/test/` 目录新建玩家对象 `user3.c`，具体代码如下：

```c
// user3.c
#include <ansi.h>
inherit __DIR__ "user2";

void receive_message(string type, string message)
{
    // 可以在此判断是否显示消息等
    switch (type)
    {
    case "emote":
        receive(HIM + message + "\n" NOR);
        break;
    case "success":
        receive(HIG + message + "\n" NOR);
        break;
    case "danger":
        receive(HIR + message + "\n" NOR);
        break;
    case "warning":
        receive(HIY + message + "\n" NOR);
        break;
    case "info":
        receive(HIC + message + "\n" NOR);
        break;
    default:
        receive(HIW + message + "\n" NOR);
    }
}

void receive_snoop(string message)
{
    receive(HBBLU + message + NOR);
}
```

在这个玩家对象中，定义了2个玩家对象 apply 方法，`receive_message` 控制 `message` 外部函数的消息显示，`receive_snoop` 控制后面会讲到对 `snoop` 外部函数的消息显示。

现在输入指令 `user3` 后看看吧，可以多登录几个玩家然后都切换到 `user3` 玩家对象后输入 `hi 玩家id` 看效果。



## 变态的 snoop

在游戏中有一个指令 `snoop` 可以获得别的玩家的游戏内容，就像你是这个玩家一样，不过类似旁观者模式。具体语法说明如下：

> 名称

```
snoop() - 监听一个在线玩家
```

> 语法

```
varargs object snoop( object snooper, object snoopee );
```

> 描述

```
当使用2个参数时，对象 `snooper` 开始监听对象 `snoopee`。当第二个参数省略时，关闭 `snooper` 的所有监听。通常使用模拟外部函数控制 snoop() 的安全性。如果函数执行成功，使用2个参数时返回 `snoopee`，只有一个参数时返回 `snooper`。如果执行失败返回 0 。
```

这个外部函数需要配合 `receive_snoop` 使用，在上面的新的用户对象 `user3` 中已经实现了这个方法。

和外部函数 `snoop` 相关的外部函数有 `query_snoop` 和 `query_snooping`，具体语法说明如下：

> 名称

```
query_snoop() - 返回一个玩家对象的监听者
```

> 语法

```
object query_snoop( object ob );
```

> 描述

```
如果玩家对象 'ob' 正在被其他玩家监听，返回监听者，否则返回 0 。
```

------

> 名称

```
query_snooping() - 返回指定对象正在监听的对象
```

> 语法

```
object query_snooping( object ob );
```

> 描述

```
如果玩家对象 `ob` 正在监听其他玩家对象，返回被监听的对象，否则返回 0 。
```

游戏教程代码中实现了监听指令 `snoop`、`query_snoop`、`query_snooping`。请登录至少二个玩家测试，如：`snoop abc xyz` 让玩家 abc 监听 xyz，监听者必须切换到 `user3` 对象才可以正常监听。

