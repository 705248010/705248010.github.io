# 5.2LPC语言的环境和内容物


# 5.2 LPC语言的环境和内容物

为了后续章节内容的讲解，这里补充一下环境的概念，什么是环境（environment）？什么是内容物（inventory）？

在 LPC 的世界里，大多数对象均有一个环境，而该环境的内容物即包含在环境中的对象。举一个简单的例子，玩家 player A、player B 目前站在一个房间 room A ，而此房间放置了一个物品 item A ，那么 player A、player B 及 item A 均为 room A 的内容物，相对的 room A 为 player A、player B 及 item A 的环境。实际状况如图所示:

```
                room A
            ┌——————————————┐
            │              │
            │    item A    │
            │ player A   ○ │
            │   ☆          │
            │              │
            │   player B   │
            │       ☆      │
            │              │
            │              │
            └——————————————┘
```

**任何对象均能被当作其它对象的环境**，我们可以将任何对象视为一个容器，如 player A 将 item A 捡起，实际情形如下:

```
                room A
            ┌——————————————┐
            │   player A   │
            │ ┌————————┐   │
            │ │ ○item A│   │
            │ │        │   │
            │ └————————┘   │
            │   player B   │
            │ ┌—————————┐  │
            │ │         │  │
            │ └—————————┘  │
            └——————————————┘
```

此时，我们可以执行外部函数 environment(player A 或 player B) 来得到环境对象 room A，可以执行 environment(item A) 得到 player A，而透过执行 all_inventory(room A)，可以得到 player A 及 player B 的对象数组，要注意的是，这样无法取得 item A，除非执行了 all_inventory(player A) 或 deep_inventory(room A)。

这里补充几个新的外部函数的用法。



## 5.2.1 this_object()

### 名称

```
this_object() - 返回呼叫本函数的对象指针
```

### 语法

```
object this_object( void );
```

### 描述

```
返回当前对象的指针。
```



## 5.2.2 environment()

### 名称

```
environment() - 返回对象的环境
```

### 语法

```
object environment( void );
object environment( object ob );
```

### 描述

```
返回包含对象 `ob` 的对象(环境)，如果没有指定参数 `ob`，默认是 this_object()。如果对象 `ob` 不在任何环境里，返回 0。
```



## 5.2.3 all_inventory()

### 名称

```
all_inventory() - 返回一个对象中的所有内容对象（inventory）
```

### 语法

```
object *all_inventory( void );
object *all_inventory( object ob );
```

### 描述

```
返回在指定对象 `ob` 中的所有对象组成的数组。如果没有指定参数 `ob`，默认是 this_object()。
```



## 5.2.4 deep_inventory()

### 名称

```
deep_inventory() - 返回对象中所有嵌套对象清单的数组
```

### 语法

```
object *deep_inventory( void );
object *deep_inventory( object ob );
```

### 描述

```
返回对象 `ob` 中的所有对象及对象中的所有对象（层层递进查找，直到传回所有对象为止）的数组。如果没有指定参数 `ob`，默认是 this_object()。
```



## 5.2.5 first_inventory()

### 名称

```
first_inventory() - 返回一个对象中包含的第一个物品
```

### 语法

```
object first_inventory( void );
object first_inventory( mixed ob );
```

### 描述

```
返回对象 `ob` 内容物品中的第一个物品，参数 `ob` 既可以是对象类型也可以是字符串类型(对象的文件名)，如果没有指定参数 `ob`，默认是 this_object()。
```



## 5.2.6 next_inventory()

### 名称

```
next_inventory() - 返回和对象在相同环境中的后一个对象
```

### 语法

```
object next_inventory( void );
object next_inventory( object ob );
```

### 描述

```
返回和对象 `ob` 环境相同的后一个对象。如果没有指定参数 `ob`，默认是 this_object()。

先进入环境的对象顺序靠后，所以 next_inventory() 取得的是比指定对象先进入环境的对象，如果指定对象是第一个进入环境，哪怕环境中有其它对象进入返回值也是 0。
```



## 5.2.7 move_object()

在 LPC 游戏开发中和环境及内容对象相关的外部函数主要是以上这些，请注意：我们在第二章第二节介绍对象数据类型时说过**任何 .c 文件在游戏中都是一个对象**，而任何对象都可以做为环境，不管这个对象的功能是什么，哪怕一个文件的作用只是一个指令，甚至是一个没有任何代码的空的 .c 文件。在游戏开发中，我们需要限制对象的移动，不能进入不是环境的对象。对象的移动使用以下外部函数：

### 名称

```
move_object() - 移动当前对象到其他环境
```

### 语法

```
void move_object( mixed dest );
```

### 描述

```
移动当前对象到环境 `dest`，移动后会触发当前对象和目标环境及其中对象的 init() 方法。
```



## 5.2.8 示例

这里我们演示一个示例：

```c
// 示例：5.2.1.c
int main(object me, string arg)
{
    // 移动当前对象到指令 test 中
    move_object("/cmds/test/test");

    printf("当前对象所在环境：%O\n", environment());
    printf("当前玩家所在环境：%O\n", environment(me));

    // 移动当前对象到当前玩家所在环境中
    move_object(environment(me));

    printf("当前对象所在环境的所有对象：\n");
    foreach (object ob in all_inventory(environment()))
    {
        printf(" - %O\n", ob);
    }
    printf("当前对象所在环境中的第一个对象：%O\n", first_inventory(environment()));
    printf("当前对象所在环境的下一个对象：%O\n", next_inventory());

    // 移动当前对象到当前玩家中
    move_object(me);

    printf("当前玩家所在环境的所有对象：\n");
    foreach (object ob in all_inventory(environment(me)))
    {
        printf(" - %O\n", ob);
    }
    printf("当前玩家中的所有对象：\n");
    foreach (object ob in all_inventory(me))
    {
        printf(" - %O\n", ob);
    }
    printf("当前玩家所在环境的所有对象（包括玩家中的对象）：\n");
    foreach (object ob in deep_inventory(environment(me)))
    {
        printf(" - %O\n", ob);
    }
    printf("当前对象所在环境：%O\n", environment());

    return 1;
}
```

自己运行看看结果吧。需要再次强调的是 `next_inventory()` 这个外部函数，返回的是比指定对象先进入环境的对象。

为方便后期学习和测试，项目把以上外部函数实现了同名指令`environment`、`all_inventory`、`deep_inventory`、`first_inventory`、`next_inventory`、`move_object`，方便通过指令测试。前5个指令如果不指定参数为默认对象当前玩家，如 `environment` 显示当前玩家所在环境，如果指定参数请用具体对象文件名，如 `all_inventory /system/object/void` 为显示对象 `/system/object/void` 中的所有内容对象。使用 `move_object` 可以把任意对象移动到其它环境，如 `move_object /cmds/test/test` 移动当前玩家到 `/cmds/test/test` 中，`move_object /cmds/test/test to /system/object/void` 把对象 `/cmds/test/test` 移动到 `/system/object/void` 中。

