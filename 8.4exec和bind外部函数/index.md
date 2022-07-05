# 8.4exec和bind外部函数


# 8.4 exec 和 bind 外部函数

## exec 外部函数

玩家连接游戏时会触发主控对象中的 `connect()`，这个方法返回的对象就是玩家对象，但实际开发中我们通过 `connect()` 返回的对象处理登录，然后登录后再切换到正在的玩家对象。

玩家控制的对象可以使用 `exec()` 外部函数切换，我们看看本教程配套的源码。

主控对象中处理登录的代码：

```c
// 主控对象中的 connect 方法
object connect(int port)
{
    return new(LOGIN_OB);
}
```

连线对象(LOGIN_OB) `/system/object/login` 的代码：

```c
#define WELCOME "/README"

void setup(string arg)
{
    object from, to;

    if (!arg || arg == "")
    {
        write("ID不能为空，请重新输入：");
        input_to("setup");
    }
    else
    {
        from = this_object();
        to = new(USER_OB, arg);
        exec(to, from);
    }
}

void logon()
{
    write(read_file(WELCOME));
    write("请输入你的ID：");
    input_to("setup");
}
```

登录对象返回的时 LOGIN_OB，在 LOGIN_OB 中使用 `exec(to, from)` 把玩家对象从 LOGIN_OB 改为 USER_OB。外部函数 `exec()` 的语法说明如下：

> 名称

```
exec() - 把连线玩家从一个对象切换到另一个对象
```

> 语法

```
int exec( object to, object from );
```

> 描述

**这个外部函数允许把玩家连接从一个对象迁移到另一个对象。也就是说，在成功执行 exec(to, from) 后，interactive(to) 会返回 1，interactive(from) 会返回 0，控制 `from` 的玩家改为控制 `to`。如果切换成功 exec() 会返回 1，否则返回 0。**

请注意，这个外部函数的功能过于强大，为保证游戏安全，请谨慎使用。较为适合的限制使用 exec() 的方式是定义一个同名模拟外部函数(simul_efun)，并使用 valid_override() apply 方法来限制这个模拟外部函数的重写（efun::exec()）。

我们来测试一下，在 `/cmds/test/` 目录下新建测试对象 `test_user.c`，代码如下：

```c
// test_user
inherit USER_OB;

void create()
{
    enable_commands(0);
    add_action("command_hook", "", 1);
    seteuid("头号玩家");
    set_living_name("test_user");
}

int main(object me, string arg)
{
    if (me == this_object())
    {
        return notify_fail("你已经是头号玩家了。\n");
    }

    exec(this_object(), me);

    return 1;
}
```

先输入 `test_user`，会把自己切换到这个 `/cmds/test/test_user.c`，然后可以输入 `users` 指令看看当前在线玩家有什么变化。

在游戏中，可以使用这个功能附身NPC并控制NPC行动。



## bind 外部函数

我们知道，`move_object()` 外部函数是移动当前对象到指定位置，问题来了，如果要移动指定对象 `ob` 该怎么办？正常情况我们需要在对象 ob 中实现一个方法，比如：

```c
void move(mixed dest)
{
    move_object(dest);
}
```

然后通过 `ob->move(room)` 的方式移动对象。除了这种方式还能怎么办？我们看看本教程给的示例指令 `move_object`，其中有这样的代码：

```c
    fun = bind((: move_object :), ob1);
    evaluate(fun, ob2);
```

这里使用 `bind()` 外部函数定义了一个函数指针，以上代码的作用是把对象 `ob1` 绑定到外部函数 `move_object`，这样对 `move_object` 来说当前对象就是 `ob1`。外部函数 `bind()` 的语法说明如下：

> 名称

```
bind() - 改变一个函数指针的所属对象
```

> 语法

```
function bind(function f, object ob)
```

> 描述

**返回一个和函数指针 `f` 完全相同的函数指针，但是所属对象从创建 `f` 的对象变为 `ob`。这在函数 `f` 的创建者被摧毁或 `f` 是需要由其它对象调用的外部函数时非常有用。**

> 示例:

```c
void make_living(object ob)
{
    function f;

    f = bind((: enable_commands :), ob);

    evaluate(f);
}
```

以上示例的效果和由对象 `ob` 自己执行 enable_commands() 外部函数完全一样。因为 bind() 允许你强制其它对象执行一些代码，这会造成一些安全风险，为了防止被滥用，需要 MASTER 对象中的 valid_bind() apply 方法返回1，否则 bind() 无法执行。

在本教程中提供的测试指令中有不少指令使用了 `bind()` 外部函数实现功能，比如 `enable_commands`、`disable_commands`、`move_object`等。

对比以上内容，我们会发现 `exec` 和 `bind` 功能有一些神似的地方，一个切换连线玩家，一个切换函数执行对象。需要强调的是这二个外部函数的功能都很强大，在正式游戏开发中都需要做好安全审查。

另外，还有一个功能有一些类似的外部函数 `shadow`，具体用法在以后的章节讲解。

