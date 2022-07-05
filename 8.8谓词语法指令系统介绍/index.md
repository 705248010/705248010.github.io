# 8.8谓词语法指令系统介绍


# 8.8 谓词(verb)语法指令系统介绍

除了介绍的通过`enable_commands();add_action("command_hook", "", 1);`实现的action指令系统外，游戏驱动还提供了一套完整的谓词(verb)指令系统，这是一套规范而强大的自然语言解析器。

## 简介

关于谓词指令系统，自然语言解析是它的优势，但不是唯一的作用，对国内MUD，很多指令没有严格按英文语法规范，自然语言解析显的有一些鸡肋，但并不能因此而否定这种指令实现方式，严格的说，自然语言分析只是它的功能之一，它的核心功能还是**提供了一套标准的指令系统，内置验证规则和别名功能，规范了指令接口**（但也因此，让代码实现变的复杂很多，具体在游戏开发中是否使用看开发者自己的选择，这里只是全面的介绍相关知识）。

比如战斗指令，如果用action系统实现，代码类似这样：

```c
int main(object me, string arg)
{
    object ob;

    if (!me->can_fight())
    {
        return notify_fail("你还没有学会战斗。\n");
    }
    if (file_name(environment(me)) == START_ROOM)
    {
        return notify_fail("这里禁止战斗。\n");
    }
    if (!arg || !objectp(ob = present(arg, environment(me))))
    {
        return notify_fail("你想攻击谁？\n");
    }
    if (ob == me)
    {
        return notify_fail("你不能攻击自己。\n");
    }
    if (!ob->can_fight())
    {
        return notify_fail("对方还不会战斗。\n");
    }
    if (ob->is_fighting(me))
    {
        return notify_fail("加油！加油！加油！\n");
    }

    msg("warning", "$ME大喝一声，对$YOU发起了攻击。", me, ob);
    me->fight(ob);

    return 1;
}
```

但用verb系统实现，代码类似这样：

```c
protected void create()
{
    verb::create();
    setVerb("fight");
    setSynonyms("kill", "hit");
    setRules("LIV");
    setErrorMessage("你想和谁战斗？");
}

mixed can_fight_liv(mixed *data...)
{
    object me = this_player();
    // debug(sprintf("%O", data));
    if (file_name(environment(me)) == START_ROOM)
    {
        return "这里禁止战斗。";
    }
    return me->can_fight() || HIY "你无法战斗。" NOR;
}

mixed direct_fight_liv(object ob, string arg)
{
    if (ob == this_player())
        return HIM "你真有想法，可惜你做不到自己和自己战斗。" NOR;
    return ob->can_fight();
}

int do_fight_liv(object ob, string arg)
{
    object me = this_player();

    msg("warning", "$ME大喝一声，对$YOU发起了攻击。", me, ob);
    me->fight(ob);

    return 1;
}
```

action指令只是要求成功返回1，失败返回0，具体代码功能没有任何要求，而verb指令自带规则和业务逻辑，提供了一系列的apply方法：`can_*()`、`direct_*()`、`indirect_*()`、`do_*()`，自动调用做权限校验和执行。如上指令：设置了指令名称为`fight`，别名为`kill`和`hit`，目标对象限制为生物(`LIV`)。当`fight ob`时，系统会自动查找生物`ob`，不需要写代码判断对象是否是生物，同时也会自动调用`can_fight_liv`方法判断玩家是否可以战斗，调用`direct_fight_liv`方法判断是否允许和目标对象战斗，然后调用`do_fight_liv`方法战斗。

## 功能实现

下面我们具体讲解代码实现。我们以`look`指令为列，玩家可能有以下的行为：

```
look sb
look at sb
look in sth
look on sth
look sb on sth
look sth in sth
```

在我们的指令模式下，需要用`sscanf()`处理玩家的输入，然后做判断并处理，这套实现方式大家都很熟悉了，看起来简单，但并不灵活，得在代码实现所有可能的匹配。而使用谓词系统，我们有不一样的实现方式，它更灵活，更强大（嗯……代码写的也会更麻烦）。

在我们自然语言中分分主谓宾定状补等，在游戏指令中我们主语就是指令的执行者，也就是玩家自己，直接省略，核心就是谓语verb和宾语（动作对象），另外还有介词修饰。如`look at sb`，谓词`look`，介词`at`,对象宾语`sb`，而宾语对象在某些指令中还分直接对象(the direct object)和间接对象(the indirect object)，如`read page in book`，直接对象是`page`，间接对象是`book`，从语义上理解你要读的是`page`，不是`book`（不过MudOS并不是根据真实语义来的，而是简单的优化为指令中第一个标记是直接对象，第二个标记是间接对象）。

在游戏开发中我们要实现的除了主语对象（玩家）、宾语对象（指令目标）外，重点是需要实现指令对象(the verb handler)，另外还有主控对象(master ob)提供必要的apply方法。除主控对象外，所有需要调用`verb`的对象都必须调用`parse_init()`方法初始化。

### 指令规则

指令系统的谓词和规则通过`parse_add_rule`外部函数增加在指令对象中，如：

```c
parse_add_rule("look", ""); // 不指定目标
parse_add_rule("look", "STR"); // 查看字符串目标
parse_add_rule("look", "OBJ"); // 查看对象目标
parse_add_rule("look", "on OBJ"); 
parse_add_rule("look", "at OBJ"); 
parse_add_rule("look", "in OBJ"); 
parse_add_rule("look", "OBJ in OBJ"); 
parse_add_rule("look", "at OBJ on OBJ"); 
parse_add_rule("look", "at STR on OBJ"); 
```

以上规则中的大写字母`OBJ`和`STR`是驱动语法限定的标记(`token`)，可用`token`有：

```
LIV - one living thing
LVS - one or more living things
OBJ - one object
OBS - one or more objects
STR - a string of characters
WRD - a generic thing that may be a string, object, or living thing
```

请注意：`LIV`和`LVS`是根据对象的apply方法`is_living`判断的(1是0否)。在一条规则中不要超过2个标记，且只能存在1个复数标记。

那么，系统是怎么自动找到对象的呢？在action指令系统中我们输入`look sb`，需要在代码中使用`present()`函数查找id为sb的对象并返回，这里重点是要提供一个apply方法`int id(string id)`，同样，verb系统中要提供一个apply方法`string *parse_command_id_list()`，系统自动根据这个查找对象`sb`，只是我们在指令中不需要再写代码查找对象。

需要注意的是，语法规则的介词（如`look a on b`中的`on`）并不是随意都可以，而是主控对象中的apply方法`parse_command_prepos_list()`限定，只能使用这个方法返回的数组中的介词。

### 指令别名

相对action指令系统别名功能需要自己实现，verb系统中这个是内置的功能，无需任何开发，使用非常容易，直接用`parse_add_synonym`为谓词指令增加同义词（别名），如`parse_add_synonym("kan", "l")`。

### 标准接口方法

在action指令中，具体的功能完全由开发者发挥，但分析所有指令，都有一个基本的内在逻辑：1.判断，2.执行。判断包括判断对象是否存在，是否有权限等等，只是有的指令不需要条件判断，只用执行。

而在谓词指令系统中，这些逻辑被具体为`can_*()`和`do_*()`这二类apply方法，实现指令权限的校验和执行指令的操作内容。相关方法即可以实现在玩家对象中，也可以实现在指令对象中，优先调用玩家对象中的方法，不存在时再调用指令对象中的方法。另外还可以在指令目标对象中实现`direct_*`和`indirect_*`这二种apply方法做相关权限处理。

这里`*`代表具体`verb`指令的`rule`，根据不同指令和规则自动替换，如：`can_look`、`can_look_at_obj`、`do_look_at_obs_in_obj`等，最基础的通用方法是`xxx_verb_rule`，如：`can_verb_rule`。

关于以上方法的调用，我们以玩家输入`look xxx`为例看看执行的顺序：

1. 调用玩家对象中的 `can_*()`，如果找不到，调用指令对象中的`can_*()`
2. 调用目标对象中的 `direct_*()`,如果找不到，调用指令对象中的`direct_*()`
3. 调用指令对象中的 `do_*()`

请注意：以上几个方法执行都是前面的成功才会继续执行后面的。

如果只是使用`look`没有具体对象，不会调用`direct_*()`方法，而如果是`look x in y`，除了调用对象x中的`direct_*()`方法还会调用对象y中的`indirect_*()`方法。方法后缀`*`是有多种写法的，如果一个不存再，继续调用另一个，具体看下图。

`look box`示例：

![file](https://api.mud.ren/storage/uploads/2022/05/10/0a9b43b1a23b0c82b212cd3fc64fa176.png)

`look in box`示例：

![file](https://api.mud.ren/storage/uploads/2022/05/10/5b8b1ddcda1b8c557997d8214af0d6fc.png)

`look at gold in box`示例：

![file](https://api.mud.ren/storage/uploads/2022/05/10/613d4430ac149dd1ac65b8a38b5b3091.png)

> 这里比较奇怪，为什么`direct_*()`和`indirect_*()`调用了二次？

需要注意的是，对复数标记规则的`can_*`方法一样是使用单数apply方法，而复数标记规则的`do_*`方法是使用复数形式。

另外，自然语法中针对容器有以下二种常用情况：`look in sth`和`get all from sth`，驱动内置了二个apply方法来控制对象是否可见和是否有权访问：

1. inventory_accessible()
2. inventory_visible()

比如，对一个上锁的箱子，是即不能`look in`也不能`get from`，而对一个上锁的透明玻璃盒子，你可以`look in`但不能`get from`。

### 功能接入

上面介绍了指令需要实现的方法，但怎么使用呢？需要通过`parse_sentence()`方法。

玩家对象在执行指令时会调用`parse_sentence()`外部函数做语法解析。和`add_action()`执行指令类似，`parse_sentence()`在执行后也会返回不同的结果：

```
1   谓词指令执行成功
0   未找到谓词指令
-1  语法规则不匹配
-2  语法规则匹配，但是无权执行
字符串 语法规则匹配但执行失败的原因（如：目标不对）
```

需要注意的是，执行错误字符串是主控对象中的apply方法`parser_error_message`返回的错误内容。

提示：`mixed parse_sentence(string cmd, int flag)`方法第二个参数`flag`为1则开始调试模式，会显示verb查找顺序。

> 更多资料参考：https://bbs.mud.ren/threads/188

因为游戏开发中我们可以verb指令和action指令系统结合使用，如果我们可以直接把`parse_sentence()`写在apply方法`process_input`或action指令系统的`command_hook`中。

------

## 具体示例

现在我们把上面介绍的理论转为实操，看看怎么开发verb指令功能。在最新的LPC-TEST项目中，已经把`look`、`go`和`fight`使用verb指令系统实现，指令在`/verbs/`目录中，这里根据项目做介绍。

### 指令入口

在动作(action)指令系统教程中我们介绍过动作指令系统的入口是`add_action()`，谓词(verb)指令系统的入口是`parse_sentence()`，我们改造`command_hook()`函数，当动作指令执行失败时调用`parse_sentence()`来使用verb指令：

```c
    if (cmd_ob = load_object(cmd))
    {
        return (int)cmd_ob->main(me, arg);
    }
    else
    {
        mixed err = parse_sentence(arg ? verb + " " + arg : verb, 0);
        if (intp(err))
        {
            switch (err)
            {
            case 1: // verb 匹配成功
                return 1;
            default:
                return 0;
            }
        }
        return notify_fail(err);
    }
```

### 配置MASTER_OB的apply方法

谓词指令系统因为语义灵活，更类似自然语言，指令包括谓语、宾语，还有介词和形容词等，系统可以根据玩家的输入自动解析。这些需要在MASTER_OB中增加一些apply方法做配置，这些配置对中文MUD意义不大，只是其中的`parse_command_prepos_list`限制指令可用介词得正确配置，另外`parser_error_message`返回错误也得根据自己需要返回。

```c
#include <parser_error.h>

string *parse_command_id_list()
{
    return ({"thing"});
}

string *parse_command_adjective_id_list()
{
    return ({"the", "a", "an"});
}

string *parse_command_plural_id_list()
{
    return ({"things", "them", "everything"});
}

string *parse_command_prepos_list()
{
    return ({"in", "on", "at", "by", "under", "behind", "with", "into", "onto", "inside", "within", "from"});
}

string parse_command_all_word()
{
    return "all";
}

object *parse_command_users()
{
    return users();
}

string parser_error_message(int type, object ob, mixed arg, int flag)
{
    switch (type)
    {
    case ERR_NOT_LIVING:
        return sprintf("%s 不是生物。\n", arg);
    case ERR_THERE_IS_NO:
        return sprintf("这里没有 %s 。\n", arg);
    case ERR_ALLOCATED:
        return sprintf("%s\n", arg);
    case ERR_IS_NOT:
    case ERR_NOT_ACCESSIBLE:
    case ERR_AMBIG:
    case ERR_ORDINAL:
    case ERR_BAD_MULTIPLE:
    case ERR_MANY_PATHS:
    default:
        return sprintf("parser_error_message : type = %d, ob = %O, arg = %O, flag = %d\n", type, ob, arg, flag);
    }
}

void parseRefresh() { parse_refresh(); }
```

以上最核心的二个方法是`parse_command_prepos_list`和`parser_error_message`，前者指定了允许使用的介词，后者指定了在指令错误时返回的错误提示。

### 配置对象apply方法

在指令规则中可以指定宾语是STR/OBJ/LIV等，如果是STR很好理解，如果是OBJ和LIV有什么不同呢？对谓词指令系统中如果规则是OBJ，会自动返回对象，而不需要使用`present(str)`来查找，但类似`present(str)`需要实现`id()`方法指定返回的对象，需要使用`parse_command_id_list()`方法来返回对象，而对LIV还需要增加`int is_living() { return 1; }`方法来确认对象是生物，具体代码实现请参考lpc-test项目的`/inherit/living.c`和`/inherit/object.c`。

### 封装VERB基础方法

另外，所有对象要使用谓词指令功能必须先调用`parse_init();`做初始化，这里我们实现一个`VERB`模块类来封装相关功能并完成初始化，所有需要使用指令的生物继承这个类。具体代码见`/inherit/verb.c`:

```c
// Parser 指令公共方法
private nosave string Verb, ErrorMessage;
private nosave string *Synonyms, *Rules;

protected void create()
{
    parse_init();
    Verb = 0;
    ErrorMessage = 0;
    Rules = ({});
    Synonyms = ({});
}

protected string setErrorMessage(string str) { return (ErrorMessage = str); }

string getErrorMessage() { return ErrorMessage; }

varargs protected string *setRules(mixed *args...)
{
    if (sizeof(Rules))
        error("Cannot reset rules list.");
    foreach (mixed arg in args)
    {
        if (stringp(arg))
            Rules += ({arg});
        else
            Rules += arg;
    }
    if (Verb)
    {
        foreach (string rule in Rules)
            parse_add_rule(Verb, rule);
        if (sizeof(Synonyms))
            foreach (string cmd in Synonyms)
                parse_add_synonym(cmd, Verb);
    }
    return Rules;
}

string *getRules() { return copy(Rules); }

varargs protected string *setSynonyms(mixed *args...)
{
    if (sizeof(Synonyms))
        error("Cannot reset synonym list.\n");
    foreach (mixed arg in args)
    {
        if (stringp(arg))
            Synonyms += ({arg});
        else
            Synonyms += arg;
    }
    if (Verb && sizeof(Rules))
        foreach (string cmd in Synonyms)
            parse_add_synonym(cmd, Verb);
    return Synonyms;
}

string *getSynonyms() { return copy(Synonyms); }

protected string setVerb(string str)
{
    if (!stringp(str))
        error("Bad argument 1 to setVerb().\n");
    Verb = str;
    if (sizeof(Rules))
        foreach (string rule in Rules)
            parse_add_rule(Verb, rule);
    if (sizeof(Synonyms))
        foreach (string cmd in Synonyms)
            parse_add_synonym(cmd, Verb);
    return Verb;
}

string getVerb() { return Verb; }

string *getVerbs() { return ({Verb}); }
```

系统相关功能接入后，就可以直接和cmd指令一样写verb指令了，根据需要随意增加。

### 具体指令示例

现在回去看看文章最开头的`fight`指令示例，应该很容易理解了，这里再实现一个更复杂的`look`指令。

现在看看`look`指令的代码`/verbs/look.c`：

```c
inherit VERB;

#include <ansi.h>

int look_room(object me, object env);
string desc_of_objects(object *obs);
string list_all_inventory_of_object(object me, object env);
int look_living(object me, object ob);

protected void create()
{
    verb::create();
    setVerb("look");
    setSynonyms("l");
    setRules("", "STR", "OBJ", "at STR", "at OBJ", "on OBJ", "in OBJ", "inside OBJ",
             "at OBJ in OBJ", "OBJ inside OBJ", "at OBJ on OBJ", "at STR on OBJ");
    setErrorMessage("你想看什么?");
}

mixed can_look()
{
    object env = environment(this_player());
    if (!env || !env->query("short") && !env->is_area())
        return "你的四周灰蒙蒙地一片，什么也没有。";
    else
        return 1;
}

mixed can_verb_rule(mixed *data...)
{
    // debug_message(sprintf("can_verb_rule : %O", data));
    return can_look();
}

mixed can_verb_word_str(mixed *data...)
{
    // debug_message(sprintf("can_verb_word_str : %O", data));
    return can_look();
}

mixed direct_look_obj(object ob, string id)
{
    return environment(this_player()) == environment(ob);
}

mixed direct_verb_rule(mixed *data...)
{
    // debug_message(sprintf("direct_verb_rule : %O", data));
    return can_look();
}

mixed direct_verb_word_obj(mixed *data...)
{
    // debug_message(sprintf("direct_verb_word_obj : %O", data));
    return can_look();
}

mixed do_look()
{
    object me = this_player();
    object env = environment(me);

    return look_room(me, env);
}

mixed do_look_at_obj(object ob)
{
    object me = this_player();

    if (living(ob))
    {
        look_living(me, ob);
    }
    else
    {
        printf("%s\n", ob->long());
    }

    return 1;
}

mixed do_look_at_obj_in_obj(object ob1, object ob2, string id1, string id2)
{
    printf("%s\n", ob1->long());
    return 1;
}

mixed do_look_obj(object ob)
{
    return do_look_at_obj(ob);
}

mixed do_look_in_obj(object ob)
{
    if (sizeof(all_inventory(ob)))
    {
        debug(sprintf("%s里有:\n%s", ob->short(), list_all_inventory_of_object(ob, ob)));
    }
    else
    {
        debug(sprintf("%s里什么也没有。", ob->short()));
    }

    return 1;
}

mixed do_look_at_str(string str, string arg)
{
    object me = this_player();
    object env = environment(me);
    mapping exits = env->query("exits");
    object ob;
    mixed item_desc;

    if (str == "here")
    {
        return do_look();
    }
    else if (stringp(exits[str]))
        return look_room(me, load_object(exits[str]));
    else if (mapp(exits[str]))
        debug("此方向是区域环境，无法观察。");
    else if (item_desc = env->query("items/" + str))
        debug(evaluate(item_desc));
    else if (ob = present(arg, env))
        return do_look_obj(ob);
    else
        debug(getErrorMessage());

    return 1;
}

mixed do_look_str(string str, string arg)
{
    return do_look_at_str(str, arg);
}

mixed do_verb_rule(mixed *data...)
{
    debug(sprintf("do_verb_rule : %O", data));
    return 1;
}

// 查看环境(此方法推荐放在环境中)
int look_room(object me, object env)
{
    string str, *dirs;
    mapping exits;

    if (env->is_area())
    {
        return env->do_look(me);
    }

    str = sprintf(HIC + "%s" + NOR + " <%s>\n%s" + NOR,
                  env->query("short"), file_name(env), env->query("long"));

    if (mapp(exits = env->query("exits")))
    {
        dirs = keys(exits);

        if (sizeof(dirs) == 0)
            str += "    这里没有任何明显的出路。\n";
        else if (sizeof(dirs) == 1)
            str += "    这里唯一的出口是 " + BOLD + dirs[0] + NOR + "。\n";
        else
            str += sprintf("    这里明显的出口是 " + BOLD + "%s" + NOR + " 和 " + BOLD + "%s" + NOR + "。\n",
                           implode(dirs[0..sizeof(dirs)-2], "、"), dirs[sizeof(dirs) - 1]);
    }
    else
    {
        str += "    这里没有任何出路。\n";
    }
    str += list_all_inventory_of_object(me, env);
    tell_object(me, str);
    return 1;
}

string desc_of_objects(object *obs)
{
    int i;
    string str;
    mapping list, unit;
    string short_name;
    string *ob;

    if (obs && sizeof(obs) > 0)
    {
        str = "";
        list = ([]);
        unit = ([]);

        for (i = 0; i < sizeof(obs); i++)
        {
            short_name = obs[i]->short();

            list[short_name] += obs[i]->query_temp("amount") ? obs[i]->query_temp("amount") : 1;
            unit[short_name] = obs[i]->query("unit") ? obs[i]->query("unit") : "个";
        }

        ob = sort_array(keys(list), 1);
        for (i = 0; i < sizeof(ob); i++)
        {
            str += "  ";
            if (list[ob[i]] > 1)
                str += list[ob[i]] + unit[ob[i]] + ob[i] + "\n";
            else
                str += ob[i] + "\n";
        }
        return str;
    }

    return "";
}

string list_all_inventory_of_object(object me, object env)
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

int look_living(object me, object ob)
{
    string msg;
    string line = repeat_string("-*-", 12) + "\n";

    if (ob != this_player())
    {
        msg = "$ME看了看$YOU，好像对$YOU很感兴趣对样子。";
        msg("vision", msg, me, ob);
    }
    msg = sprintf("%s 是一位 %d 级的%s性生物。\n", ob->short(), ob->query("lv"), ob->query("gender") || "??");
    msg += line;
    msg += sprintf("  %-36s\n", "ＨＰ：" + ob->query("hp") + " / " + ob->query("max_hp"));
    msg += sprintf("  %-12s%-12s%-12s\n", "力量：" + ob->query("str"), "敏捷：" + ob->query("agi"), "防御：" + ob->query("def"));
    msg += line;
    tell_object(me, msg);

    return 1;
}

int help(object me)
{
    write(@HELP
指令格式 : look ｜ l

最基本的look指令，让你睁眼看世界，可以查看对象了解信息。

当存在多个同名对象时，比如有4个NPC，你要查看指定对象可以使用以下格式：

    l 1st n 或 l n 1
    l 2nd n 或 l n 2
    l 3rd n 或 l n 3
    l 4th n 或 l n 4

HELP );
    return 1;
}
```

代码看起来很复杂，但很合理，通过`can_*`方法判断有没有权限使用`look`指令，通过`direct_*`和`indirect_*`方法判断对象让不让你看，通过`do_*`方法执行查看，而且这个判断不只是判断`look`指令中的方法，还会判断玩家对象和目前对象的相关方法，这样可以非常灵活的实现功能，比如：有一个特别的对象需要特别条件才能查看，只需要在这个对象中实现一个`indirect_*`方法处理权限，而不需要对`look`指令做任何修改，这样比使用action指令系统把所有处理都放在look指令中让look指令变的超级复杂要更好。

使用verb指令系统对多个对象，可以使用`1st、2nd、3rt、4th`来指定序号，类似`present`方法的`id n`，当然，你也可以在指令的STR规则中增加`present`方法实现`id n`的序号查找方式。

------

### 补充说明

规则还支持以下格式：TOKEN:xyz，如：`at OBJ:v in OBJ`，这里`xyz`必须是以下值：

- l - must be living
- v - need not be accessible (visible only)

> "OBJ:l" is the same as "LIV", and "LIV:v" is someone you can see.

另外补充说明TOKEN中WRD和STR的一个重要区别，WRD只能匹配单个单词。

