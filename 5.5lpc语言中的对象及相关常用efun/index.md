# 5.5LPC语言中的对象及相关常用Efun


# 5.5 LPC语言中的对象及相关常用Efun

我们已经知道在LPC中所有载入驱动程序的 `.c` 文件都是对象，所有对象中都可以存在以下 apply 方法：clean_up、create、heart_beat、id、init、move_or_destruct、reset，如果存在，这些方法会在特定条件下自动执行。如 `heart_beat()` 方法会在对象设置心跳后自动定期执行，`create()` 会在对象初始化时自动执行，`move_or_destruct` 会在对象环境要被摧毁时自动执行。具体用法后续章节细说，这里先大致了解一下即可。

另外对象中有几种特殊的存在：模拟外部函数对象、主控对象、玩家对象和生物对象。

## 5.5.1 模拟外部函数对象

模拟外部函数对象是 mudlib 中必须存在的，文件位置在运行时配置文件中指定，本教程的 mudlib 中模拟外部函数对象是 `/system/kernel/simul_efun`，这个对象的作用上一章已经讲解。



## 5.5.2 主控对象

主控对象也被成为主宰对象，也是 mudlib 中必须存在的，文件位置也通过运行时配置文件指定，本教程 mudlib 中主控对象是 `/system/kernel/master`，这个对象中存在最多的 apply 方法，提供系统核心服务，如果没有游戏也就废了。主要 apply 方法如下： author_file、compile_object、connect、crash、creator_file、domain_file、epilog、error_handler、flag、get_bb_uid、get_include_path、get_root_uid、log_error、object_name、preload、valid_bind、valid_database、valid_hide、valid_link、valid_object、valid_override、valid_read、valid_seteuid、valid_shadow、valid_socket、valid_write。上一章已经讲解了其中的 `valid_override()` 方法，其它方法会在后续章节讲解，这里先大致了解即可。



## 5.5.3 玩家对象

玩家对象就是通过客户端连线的对象，玩家对象中也有一些特殊的 apply 方法，如： logon、net_dead、process_input、receive_message、receive_snoop、write_prompt。这些 apply 方法的具体用法一样会在后续章节讲解。这里先补充几个玩家对象相关的外部函数：this_player()、interactive()、users()、userp()，他们的用法具体如下：

> 名称

```
this_player() | this_user() - 返回当前玩家对象
```

> 语法

```
object this_player( int flag );
object this_user( int flag );
```

> 描述

```
返回呼叫当前函数的玩家对象。需要注意的是：即使是从玩家对象本身呼叫 this_player() 和 this_object()，返回值也可能不同。如果使用 this_player(1)，返回呼叫此函数的玩家对象在某些情况下返回值和使用 this_player() 不同（比如系统管理员使用 command() 函数强制玩家使用指令时）。
```

------

> 名称

```
interactive() - 判断指定对象是否为可互动的（interactive）玩家
```

> 语法

```
int interactive( object ob );
```

> 描述

```
如果 `ob` 是在线玩家返回非零值，如果是断线玩家或非玩家对象返回 0。
```

------

> 名称

```
users() - 返回包括所有互动玩家的对象数组
```

> 语法

```
object *users( void );
```

> 描述

```
返回包括所有互动玩家的对象数组，注意不包括断线的玩家。
```

------

> 名称

```
userp() - 判断指定对象是否曾为可互动的（interactive）
```

> 语法

```
int userp( object arg);
```

> 描述

```
如果 `arg` 曾经是玩家，返回 1。
```

以上外部函数大家可以自己写代码测试，教程提供的 mudlib 中实现了 `users()` 外部函数的同名指令 `users` ，可以直接输入这个指令查看在线玩家对象列表。

### 生物对象

生物对象是指可以使用命令的对象，表现出活着（living）的特性，所有玩家对象也必须是生物对象。在游戏中判断的依据是如果一个对象呼叫了 `enable_commands()` 外部函数，这个对象就活了，然后就可以添加指令和使用命令。和生物对象相关的外部函数：enable_commands()、disable_commands()、add_action()、living()、livings()、set_living_name()、named_livings()、find_living() 和 find_player()。

> 名称

```
enable_commands() - 允许对象使用玩家命令
```

> 语法

```
已弃用:
void enable_commands( void );

从 FluffOS 3.0-alpha7.1 开始:
void enable_commands( int setup_actions = 0 );
```

> 描述

```
enable_commands() 把 this_object() 标记为活的（living）对象（生物），并允许对象通过 command() 外部函数使用由 add_action() 外部函数增加的命令。当对象调用 enable_commands() 函数后，系统驱动（driver）还会在对象中寻找 catch_tell() 方法，如果找到，每次有消息发给对象（如通过外部函数 say()）时都会调用 catch_tell() 方法。(仅针对非玩家生物)。从 FluffOS  3.0-alpha7 开始，本函数接受整型参数，默认值为0，作用和旧版一样，仅仅是启用命令，但不设置动作。如果参数 setup_actions > 0，驱动会调用对象所在环境及环境中所有中所有对象的 init() 方法。
```

------

> 名称

```
disable_commands() - 让一个活的（living）对象变成非活的（non-living）
```

> 语法

```
int disable_commands( void );
```

> 描述

```
让一个活着的对象变成非活着的状态，也就是说：add_action() 无效，living() 返回值为0，而且，如果对象是玩家，将变的无法使用任何指令（input_to()依然可用）。调用 disable_commands() 函数还有一个附加效果是清理掉此对象的所有行为指令，包括此对象本身定义的和来自其它对象的。
```

------

> 名称

```
living() - 检测给定对象是否是活的（living）
```

> 语法

```
int living( object ob );
```

> 描述

```
如果对象 `ob` 是活的（living）返回 1。关于 living 的定义：如果一个对象呼叫了 `enable_commands()` 外部函数，这个对象就活了。
```

------

> 名称

```
livings() - 返回一个包括所有活着的(living)对象的数组
```

> 语法

```
object *livings( void );
```

> 描述

```
返回一个包括所有活着的对象指针的数组。关于什么对象算活的请看 living() 外部函数中的说明。
```

------

> 名称

```
set_living_name() - 为一个生物设置一个名字
```

> 语法

```
void set_living_name( string name );
```

> 描述

```
为一个生物设置名字，设置后可以使用 find_living() 外部函数找到这个对象。
```

------

> 名称

```
named_livings() - 返回所有已取名的生物对象
```

> 语法

```
object *named_livings();
```

> 描述

```
返回游戏中所有呼叫过 enable_commands() 和 set_living_name() 外部函数的对象的数组。
```

------

> 名称

```
find_living() - 查找与给定名字匹配的生物
```

> 语法

```
object find_living( string str );
```

> 描述

```
首先查找标记为“活的”对象（即生物），然后查找ID `str`。生物是曾经呼叫过 enable_commands() 外部函数的对象，而且必须使用 set_living_name() 外部函数设置了名字，这些生物的名字会被存入 hash 表方便快速搜索。
```

------

> 名称

```
find_player() - 通过名字查找游戏玩家
```

> 语法

```
object find_player( string str );
```

> 描述

```
和 find_living() 外部函数功能类似, 只是仅从玩家(interactive)或曾经是玩家的对象中寻找。
```

关于指令系统 add_action() 相关的使用需要结合 apply 方法 init() 会在后续章节专门讲解。对其它外部函数，为方便学习测试，本教程的 mudlib 中提供了指令 `enable_commands`、`disable_commands`、`livings`、`set_living_name`、`named_livings`、`find_living` 和 `find_player`，请自己直接使用这些指令测试功能。比如：`enable_commands /cmds/test/test` 直接让 `/cmds/test/test` 对象变成生物；`set_living_name /cmds/test/test test` 设置生物 `/cmds/test/test` 的名字为 `test`；`find_living test` 可以寻找名称为 `test` 的生物对象。

### 对象的加载

所有对象都需要由驱动程序编译并载入到游戏中。可以通过以下5中方式载入对象到游戏环境：

1. load_object(filename) - 只载入原始对象
2. find_object(filename, 1) - 结果同上
3. new(filename, ...) - 载入原始对象(如果未被载入)，并从原始对象复制一份出来，产生一个复制对象
4. clone_object(filename, ...) - 结果同上
5. call_other(filename, func, ...) 或 filename->func() - 与 1, 2 相同, 但载入或寻找到原始对象后，会立即呼叫该对象的方法 `func`, 使用 call_other(filename, "???") 或是在 ??? 处填入任意不存在的方法名称，则只会载入对象，亦即与 1, 2 结果相同，值得注意的是，filename 必须是字符串型态才可进行载入对象的动作。

注：标出 ... 的部分目前不必理会，只需要知道该处可送入一群参数，也可以完全不需要送入参数，如 new("/obj/test")、new("/obj/test", 10)、new("/obj/test", 10, "abcd", 1234, "test")

以上外部函数用法如下：

> 名称

```
load_object() - 通过文件名查找或载入一个对象
```

> 语法

```
object load_object( string str );
```

> 描述

```
通过文件名 `str` 查找游戏对象并返回对象指针，如果文件存在但对象未载入，载入并返回对象指针。如果对象不存在，返回 0。
```

------

> 名称

```
find_object() - 通过文件名（file_name()）查找对象
```

> 语法

```
object find_object( string str );
object find_object( string str, int flag);
```

> 描述

```
通过文件名 `str` 查找游戏中已加载的对象。如果对象是复制对象，文件名可以通过 file_name() 外部函数取得。如果对象不存在或未载入游戏，返回 0，否则返回对象指针。如果可选参数 `flag` 为 1，此函数的效果等同于 load_object()。
```

------

> 名称

```
clone_object() - 加载一个对象的复制
```

> 语法

```
object clone_object( string name, mixed extra, ... );
object new( string name, mixed extra, ... );
```

> 描述

```
从文件 `name` 创建一个新的对象，并给予它一个唯一的编号（在文件名后附加#XXX，XXX是整个游戏中独一无二的数字编号）。如果系统中没有加载文件名为 `name` 的对象（称为蓝图对象），调用本函数时先载入蓝图对象然后再复制这个对象并返回复制的对象（驱动程序会给复制对象设置一个 O_CLONE 标志），复制对象和蓝图对象共享代码，但可以有不同的变量。如果指定额外参数 `extra`，会传给要加载的对象的 create() 方法。
```

------

> 名称

```
call_other() - 呼叫在其它对象中的函数（方法）
```

> 语法

```
unknown call_other( object ob, string func, ... );
unknown call_other( object ob, mixed *args);
unknown call_other( object *obs, string func, ... );
unknown call_other( object *obs, mixed *args );
```

> 描述

```
呼叫其它对象中的方法，因为返回值为调用方法的返回值，所以在编译阶段无法判断返回值的类型，最好在使用时做类型检查。字符串 `func` 是对象 `ob` 中被调用的方法名称，而第3、4……个等参数会做为第1、2……个参数按顺序传递给 `func`。

如果 call_other 函数第一个对象参数是数组，那么 call_other 会逐一呼叫它们的 `func`，返回值也是一个数组。

如果 call_other 函数的第二个参数是数组，那么数组的第一个元素必须是要调用的方法名字符串 `func` ,剩余的元素则是要传入方法的参数。
```

这里有一个使用 call_other() 更好的方式:

```
object ob | object *obs -> func ( ... );
```

如：

```
call_other(ob, "query", "name");
```

可以写成：

```
ob->query("name");
```

如果第二个参数使用数组，以上示例可以写成：

```
call_other(ob, ({ "query", "name" }));
```

而第一个参数是数组的示例如下：

```
users()->quit();
```

所有对象都必须先加载入游戏才能生效，我们使用任何指令时也都把这个指令对象载入了游戏，除了使用以上的外部函数加载对象外，我们还可以使用外部函数 `objects()` 获取所有已加载的对象，使用外部函数 `destruct()` 外部函数摧毁已加载对象，使用外部函数 `children()` 获取指定对象及其所有复制对象。具体用法如下：

> 名称

```
objects - 返回包含游戏已加载的所有对象的数组
```

> 语法

```
object *objects( void );
object *objects( string func, object ob );
object *objects( function f );
```

> 描述

```
返回 MUD 游戏中加载的所有对象的数组。请注意，如果系统设置的数组大小最大值太小，objects() 返回的数组会被截断到允许的最大值，这种情况下，返回值也没什么用处了。

如果指定可选参数 `func` 和 `ob`，所有已加载的对象都会作为参数呼叫 ob->func()，函数返回值为 0 的对象会被过滤掉。

第三种用法和第二种类似，只是参数改为函数指针。如：objects( (: clonep :) ) 返回游戏中所有复制对象的列表。
```

------

> 名称

```
destruct() - 从游戏中移除一个对象
```

> 语法

```
void destruct( object ob );
```

> 描述

```
从游戏中完全销毁并移除对象 `ob`。在呼叫 destruct() 后，如果对象是 this_object()，this_object() 的代码仍然会继续执行，但最好马上返回一个值，而且所有指向被销毁的对象的变量值都会变成 0。

即将被销毁的对象的所有内容对象都会呼叫自己的 move_or_destruct() 方法，如果呼叫 move_or_destruct() 方法的对象不把自己移到即将被销毁的对象外，也会被一起销毁。
```

------

> 名称

```
children() - 返回包含指定对象的所有复制对象的数组
```

> 语法

```
object *children( string name );
```

> 描述

```
这个外部函数返回一个文件名为 `name` 的对象及其所有复制对象组成的数组。
```

一个使用 children() 的示例是查找所有玩家对象：

```
object *list;
list = children("/system/object/user");
```

这让你能找到所有玩家对象（包括在线玩家和断线玩家，而 users() 外部函数仅报告在线玩家）。

以上几个外部函数在本教程中也提供了同名指令 `new`、`objects`、`destruct`、`children` 可用，可以自己直接使用指令测试相应的功能。

