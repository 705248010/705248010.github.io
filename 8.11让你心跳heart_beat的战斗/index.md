# 8.11让你心跳（heart_beat）的战斗


# 8.11 让你心跳（heart_beat）的战斗

游戏中有战斗是冒险很重要的一部分，关于战斗，主流的模式有二种：回合制和即时制。MUD游戏开发中的战斗系统多数是一种半回合半即时制的，核心机制是使用 apply 方法 `heart_beat()` 触发。关于 `heart_beat()` 方法的语法说明如下：

> 名称

```
heart_beat() - 启动心跳的对象定期呼叫此方法
```

> 语法

```
void heart_beat( void );
```

> 描述

```
如果一个对象曾经呼叫 set_heart_beat() 外部函数启动了心跳，此方法会被定期呼叫。
```

这个方法中可以做的事情很多，比如 buff 控制，战斗控制等等。相关的外部函数 `set_heart_beat()` 的语法说明如下：

> 名称

```
set_heart_beat() - 开启或关闭一个对象的心跳
```

> 语法

```
int set_heart_beat( int flag );
```

> 描述

参数 `flag` 为 0 时关闭对象心跳，为 1 时对象每一次心跳都会呼叫对象的 heart_beat() 方法一次（心跳频率可以在运行时配置文件中设置，默认为 1000 毫秒，即 1 秒）。参数数值大于 1 时代表每隔多少次心跳呼叫 heart_beat() 方法一次。

在上一节中有简述战斗的实现方案，新建一个战斗守护进程 `combat_d` 控制战斗，战斗双方在各自的 `heart_beat()` 方法中调用战斗处理程序 `combat_d` 实现半自动的战斗，而对绝招则限制使用条件，避免不合理的战斗行为。

这里先演示一个简单的战斗实现流程：

1. 实现战斗功能模块，主要为设置、移除和攻击敌人
2. 实现战斗守护进程，主要为战斗控制、伤害处理和信息显示
3. 玩家对象继承战斗模块，并通过心跳判断是否在战斗中，对战斗中玩家使用战斗守护进程处理战斗

战斗模块在游戏中应该是多数生物对象都需要实现的，所以最好独立出来，由需要战斗功能的对象继承，如 ES2 中的 `/feature/char/attack.c`。这个独立功能模块在正式游戏开发中一般应该放在 `/inherit/` 目录中，但本教程统一所有代码在 `/cmds/test/` 中，在这里我们先简单实现一个战斗功能模块，代码文件 `/cmds/test/F_COMBAT.c`，内容如下：

```c
// 战斗模块F_COMBAT
#define COMBAT_D __DIR__"COMBAT_D"

// 敌人列表
nosave object *enemies = ({});
// 获取敌人列表
object *query_enemy() { return enemies; }

// 判断是否在战斗中或在和指定对象战斗
varargs int is_fighting(object ob)
{
    if (!ob)
        return sizeof(enemies) > 0;

    return member_array(ob, enemies) != -1;
}

// 和指定对象开始战斗
void fight(object ob)
{
    if (member_array(ob, enemies) == -1)
    {
        enemies += ({ob});
    }
}

// 清理无效敌人
void clean_up_enemy()
{
    int i;
    if (i = sizeof(enemies))
    {
        while (i--)
        {
            if (!objectp(enemies[i]) || environment(enemies[i]) != environment())
            {
                enemies[i] = 0;
            }
        }
        enemies -= ({0});
    }
}

// 移除指定敌人
int remove_enemy(object ob)
{
    enemies -= ({ob});
    return 1;
}

// 清除所有敌人
void remove_all_enemy()
{
    enemies = ({});
}

// 开始攻击随机敌人
void attack()
{
    object me = this_object(), opponent;

    clean_up_enemy();
    if (sizeof(enemies) && objectp(opponent = element_of(enemies)))
    {
        COMBAT_D->fight(me, opponent);
    }
}

// 死亡处理
void die()
{
    object me = this_object();
    remove_all_enemy();
    msg("danger", "$ME死亡了。", me);
    me->move(VOID_OB);
    me->set("hp", 50);
}
```

代码实现了一些战斗相关的方法，使用 `fight()` 方法开始战斗，使用 `attack()` 方法攻击敌人，具体战斗流程由战斗守护进程 `COMBAT_D` 控制，正式游戏中这个文件一般放在系统的 `daemons` 目录中，这里我们还是统一放在 `/cmds/test/` 下，文件为 `/cmds/test/COMBAT_D.c`，代码如下：

```c
#include <ansi.h>

// 战斗伤害类型
#define TYPE_N 0 // 普通攻击
#define TYPE_C 1 // 会心一击

// 攻击信息
nosave string *attack_msg = ({
    "$ME无视$YOU的行动，全力发起攻击。",
    "$ME盯著$YOU的一举一动，乘$YOU没有防备突然出招。",
    "$ME慢慢地移动著脚步，然后快速攻击。",
});
// 防御攻击信息
nosave string *guard_msg = ({
    "但是$ME的攻击被$YOU格挡了。",
    "但是$YOU已有准备，不慌不忙的格挡住$ME的攻击。",
});
// 躲避攻击信息
nosave string *dodge_msg = ({
    "但是$ME的攻击被$YOU机灵地躲开了。",
    "但是$YOU左避右闪，躲过了$ME的攻击。",
    "但是$YOU已有准备，不慌不忙的躲开了$ME的攻击。",
});
// 伤害信息
string damage_msg(int damage, int type)
{
    if (damage == 0)
    {
        switch (random(3))
        {
        case 1:
            return element_of(guard_msg);
        case 2:
            return element_of(dodge_msg);
        default:
            return "但是$ME的攻击对$YOU没有造成任何伤害。";
        }
    }

    switch (type)
    {
    case TYPE_C:
        return YEL "$ME发动会心一击，对$YOU造成了 " + damage + " 点爆击伤害。";
    default:
        return "$ME对$YOU造成了 " + damage + " 点伤害。";
    }
}

void create()
{
}

// 攻击处理
void do_attack(object me, object victim)
{
/**
 * 物理伤害计算方法
 * [伤害计算值]=(攻击力/2-防御力/4)+1
 * [伤害波动]=[伤害计算值]/16+1
 * [实际伤害值]=[伤害计算值]±[伤害波动]
 */
    int attack, damage, defense, random, attack_type = TYPE_N;

    attack = me->query("str");
    defense = me->query("def");
    damage = attack / 2 - defense / 4 + 1;

/**
 * 会心伤害（暴击）无视防御
 * [会心伤害基础值]=攻击力
 */
    if (random(100) < random(me->query("agi")))
    {
        damage = attack;
        attack_type = TYPE_C;
    }
    // 伤害波动
    random = damage / 16 + 1;
    if (random(2))
    {
        damage += random;
    }
    else
    {
        damage -= random;
    }

    if (damage < 0)
    {
        damage = random(3);
    }

    victim->set("hp", victim->query("hp") - damage);
    msg("success", damage_msg(damage, attack_type), me, victim);
}

// 战斗回合处理
void fight(object me, object victim)
{
    // 避免隔空战斗
    if (environment(me) != environment(victim))
    {
        return;
    }

    if (!victim->is_fighting(me))
    {
        victim->fight(me);
    }

    msg("info", element_of(attack_msg), me, victim);
    do_attack(me, victim);
}
```

为了演示战斗，我们需要完善玩家对象，继续新建玩家对象 `/cmds/test/user4.c`，代码如下：

```c
// user4.c
#include <ansi.h>

inherit __DIR__ "user3";
inherit DBASE;              // 数据模块
inherit __DIR__ "F_COMBAT"; // 战斗模块

varargs void create(string arg)
{
    ::create(arg);
    if (clonep())
    {
        set("max_hp", 50 + random(50));
        set("hp", query("max_hp"));
        set("str", 40 + random(10));
        set("def", 30 + random(10));
        set("agi", 20 + random(10));
        set("gender", random(2) ? "男" : "女");
        set_heart_beat(1);
    }
}

void heart_beat()
{
    // 死亡相关控制
    if (query("hp") <= 0)
    {
        die();
    }
    // 行动相关控制
    if (is_fighting())
    {
        // 战斗吧，皮卡丘
        attack();
    }
}

void write_prompt()
{
    write(sprintf("[%s|%s]", GRN + query("hp") + NOR, HIG + query("max_hp") + NOR));
}

void net_dead()
{
    say(HIR "玩家(" + geteuid() + ")断线了。\n" NOR);
    destruct();
}

int id(string id)
{
    return geteuid() == id;
}
```

新实现的玩家对象继承了战斗模块，给玩家增加了 hp、str、def、agi 等属性，开启了玩家心跳，并实现了 `heart_beat()`、`write_prompt()`、`net_dead()`、`id()` 几个 apply 方法。其中 `heart_beat()` 方法判断玩家是否在战斗中，并做相关处理；`write_prompt()` 方法更改玩家界面提示符为当前hp和最大hp；`net_dead()` 方法是玩家断线时会自动调用的方法，这里只是简单的做了提示并摧毁掉线玩家；`id()` 方法主要是配合 `present` 外部函数用的，方便通过名称在当前环境查找指定对象，相关语法如下：

> 名称

```
net_dead - 当玩家掉线时游戏驱动会呼叫此方法
```

> 语法

```
void net_dead( void );
```

> 描述

当有互动对象（玩家）掉线时游戏驱动呼叫掉线玩家中的此方法，通过此方法清理掉断线对象或通知给其它对象等。

------

> 名称

```
write_prompt - 显示玩家界面命令提示符
```

> 语法

```
void write_prompt( void );
```

> 描述

如果玩家对象中存在 write_prompt() 方法，当需要显示提示符时会调用此方法。如果玩家在输入(in_input)或者编辑(in_edit)状态，驱动程序不会调用此方法。

------

> 名称

```
id() - 此方法被 present() 外部函数调用来识别对象名称
```

> 语法

```
int id( string id );
```

> 描述

present(3) 外部函数呼叫 id() 以检测对象是否以字符串 `id` 命名。如果对象希望以字符串 `id` 为名，id() 返回 1，否则返回 0 。

------

> 名称

```
present() - 通过 id 查找对象
```

> 语法

```
object present( mixed str );
object present( mixed str, object ob );
```

> 描述

如果第一个参数是字符串，第二个参数为 0 或不指定，在当前对象的内容对象中和当前对象所在环境的的内容对象中寻找对象的 id() 方法返回值为 1 的对象，找到后返回该对象。

如果第一个参数是字符串，第二个参数是对象，仅仅在指定对象的内容对象中寻找。

如果第一个参数是对象，第二个参数为 0 或不指定，检查对象 `str` 是否在当前对象的环境中或当前对象所在的环境中，如果是，返回对象 `str` 的环境。

如果第一个参数和第二个参数都是对象，检查第一个对象是否在第二个对象中，如果是，返回第一个对象。

如果要查找的对象是隐藏的（通过 set_hide() 外部函数），而当前对象不可隐藏，查找结果返回 0。

现在，我们再实现一个指令 `/cmds/fight.c` 来让玩家开始战斗，本教程中已经实现了这个指令，具体代码如下：

```c
int main(object me, string arg)
{
    object ob;

    if (file_name(environment(me)) == VOID_OB)
    {
        return notify_fail("这里禁止战斗。\n");
    }
    if (!arg || !objectp(ob = present(arg, environment(me))))
    {
        debug("你想攻击谁？");
    }
    else if (ob == me)
    {
        debug("你不能攻击自己。");
    }
    else if (ob->is_fighting(me))
    {
        debug("加油！加油！加油！");
    }
    else
    {
        msg("warning", "$ME大喝一声，对$YOU发起了攻击。", me, ob);
        me->fight(ob);
    }

    return 1;
}
```

指令的核心其实就是调用玩家对象继承的战斗模块的 `fight()`方法：`me->fight(ob);`。现在我们来测试一下：登录三个玩家a、b、c，全部输入 `user4` 切换到实现战斗功能的玩家对象上，然后 a 输入 `fight b` 会开始战斗。

a 看到的内容大致如下：

```
[99|99]fight b
你大喝一声，对B发起了攻击。
你慢慢地移动著脚步，然后快速攻击。
你对B造成了 16 点伤害。
B盯著你的一举一动，乘你没有防备突然出招。
B对你造成了 19 点伤害。
你盯著B的一举一动，乘他没有防备突然出招。
你对B造成了 14 点伤害。
B无视你的行动，全力发起攻击。
B对你造成了 19 点伤害。
你慢慢地移动著脚步，然后快速攻击。
你对B造成了 16 点伤害。
B盯著你的一举一动，乘你没有防备突然出招。
B对你造成了 15 点伤害。
你慢慢地移动著脚步，然后快速攻击。
你对B造成了 14 点伤害。
B无视你的行动，全力发起攻击。
B对你造成了 19 点伤害。
你慢慢地移动著脚步，然后快速攻击。
你对B造成了 16 点伤害。
B死亡了。
```

b 看到的内容大致如下：

```
A大喝一声，对你发起了攻击。
A慢慢地移动著脚步，然后快速攻击。
A对你造成了 16 点伤害。
你盯著A的一举一动，乘他没有防备突然出招。
你对A造成了 19 点伤害。
A盯著你的一举一动，乘你没有防备突然出招。
A对你造成了 14 点伤害。
你无视A的行动，全力发起攻击。
你对A造成了 19 点伤害。
A慢慢地移动著脚步，然后快速攻击。
A对你造成了 16 点伤害。
你盯著A的一举一动，乘他没有防备突然出招。
你对A造成了 15 点伤害。
A慢慢地移动著脚步，然后快速攻击。
A对你造成了 14 点伤害。
你无视A的行动，全力发起攻击。
你对A造成了 19 点伤害。
A慢慢地移动著脚步，然后快速攻击。
A对你造成了 16 点伤害。
你死亡了。
这里一片虚无，什么也没有。
```

c 看到的内容如下：

```
A大喝一声，对B发起了攻击。
A慢慢地移动著脚步，然后快速攻击。
A对B造成了 16 点伤害。
B盯著A的一举一动，乘A没有防备突然出招。
B对A造成了 19 点伤害。
A盯著B的一举一动，乘B没有防备突然出招。
A对B造成了 14 点伤害。
B无视A的行动，全力发起攻击。
B对A造成了 19 点伤害。
A慢慢地移动著脚步，然后快速攻击。
A对B造成了 16 点伤害。
B盯著A的一举一动，乘A没有防备突然出招。
B对A造成了 15 点伤害。
A慢慢地移动著脚步，然后快速攻击。
A对B造成了 14 点伤害。
B无视A的行动，全力发起攻击。
B对A造成了 19 点伤害。
A慢慢地移动著脚步，然后快速攻击。
A对B造成了 16 点伤害。
B死亡了。
```

以上教程实现了很简单的战斗逻辑，更复杂的战斗系统可以参考成熟的MUDLIB代码。每一次普通攻击都是一个心跳回合，这本质上是半回合制的战斗模式，目前的武侠MUD战斗逻辑也是这样的，只是招式描述从学习的武功中获取，同时使用 busy 和内力要求限制绝招的使用。

当然 `heart_beat` 的功能不限于战斗，还有自动存档、buff 控制等都可以在这里实现，这些会在进阶教程中实现。

