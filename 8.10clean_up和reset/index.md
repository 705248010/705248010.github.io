# 8.10clean_up和reset


# 8.10 clean_up 和 reset

在玩游戏时我们应该有过这种经历：有的物品丢地上一段时间后会消失不见，有的NPC被杀死后过一段时间又会重生。在MUD开发中也有这种需求，怎么实现呢？这需要用到二个 apply 方法：`clean_up` 和 `reset`。这二个方法都是所有游戏对象中都可以实现的，具体语法说明如下：

> 名称

```
clean_up - 在不活动(inactive)的对象中定期呼叫此方法
```

> 语法

```
int clean_up( int inherited );
```

> 描述

```
驱动程序会定期呼叫所有已经一段时间不活跃的对象中的 clean_up() 方法。这段时间的长短在运行时配置文件中指定。传递给函数的标识符 `inherited` 指明此对象是否被其它对象继承。

如果 clean_up() 返回 0，此方法在这个对象中永远不再重复呼叫，如果返回 1，在指定的 clean_up() 延迟时间后对象还是不活动时，会再次呼叫 clean_up() 方法。

通常对象使用此方法摧毁自己以节省内存，不过一般不会摧毁已经被其它对象继承的对象。
```

------

> 名称

```
reset - 让对象做自我维护
```

> 语法

```
void reset( void );
```

> 描述

```
在每次重置间隔之后，所有对象会调用自己的 reset() 方法（如果有的话）。如果编译驱动时定义了 LAZY_RESETS ，只有玩家附加的对象才会呼叫 reset() 方法。 reset() 方法常用来重置游戏中的对象（宝物、怪物、机关等）。

默认重置间隔时间（rest_time）在运行时配置文件中设置，实际每个对象的重置间隔不完全一样，具体为：

reset_time = current_time + reset_time / 2 + random(reset_time / 2)
```

一般我们把 `clean_up` 作为单独的功能模块有所有需要定期摧毁的对象继承，在本教程的 `/inherit/clean_up.c` 中实现的就是这个功能，代码如下：

```c
// clean_up.c
#define NEVER_AGAIN 0
#define AGAIN 1

int clean_up(int inherited)
{
    object *inv;

    // 在线游戏玩家不清除
    if (interactive(this_object()))
        return AGAIN;
    // 在环境中的对象不主动清除（通过清除环境来清理）
    if (environment())
        return AGAIN;
    // 如果环境中有玩家则不清除环境
    inv = all_inventory();
    for (int i = sizeof(inv) - 1; i >= 0; i--)
        if (interactive(inv[i]))
            return AGAIN;

    destruct(this_object());
    return NEVER_AGAIN;
}
```

把这个功能宏定义为 `CLEAN_UP`，需要定期摧毁的对象可以 `inherit CLEAN_UP;`，大家可以自己对测试代码加入继承实现定期清理的功能。

`reset` 方法基本是针对具体功能实现，MUD开发中主要是针对环境对象使用 `reset` 方法在环境中加入物品或NPC对象，目前主流MUD的实现使用类似如下代码指定环境中的对象和数量：

```
set("objects", ([
    __DIR__"npc/xiaoer" : 1,
]));
```

在环境全局继承对象中通过 `reset()` 方法实现把以上代码指定的对象加载到环境中，并自定义一个方法 `setup()` 调用 `reset()` 方法。在环境初始化时使用 `setup()`加载对象，以后由驱动自动定期调用 `reset()` 重置环境中的对象。

`clean_up()` 和 `reset()` 的定期执行时间在运行时配置文件中指定，本教程中 `clean_up` 周期时间是 15 分钟，`reset` 的周期时间是 10 分钟，实际驱动呼叫 `reset` 时间周期是 `5 + random(5)` 分钟。

