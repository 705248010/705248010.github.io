# 8.13强大的虚拟对象


# 8.13 强大的虚拟对象

在讲解虚拟对象前，我们先体验一个实例，在本教程配套 mudlib 中先切换到 `user4` (`user2`以后的玩家对象都可)，然后执行指令 `move_object /area/tower`，移动自己到 `/area/tower` 中，你会看到：

```
[50|99]move_object /area/tower
你的当前环境：/area/tower
[50|99]l
勇者之塔 第 0 层
    这里是封印着无穷无尽的魔物的勇者之塔，据说这座塔通天
彻地，没有人知道具体有多少层，也没有人真正的到达过终点。
    这里明显的出口是 down 和 up。
```

在这里，你可以无限的 `up` 或者 `down`，请注意，这里每一层都是不同的环境，并不是简单的把 `up` 和 `down` 的出口连接到自己让一个环境自己循环。可以使用指令 `environment` 查看自己所在环境：你在 /area/tower 中、你在 /area/tower/0,0,1 中、你在 /area/tower/0,0,2 中...![file](https://api.mud.ren/storage/uploads/2019/10/14/9fbd1bb7c314fa6ef90cf6b2226f1a19.png)先看一看 `/area/tower.c` 的代码：

```c
// tower.c
inherit CLEAN_UP;
inherit DBASE;

varargs void create(int x, int y, int z)
{
    set("short", "勇者之塔 第 " + z + " 层");
    set("long", @LONG
    这里是封印着无穷无尽的魔物的勇者之塔，据说这座塔通天
彻地，没有人知道具体有多少层，也没有人真正的到达过终点。
LONG);
    set("exits", ([
        "up":__DIR__ "tower/" + x + "," + y + "," + (z + 1),
        "down":__DIR__ "tower/" + x + "," + y + "," + (z - 1),
    ]));
}
```

代表第几层的变量 `z` 是int型，在fluffos中，这个数据范围是-9223372036854775808~9223372036854775807,这是正常玩家不可能到达的极限。

这样简单的一个文件，实现了无限的世界，甚至经过精心的设计，可以实现类似我的世界这种随机地貌的无限世界，这就是结合虚拟对象实现的强大功能。

要实现以上功能的核心是一个 apply 方法 `compile_object`，这个方法需要在主控对象中实现具体功能，其语法说明如下：

> 名称

```
compile_object  - 做为 mudlib 中虚拟对象的接口
```

> 语法

```
object compile_object( string pathname );
```

> 描述

```
当 mudlib 需要驱动程序载入一个不存在的对象时驱动程序会调用主控对象中的 compile_object() 方法。如：当 mudlib 调用 call_other("/obj/file.r", "some_function") 或 new("/obj/file.r") 且文件 "/obj/file.r.c" 不存在时驱动程序会调用主控对象中的 compile_object("/obj/file.r") 方法。如果 mudlib 不想关联对象到文件名 "/obj/file.r"，compile_object() 方法将返回 0 ，如果 mudlib 想关联一个对象到文件名 "/obj/file.r" ，compile_object() 应该返回被关联的对象。当把对象和文件名关联后，就像这个文件真的存在一样，而通过文件名载入的对象就是 compile_object() 方法返回的对象。
```

通过 `compile_object` 方法可以实现虚拟对象，让一个对象虚拟出多个不同的对象，而通过 `new()` 方法可以复制对象。结合这二点我们可以实现单一文件无限地图的功能。具体思路如下：

1. 地图文件 `map.c` 实现地图的功能，地图带有坐标系统，不同地区的区别就是坐标不同；
2. 规定坐标为三维(x,y,z)，每个地区的虚拟对象为 map/x,y,z.c，`map.c` 中移动方向连接到对应方向的虚拟对象；
3. 当载入虚拟对象时，在 `compile_object` 中通过 `new()` 传递坐标参数返回指定坐标的对象；

现在再分析以上具体示例 `tower.c`，代码中实现上下方向路径为：`tower/x,y,z+1` 和 `tower/x,y,z-1`，当直接移动到 `tower.c` 中时，没有传递 x/y/z 参数，默认为 0，up 路径为 `tower/0,0,1`， down 路径为 `tower/0,0,-1`，当玩家向对应路径移动时，系统不存在对应的文件，会呼叫 master 对象中的 `compile_object` 方法，示例中具体方法实现如下：

```c
mixed compile_object(string str)
{

    if (sscanf(str, "/area/%*s", str))
    {
        return call_other("/system/daemons/virtual_d", "compile_area", str);
    }
    else
    {
        return 0;
    }
}
```

这个方法核心功能是判断呼叫的对象是否 `/area/` 目录下，如果在，由虚拟对象文件 `/system/daemons/virtual_d` 中的 `compile_area` 方法处理，这个方法的具体实现如下：

```c
mixed compile_area(string file)
{
    string virtual;
    object ob;
    int x, y, z, m, n;

    n = strsrch(file, "/", -1);
    if (n < 1)
    {
        return 0;
    }

    virtual = file[0..n - 1];

    if (file_size(virtual + ".c") < 1)
    {
        return 0;
    }

    if ((m = sscanf(file[n + 1..], "%d,%d,%d", x, y, z)) != 3)
    {
        if ((m = sscanf(file[n + 1..], "%d,%d", x, y)) != 2)
        {
            return 0;
        }
    }

    if (m == 2 && !(ob = new (virtual, x, y)))
    {
        return 0;
    }
    else if (m == 3 && !(ob = new (virtual, x, y, z)))
    {
        return 0;
    }

    return ob;
}
```

代码功能非常简单，判读传递的对象路径是否是 `map/x,y,z` 或 `map/x,y` 格式，判断是否存在 `map.c` 文件，如果符合条件，返回 `new(map,x,y,z)` 对象。

以上方法就实现了无限地图功能，我们可以在唯一的地图文件 `map.c` 中通过坐标范围实现更复杂的功能，比如某个坐标有特别的描述或人或物，某个范围的坐标是某种特别的地形。

而且巧妙的是，我们还可以直接建立真实的文件实现具体坐标的对象功能，而不是全部在 `map.c` 中通过坐标判断由虚拟对象实现。在本示例代码中就有演示：`/area/world.c` 是实现无限地图的核心文件，但同时，在 `area` 目录下存在 `world` 目录，在这个目录中的 `0,0,0.c` 和 `5,2,0.c` 二个文件实现了 `world/0,0,0` 和 `world/5,2,0` 二个坐标的功能。

