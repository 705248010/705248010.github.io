# 6.1LPC语言中的函数指针


# 6.1 LPC语言中的函数指针

## 6.1.1 一般概念

> MudOS 有一种称为 `function` (函数指针) 的变量型态。这种型态的变量可以用来指向各种不同的函数。您也许早已熟悉把一个函数当作某些外部函数 (efuns) 参数。举例来说，像是过滤数组的外部函数。它读入一个数组，并经由一个函数过滤数组中的元素。让此函数传回非零值 (non-zero) 的元素就保留下来，结果传回一个新的数组。传统上，这样做要传入一个对象和函数的名称，现在可以用函数指针这种变量型态做到。函数指针只含有一个函数的资讯（地址），可以在稍后执行其函数.

------

函数指针可以创造并指定为变量:

```
function f = (: local_func :);
```

上面的 f 可以用于其他方法流程或外部函数中，如同普通的变量值:

```
foo(f);
map_array( ({ 1, 2 }), f);
```

或是稍后再执行 f:

```
x = evaluate(f, "hi");
```

上一行执行时，会呼叫 f 指向的函数，而 "hi" 当成参数传入函数。其效果同下:

```
x = local_func("hi");
```

使用函数指针的好处是，如果您想使用不同的函数，只需要改变函数指针变量的值.

注意 evaluate() 的参数如果不是函数，就只会传回参数值。所以您可以做以下的事:

```c
void set_short(mixed x)
{
    short = x;
}

mixed query_short()
{
    return evaluate(short);
}
```

这样，简单的对象可以只用 set_short("Whatever"); 以达成 set_short( (: short_func :) ); 的效果.

evaluate() 外部函数具体语法说明如下：

> 名称

```
evaluate() - 执行一个函数指针
```

> 语法

```
mixed evaluate(mixed f, ...)
```

> 描述

```
如果 `f` 是一个函数会使用剩余的参数调用 `f`，否则直接返回 `f`。 evaluate(f, ...) 的作用和直接调用  f(...) 相同。
```



## 6.1.2 目前函数指针的种类

第一种类型的函数指针如上面所述也是最简单最常用如的函数指针，只是简单地指向同一个对象中的一个局部函数(local function)，形式为：

```
function f = (: function_name :);
```

函数指针也可以包括函数的参数，形式为：

```
function f = (: function_name, args... :);
```

例如:

```c
string foo( string a, string b ) {
   return "(" + a + "," + b + ")";
}

void create() {
    function f = (: foo, "left" :);

    printf( "%s %s\n", evaluate(f), evaluate(f, "right") );
}
```

会输出:

```
(left,0) (left,right)
```

第二种类型和第一种本质上一样，只是把局部函数类型函数指针直接换成外部函数指针，就是：

```
function fun1 = (: efun_name :);
function fun2 = (: efun_name, args... :);
```

譬如说，objects() 外部函数要传入函数，并传回任何使函数为真值的对象。所以:

```
object *ob = objects( (: clonep :) );
```

会传回游戏中所有的复制对象 (clones)。您也可以使用参数:

```c
void create() {
    int i;
    function f = (: write, "Hello, world!\n" :);

    for (i=0; i<3; i++) { evaluate(f); }
}
```

就会输出:

```
Hello, world!
Hello, world!
Hello, world!
```

注意，对函数指针来说，simul_efuns (模拟外部函数) 与外部函数是相同的.

第三种形式是 `call_other()` 函数指针，推荐使用和第二种形式一至的形式：

```
function f = (: call_other, object, function :);
```

本质为`(: efun_name, arg1, arg2 :)`。如果需要使用参数，应该将函数名称和参数以数组的形式：

```
function f= (: call_other, object, ({function, args...}) :);
```

以上的形式本质上还是第二种，只是针对 `call_other` 外部函数固定了参数模式而已。

第四种形式是运算式 (expression) 函数指针，就是 (: 运算式 :)。在一个运算式函数指针中，参数可以用 $1、$2、$3 ... 代表，举例如下:

```
evaluate( (: $1 + $2 :), 3, 4)  // 传回 7.
```

这可以用于 sort_array，范例如下:

```
top_ten = sort_array( player_list, (: $2->query_level() - $1->query_level :) )[0..9];
```

以下示例也是运算式：

```
function f = (: this_player()->query("name") :);
object *ob = objects( (: !clonep($1) :) );
```

第五种形式是匿名(anonymous)函数:

```c
void create() {
    function f = function(int x) {
        int y;

        switch(x) {
        case 1: y = 3;break;
        case 2: y = 5;
        }
        return y - 2;
    };

    printf("%i %i %i\n", (*f)(1), (*f)(2), (*f)(3));
}
```

会输出:

```
1 3 -2
```

注意，(*f)(...) 等于 evaluate(f, ...) ，保留这种语法是为了与旧版相容。任何普通函数合法 (legal) 的写法，都可以用于匿名函数.



## 6.1.3 函数指针中的局部变量

注意：不可以在运算式函数指针里使用局部变量，因为执行这个函数指针之后，这个局部变量就不存在了，但是可以用下面这个方法解决:

```
(: destruct( $(this_player) ) :)
```

$(whatever) 表示要执行 whatever，并保留其值。当执行此函数时，再传入这个值:

```
map_array(listeners, (: tell_object($1, $(this_player()->query_name()) + " bows.\n") :) );
```

只做一次 call_other ，而不需要每个讯息都做。也可以事先合并字串:

```
map_array(listeners, (: tell_object($1, $(this_player()->query_name() + " bows.\n")) :) );
```

注意，在这个情形下，也可以这样做:

```
map_array(listeners, (: tell_object, this_player()->query_name() + " bows.\n" :) );
```

