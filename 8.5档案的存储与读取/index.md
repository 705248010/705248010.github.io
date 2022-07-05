# 8.5档案的存储与读取


# 8.5 档案的存储与读取

在游戏中，我们每个人的数据都需要保存下来才能在下次连线后继续游戏。在LPC中提供了二种存档方式：一种是存到数据库中，一种是存到文件中。在MUD中，存档到文件要比数据库中更方便操作，主要使用了 `save_object()` 和 `restore_object()` 二个外部函数。

## save_object()

> 名称

```
save_object() - 保存当前对象的变量值到一个文件
```

> 语法

```
int save_object( string name, int flag );
```

> 描述

```
保存当前对象中所有非 nosave 类型的全局变量到文件 `name` 中。主控对象中的 valid_write() 方法检测是否允许写文件。第二个参数为可选参数，是一个位域（00、01、10、11），如果 0 位是 1（如：01、11），值为 0 的变量也会保存（正常情况下不会保存），对象类型变量一只保存为 0，如果 1 位是 1（如：10、11），存档文件会被压缩。存档成功返回 1，失败返回 0。
```



## restore_object()

> 名称

```
restore_object() - 从一个文件读取变量值到当前对象
```

> 语法

```
int restore_object( string name, int flag );
```

> 描述

```
从文件 `name` 读取存档（变量和值）到当前对象。如果第二个可选参数是 1，所有不是 nosave 类型的变量不会在恢复存档前被重置为 0（正常情况下会重置为 0）。如果读取时出错，所有受影响到变量都不会被更改并传回错误。
```

请注意，存档仅仅保存非 `nosave` 类型的全局变量，在第五章第二节关于变量的内容中有具体演示，我们可以回到示例 `5.2.1.c` 看看效果。

在本教程提供的代码中实现了存档函数的同名指令 `save_object`，可以保存任何对象的存档到指定文件。



## dbase 接口

在正常的游戏开发中，玩家有大量的数据需要保存，比如：姓名、ID、性别、职业、年龄、经验等等等等。我们一般不会定义一堆 int 或 string 类型全局变量保存玩家的存档，而是定义一个映射变量，所有数据都保存在这个映射变量中。而且数据的存取是非常频繁的操作，为了方便，我们会定义一个接口实现一些方法存取数据，如：set()、query()、delete()用来存取和删除需要存档的数据，set_temp()、query_temp()、delete_temp()用来存取和删除不需要存档的数据。

在本教程中也实现了这个接口，对应文件为 `/inherit/dbase.c`，在这个文件中定义了二个全局变量 `mapping dbase;` 和 `nosave mapping tmp_dbase;`，其中 `dbase` 用来存可以存档的数据的，`tmp_dbase` 用来存临时数据的。文件还实现了一系列的函数操作数据，包括 `set()`、`query()`、`delete()`、`add()`、`set_temp()`、`query_temp()`、`delete_temp()`、`add_temp()`等等，具体可以查看代码。

本接口全局定义的宏为 `DBASE`，对需要存取数据的对象，可以直接继承这个接口（`inherit DBASE;`）。我们新建一个测试对象 `test_npc.c`，代码如下：

```c
inherit DBASE;

void create()
{
    set("name", "纪晓芙");
    set("id", ({"ji xiaofu", "ji", "xiaofu"}));
    set("long", "她是峨嵋派的***俗家弟子。灭绝抛弃她，\n"
                "她独自在这里苦度光阴。\n");
    set("gender", "女性");
    set("age", 22);
    set("attitude", "peaceful");
    set("class", "fighter");
    set("shen_type", 1);

    set("str", 30);
    set("int", 30);
    set("con", 30);
    set("dex", 30);
    set("per", 30);
    set("inquiry", ([
        "倚天剑":"这是我们郭师祖传下来的镇派之宝，可听说被夺走了。",
        "屠龙刀":"武林至尊，宝刀屠龙。",
        "杨不悔":"我的女儿啊。她在哪里？你知道么？",
        "杨逍":"我这辈子是不指望见到他了。",
        "灭绝":"***就是太偏心。",
    ]));

    set("max_qi", 2500);
    set("max_jing", 1200);
    set("neili", 2700);
    set("max_neili", 2700);
    set("combat_exp", 320000);
}
```

以上代码中一堆 set() 函数，对看过炎黄游戏代码的应该很眼熟了。游戏中的NPC等对象的数据虽然因为是直接写在代码中的，并不需在存档，我们也可以存档看看数据，使用指令 `save_object /cmds/test/test_npc to test_npc flag 00` 然后看看存档的数据吧。数据大概是这样的：

```
#/cmds/test/test_npc.c
dbase (["max_qi":2500,"int":30,"per":30,"class":"fighter","name":"纪晓芙","dex":30,"id":({"ji xiaofu","ji","xiaofu",}),"str":30,"inquiry":(["屠龙刀":"武林至尊，宝刀屠龙。","倚天剑":"这是我们郭师祖传下来的镇派之宝，可听说被夺走了。","杨逍":"我这辈子是不指望见到他了。","灭绝":"***就是太偏心。","杨不悔":"我的女儿啊。她在哪里？你知道么？",]),"gender":"女性","combat_exp":320000,"max_jing":1200,"attitude":"peaceful","shen_type":1,"neili":2700,"con":30,"max_neili":2700,"age":22,"long":"她是峨嵋派的***俗家弟子。灭绝抛弃她，
她独自在这里苦度光阴。
",])
```

档案的读取使用 `restore_object()` 外部函数，这里暂时不做演示，在进阶教程中会有具体使用。另外还有一些和全局变量及数据存取相关的外部函数：`save_variable`、`restore_variable`、`fetch_variable`、`store_variable`、`restore_from_string`，具体用法可以查看：https://wiki.mud.ren/index.php?title=Lpc:Efun



## 关于数据库存档

如何使用数据库存档？并不推荐，因为文本数据库存档快速方便，并没有必要把所有数据存到mysql等数据库中，但是可以存部分需要网页调用的数据到数据库（如本站演示的英雄榜），方便开发，如下示例使用sqlite数据库存部分数据，然后在玩家save时调用，就会自动存数据到数据库。

```c
/**
 * 玩家存档缓存接口
 * 缓存玩家数据到db.sqlite，方便网页、全服排行等调用
 */
#ifdef __USE_SQLITE3__
// 初始化数据库
mixed init_db();
// 玩家数据缓存接口
mixed insert(object user, int last_touched);
// 玩家数据更新接口
mixed update(object user);
// 玩家数据删除接口
mixed delete(object user);

nosave object db;

void create()
{
    db = new (DATABASE, "", "/data/db.sqlite", "", __USE_SQLITE3__);
}

mixed init_db()
{
    mixed res;

    db->sql("DROP TABLE IF EXISTS `users`")->exec();
    res = db->sql("CREATE TABLE IF NOT EXISTS `users` (
        `id` VARCHAR(10) PRIMARY KEY NOT NULL,
        `name` VARCHAR(10) NOT NULL,
        `title` VARCHAR(50) DEFAULT NULL,
        `master` VARCHAR(10) DEFAULT NULL,
        `mobile` INTEGER DEFAULT NULL,
        `age` INTEGER DEFAULT NULL,
        `qi` INTEGER DEFAULT NULL,
        `jing` INTEGER DEFAULT NULL,
        `neili` INTEGER DEFAULT NULL,
        `jingli` INTEGER DEFAULT NULL,
        `combat_exp` INTEGER DEFAULT NULL,
        `kill` INTEGER DEFAULT NULL,
        `die` INTEGER DEFAULT NULL,
        `updated_at` INTEGER DEFAULT NULL) ")->exec();

    if (stringp(res))
    {
        env("CACHE_DATA", 0);
    }

    return res;
}

mixed insert(object user, int last_touched)
{
    mixed res;
    mapping my = user->query_entire_dbase();
    string master = mapp(my["family"]) ? my["family"]["master_name"] : "";
    int kill = 0, die = 0;

    if (mapp(my["combat"]))
    {
        kill = my["combat"]["MKS"] + my["combat"]["PKS"];
        die = my["combat"]["dietimes"];
    }

    res = db->table("users")->insert(([
        "id"         : my["id"],
        "name"       : my["name"],
        "title"      : my["title"],
        "mobile"     : my["mobile"],
        "age"        : my["age"],
        "qi"         : my["max_qi"],
        "jing"       : my["max_jing"],
        "neili"      : my["max_neili"],
        "jingli"     : my["max_jingli"],
        "combat_exp" : my["combat_exp"],
        "master"     : master,
        "kill"       : kill,
        "die"        : die,
        "updated_at" : last_touched,
    ]));

    return res;
}

mixed update(object user)
{
    mixed res;
    mapping my = user->query_entire_dbase();
    string master = mapp(my["family"]) ? my["family"]["master_name"] || "" : "";
    int kill = 0, die = 0;

    if (mapp(my["combat"]))
    {
        kill = my["combat"]["MKS"] + my["combat"]["PKS"];
        die = my["combat"]["dietimes"];
    }

    res = db->table("users")->where("id", my["id"])->update(([
        "name"       : my["name"],
        "title"      : my["title"],
        "mobile"     : my["mobile"],
        "age"        : my["age"],
        "qi"         : my["max_qi"],
        "jing"       : my["max_jing"],
        "neili"      : my["max_neili"],
        "jingli"     : my["max_jingli"],
        "combat_exp" : my["combat_exp"],
        "master"     : master,
        "kill"       : kill,
        "die"        : die,
        "updated_at" : time(),
    ]));

    return res;
}

mixed delete(object user)
{
    mixed res;

    res = db->table("users")->where("id", user->query("id"))->delete ();

    return res;
}
#endif
```

任何文件都可以单独存档，实现也非常简单，调用`save_object()`方法即可，如`save_object(__FILE__)`存档到同名文件中。

```c
inherit F_DBASE;

int main(object me, string arg)
{
    set(me->query("id"), me->query_entire_dbase());
    save_object(__FILE__);

    return 1;
}
```

