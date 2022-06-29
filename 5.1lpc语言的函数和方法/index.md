# 5.1LPC语言的函数和方法


# 5.1 LPC语言的函数和方法

## 5.1.1 简介

函数是一段可以重复执行的代码。它可以接受不同的参数，完成对应的操作。下面的例子就是一个函数。

```c
int plus_one(int n) {
  return n + 1;
}
```

上面的代码声明了一个函数`plus_one()`。

函数声明的语法有以下几点，需要注意：

（1）返回值类型。函数声明时，首先需要给出返回值的类型，上例是`int`，表示函数`plus_one()`返回一个整数。

（2）参数。函数名后面的圆括号里面，需要声明参数的类型和参数名，`plus_one(int n)`表示这个函数有一个整数参数`n`。

（3）函数体。函数体要写在大括号里面，后面（即大括号外面）不需要加分号。大括号的起始位置，可以跟函数名在同一行，也可以另起一行，本书采用同一行的写法。

（4）`return`语句。`return`语句给出函数的返回值，程序运行到这一行，就会跳出函数体，结束函数的调用。如果函数没有返回值，可以省略`return`语句，或者写成`return;`。

> 提示：函数不能返回多个值，但可以通过返回一个数组来得到类似的效果。

调用函数时，只要在函数名后面加上圆括号就可以了，实际的参数放在圆括号里面，就像下面这样。

```c
int a = plus_one(13);
// a 等于 14
```

函数调用时，参数个数必须与定义里面的参数个数一致，参数过多或过少都会报错。

```c
int plus_one(int n) {
  return n + 1;
}

plus_one(2, 2); // 报错
plus_one();  // 报错
```

上面示例中，函数`plus_one()`只能接受一个参数，传入两个参数或不传参数，都会报错。

函数必须声明后使用，否则会报错。也就是说，一定要在使用`plus_one()`之前，声明这个函数。如果像下面这样写，编译时会报错。

```c
int a = plus_one(13);

int plus_one(int n) {
  return n + 1;
}
```

上面示例中，在调用`plus_one()`之后，才声明这个函数，编译就会报错。

C 语言标准规定，函数只能声明在源码文件的顶层，不能声明在其他函数内部。

不返回值的函数，使用`void`关键字表示返回值的类型。没有参数的函数，声明时要用`void`关键字表示参数类型。

```c
void myFunc(void) {
  // ...
}
```

上面的`myFunc()`函数，既没有返回值，调用时也不需要参数。

函数可以调用自身，这就叫做递归（recursion）。下面是斐波那契数列的例子。

```c
unsigned long Fibonacci(unsigned n) {
  if (n > 2)
    return Fibonacci(n - 1) + Fibonacci(n - 2);
  else
    return 1;
}
```

上面示例中，函数`Fibonacci()`调用了自身，大大简化了算法。

## 5.1.2 参数的传值引用

如果函数的参数是一个变量，那么调用时，传入的是这个变量的值的拷贝，而不是变量本身。

```c
void increment(int a) {
  a++;
}

int i = 10;
increment(i);

printf("%d\n", i); // 10
```

上面示例中，调用`increment(i)`以后，变量`i`本身不会发生变化，还是等于`10`。因为传入函数的是`i`的拷贝，而不是`i`本身，拷贝的变化，影响不到原始变量。这就叫做“传值引用”。

所以，如果参数变量发生变化，最好把它作为返回值传出来。

```c
int increment(int a) {
  a++;
  return a;
}

int i = 10;
i = increment(i);

printf("%d\n", i); // 11
```

## 5.1.3 函数指针

在C语言中有指针相关操作，但在LPC语言中没有明确的指针运算符和取地址运算符。但在LPC语言中函数也是指针，只是和C语言中不太一样，具体内容会在后续教程中讲解。

## 5.1.4 函数原型

前面说过，函数必须先声明，后使用。但是，对于函数较多的程序，保证每个函数的顺序正确，会变得很麻烦。

解决方法是，只要在程序开头处给出函数原型，函数就可以先使用、后声明。所谓函数原型，就是提前告诉编译器，每个函数的返回类型和参数类型。其他信息都不需要，也不用包括函数体，具体的函数实现可以后面再补上。

```c
int twice(int);

int main(int num) {
  return twice(num);
}

int twice(int num) {
  return 2 * num;
}
```

上面示例中，函数`twice()`的实现是放在`main()`后面，但是代码头部先给出了函数原型，所以可以正确编译。只要提前给出函数原型，函数具体的实现放在哪里，就不重要了。

函数原型包括参数名也可以，虽然这样对于编译器是多余的，但是阅读代码的时候，可能有助于理解函数的意图。

```c
int twice(int);

// 等同于
int twice(int num);
```

上面示例中，`twice`函数的参数名`num`，无论是否出现在原型里面，都是可以的。

注意，函数原型必须以分号结尾。

一般来说，每个源码文件的头部，都会给出当前脚本使用的所有函数的原型。

## 5.1.5 函数修饰符

C 语言提供了一些函数修饰符，让函数用法更加明确，包括`public`、`protected`、`private`、`nomask`和`varargs`，相关内容会在后续面向对象编程模块详细讲解。

## 5.1.6 可变参数

有些函数的参数数量是不确定的，声明函数的时候，可以使用省略号`...`表示可变数量的参数。

```c
void test(mixed *x...)
{
    printf("x = %O\n", x);
}
```

你传的所有参数都成为数组 x 的元素，而且没有限制参数数量。如：test()、test(1,2,3)、test("hello",1,2,({3,4,5}))、test(1,3,5,(["name":"abc","age":12]),3.14)。

这个用法和使用 varargs 相比还有一个很大的不同点，不传参数时函数参数在 varargs 定义的函数中是未定义状态（undefinedp/nullp），不管任何类型默认初始化为整型值为0，但在这里是初始化为空数组。

------

在C语言函数分库函数和自字义函数，在LPC语言中类似，也有自己的库函数，这里需要强调的是C语言的库函数在LPC语言中都是不存在的，不可以直接用，前面章节中使用的 `printf` 函数只是LPC语言中同名的库函数。

## 5.1.7 efun : LPC语言的库函数

在LPC语言中有各种可以直接使用的库函数，专业术语为 `外部函数(external function)`，通常简称为 `efun`，在 fluffos 中一共有近300个 efun，这些函数都可以直接使用，而且不需要和C语言一样要引入头文件，如：`printf`、`allocate`、`this_object`。在后续章节我们会逐步介绍常用的 efun，你也可以从这里查看所有 [efun 文档](https://wiki.mud.ren/index.php?title=Lpc:Efun)：https://wiki.mud.ren/index.php?title=Lpc:Efun

## 5.1.8 sefun : LPC语言中的模拟库函数

LPC语言的 efun 已经很多了，但游戏开发有各种需求，有时我们会开发一些自己的库函数，想在整个游戏中可以随意使用，这在LPC语言中专业术语是 `模拟外部函数(simulated external function)`，简称 `sefun`。在第一章中我们简单的介绍了驱动运行流程，也大概了解运行时配置文件中有一个参数 `simulated efun file` 指定 sefun 的位置，我们的 `sefun` 写在运行时配置中指定的文件中后，就可以和 efun 一样随意使用了。

efun 的运行速度是最快的， sefun 其次。

## 5.1.9 lfun : LPC语言中的自定义函数(方法)

除了 efun 和 sefun，我们正常开发中会大量的自定义函数，这些函数被称为 `局部函数(local function)`，简称 `lfun`。因为LPC是面向对象编程，所有 lfun 都是写在蓝图对象中，而且和对象直接相关，不像 efun 和 sefun 可以随意调用。在现在面向对象编程中，对这些函数的称呼是 `方法`，我个人也习惯这种称呼，在本教程中对自定义函数全部统一称呼为 `方法`，代表和对象相关的自定义函数。

## 5.1.10 apply : LPC语言中的系统方法

在C语言中有一个很特殊的函数，就是主函数 `main`，这个函数没有实现任何具体功能，仅仅是程序的入口，而功能需要我们自己实现。而在 LPC 语言中也有大量这类函数，其特点是在游戏运行的特定状态下自动执行，具体执行后干什么由游戏开发者决定。这类函数有一个专业术语 `apply`，因为这些 apply 全部是和对象相关，需要通过特定对象调用，所以我们称呼为 `apply 方法`。

`apply 方法`根据相关对象一共分为三类，分别是和主控对象(master)相关、和玩家对象(interactive)相关、和所有对象(object)相关，在特定条件下，游戏驱动会自动调用这些方法，具体调用后做什么，则是开发者做的事了。

比如：`connect` 这个 apply 方法在主控对象中，当有玩家连接时会被主控对象自动调用，开发者在这个方法里实现连接和登录功能；`net_dead` 这个 apply 方法在玩家对象中，当玩家断线时会自动调用，开发者可以在这个方法里处理断线后怎么办；而所有对象都有 `create` apply 方法，当对象被初始化时会自动调用，开发者可以在这个方法里初始化这个对象的基本参数和行为。

请注意：有的 apply 方法必须实现，否则游戏不能正常运行，而有的 apply 对象可以不实现，这样相关的行为就不会被处理。

目前 fluffos 支持的 [apply 方法](https://wiki.mud.ren/index.php?title=Lpc:Apply)请点击链接查看：https://wiki.mud.ren/index.php?title=Lpc:Apply

我们看一个简单的示例：

```c
// 示例：5.1.1
// apply 方法，对象加载时自动执行
void create()
{
    // 发送信息给当前玩家
    write("create 5.1.1!\n");
}

// apply 方法，设置心跳后自动执行
void heart_beat()
{
    // 记录日志，请在driver界面或 debug.log 文件中查看
    debug_message(file_name(this_object()) + ": " + time());
}

int main(object me, string arg)
{
    if (query_heart_beat())
    {
        write("停止心跳！\n");
        set_heart_beat(0);
    }
    else
    {
        write("开始心跳！\n");
        set_heart_beat(1);
    }

    return 1;
}
```

在本示例中，包括 efun、lfun 和 apply，其中 `debug_message`、`file_name`、`this_object`、`time`、`query_heart_beat`、`set_heart_beat`、`write`是 efun，`create`、`heart_beat`是 apply，`main`是 lfun。

另外，在LPC语言中多了C语言默认不支持的匿名函数，可以结合函数指针使用，语法格式：

```
function( <argument list> ) { <code> }
```

以下是示例：

```lpc
int main(object me, string arg)
{
    function f = function(int x) {
        int y;

        switch(x)
        {
        case 1:
            y = 3;
            break;
        case 2:
            y = 5;
        }
        return y - 2;
    };

    printf("%i %i %i\n", (*f)(1), (*f)(2), (*f)(3));
    return 1;
}
```

会输出:

> 1 3 -2

注意, **(\*f)(...) 等于 evaluate(f, ...)**，保留这种语法是为了与旧版相容。任何普通函数合法 (legal) 的写法，都可以用于匿名函数。

