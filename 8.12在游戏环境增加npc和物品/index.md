# 8.12在游戏环境增加NPC和物品


# 8.12 在游戏环境增加NPC和物品

正常游戏开发中需要实现的看得见摸得着的对象可以分为三类：环境对象、生物对象、物品对象。环境对象就是游戏中的环境，包括房间、地牢、野外等等；而生物对象是有生命的，包括玩家对象和NPC对象，NPC对象又可以细分为NPC人物（友好）和NPC怪物（敌对）；物品对象是除环境对象外的所有非生物对象。

在前面章节中我们规范了游戏基本环境拥有 `short`、`long`、`exits`等基本参数设置环境的名称、描述和出口，而生物和物品对象类似，只要我们标准化参数和功能接口，在游戏中实现即可，另外生物对象还需要 `enable_commands()`、`set_heart_beat()`、`set_living_name()`等，具体介绍在第五章已经初步讲解，这里不过多阐述，在后续高级教程中再实战。

本节先演示一个最最简单的功能：把NPC或物品初始化到房间中去。我们先在示例项目中移动到坐标 `5,2,0` 的位置，会看到描述的房间里多了几位冒险者。这个该怎么实现呢？

先看看一下示例代码 `/area/world/5,2,0.c`：

```c
inherit ROOM;

void create()
{
    set("short", "神弃之地 - 坐标(5,2,0)");
    set("long", @LONG
    这里是下午镇郊外，几位提着兽皮灯笼的白银城冒险者正在这里探索。
LONG );
    set("objects",([
        __DIR__ "npc/npc" : 1 + random(5),
    ]));
    set("exits", ([
        "east":__DIR__ "6,2,0",
        "north":__DIR__ "5,3,0",
        "south":__DIR__ "5,1,0",
        "west":__DIR__ "4,2,0",
    ]));
    setup();
}
```

以上代码中，继承了 `ROOM`（具体路径为：/inherit/room.c） 对象，增加了 `objects` 属性，并调用了 `setup()` 方法，这个方法是在 `ROOM` 对象实现的，我们先看看 `/inherit/room.c` 的代码：

```c
inherit CLEAN_UP;
inherit DBASE;

// void create(){}

object make_inventory(string file)
{
    object ob;

    ob = new(file);
    ob->move(this_object());
    return ob;
}

// driver自动定期呼叫此apply
void reset()
{
    /**
     * ob_list:需要加载的对象map列表
     * ob:加载后的对象map列表
     */
    mapping ob_list, ob;
    string file;
    int amount;

    if (!mapp(ob_list = query("objects")))
        return;

    if (!mapp(ob = query_temp("objects")))
        ob = ([]);

    foreach(file, amount in ob_list)
    {
        if (amount == 1)
        {
            if(!objectp(ob[file]))
                ob[file] = make_inventory(file);
        }
        else
        {
            if (!arrayp(ob[file]))
                ob[file] = allocate(amount);
            for(int i = 0; i < amount; i++)
            {
                if(!objectp(ob[file][i]))
                    ob[file][i] = make_inventory(file);
            }
        }
    }
    // 缓存对象列表
    set_temp("objects", ob);
}

void setup()
{
    reset();
}
```

这里我们自己定义了二个方法： `make_inventory()` 和 `setup()`，`make_inventory()` 的功能是加载对象并移动到当前房间，`setup()` 方法只是呼叫了 `reset()` 方法，而 `reset()` 方法是系统 apply ，会被驱动定期呼叫，在这里我们实现的功能也很简单，就是把 `set("objects", ([...]))` 中的对象载入到房间。

因为 `make_inventory()` 中是通过 `ob->move(this_object());` 方法把对象移动到环境中的，所以，所有需要放到房间中的对象需要实现这个方法。在教程示例中 `objects` 内容是 `__DIR__ "npc/npc" : 1 + random(5),`，也就是随机放1~5个NPC到房间，我们可以看看 `/area/world/npc/npc.c` 的代码：

```c
inherit DBASE;

// 方便移动对象到指定环境
int move(mixed dest)
{
    move_object(dest);

    return 1;
}

void create()
{
    set("name", "白银城冒险者");
    set("unit", "位");
}
```

实现了一个 `move()` 方法，方便移动到指定环境，定义了二个参数 `name` 和 `unit`。

游戏中我们看到的一切都是通过 `look` 指令实现的，对象放到环境后，通过 `look` 实现查看功能即可。类似代码如下：

```c
// /cmds/look.c
...
string desc_of_objects(object *obs)
{
    if (obs && sizeof(obs) > 0)
    {
        int i;
        string str;
        mapping amount, unit;
        string short_name;
        string *ob;

        str = "    这里有：";
        amount = ([]);
        unit = ([]);

        for (i = 0; i < sizeof(obs); i++)
        {
            short_name = obs[i]->query("name");
            if (!short_name)
            {
                short_name = geteuid(obs[i]);
            }
            amount[short_name] += 1;
            unit[short_name] = obs[i]->query("unit") ? obs[i]->query("unit") : "个";
        }

        ob = sort_array(keys(amount), 1);

        for (i = 0; i < sizeof(ob); i++)
        {
            if (amount[ob[i]] > 1)
                str += amount[ob[i]] + unit[ob[i]] + ob[i] + " ";
            else
                str += ob[i] + " ";
        }
        return str + "\n";
    }

    return "";
}

string look_all_inventory_of_room(object me, object env)
{
    object *inv;
    object *obs;
    string str = "";

    if (!env || !me)
        return "";

    inv = all_inventory(env);
    if (!sizeof(inv))
        return str;

    obs = filter_array(inv, (: $(me) != $1 :));
    str += desc_of_objects(obs);

    return str;
}
```

在正规的游戏开发中，我们应该把对象公共的功能独立出来由需要的对象继承，比如示例中的 `move()` 方法，可以独立出让玩家对象、NPC对象和物品对象继承，这里不再演示。

