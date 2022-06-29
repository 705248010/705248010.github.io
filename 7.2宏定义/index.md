# 7.2宏定义


# 7.2 宏定义

## 7.2.1 宏定义(#define)

LPC语言中的宏定义用法和C语言一样。宏定义的一般形式为：

```
#define 宏名 字符串
```

对宏定义的几点说明：

\1) 宏定义是用宏名来表示一个字符串，在宏展开时又以该字符串取代宏名，这只是一种简单粗暴的替换。字符串中可以含任何字符，它可以是常数、表达式、if 语句、函数等，预处理程序对它不作任何检查，如有错误，只能在编译已被宏展开后的源程序时发现。

\2) 宏定义不是说明或语句，在行末不必加分号，如加上分号则连分号也一起替换。

3)宏定义必须放在函数之外，作用域为当前对象文件。如要终止其作用域可使用#undef命令

请注意：宏定义的常量和全局变量的作用域不同，全局变量可以在继承对象中直接使用，而宏定义无法在继承对象中使用。

宏的名称不允许有空格，而且必须遵守 C 语言的变量命名规则，只能使用字母、数字与下划线（`_`），且首字符不能是数字。

宏是原样替换，指定什么内容，就一模一样替换成什么内容。

```c
#define HELLO "Hello, world"

// 相当于 printf("%s", "Hello, world");
printf("%s", HELLO);
```

上面示例中，宏`HELLO`会被原样替换成`"Hello, world"`。

`#define`指令可以出现在源码文件的任何地方，从指令出现的地方到该文件末尾都有效。习惯上，会将`#define`放在源码文件的头部。它的主要好处是，会使得程序的可读性更好，也更容易修改。

`#define`指令从`#`开始，一直到换行符为止。如果整条指令过长，可以在折行处使用反斜杠`\`，延续到下一行。

```c
#define OW "C programming language is invented \
in 1970s."
```

上面示例中，第一行结尾的反斜杠将`#define`指令拆成两行。

`#define`允许多重替换，即一个宏可以包含另一个宏。

```c
#define TWO 2
#define FOUR TWO*TWO
```

上面示例中，`FOUR`会被替换成`2*2`。

注意，如果宏出现在字符串里面（即出现在双引号中），或者是其他标识符的一部分，就会失效，并不会发生替换。

```c
#define TWO 2

int main()
{
    int TWOs = 22;
    // 输出 TWO
    printf("TWO\n");

    // 输出 22
    printf("%d\n", TWOs);

    return 1;
}
```

上面示例中，双引号里面的`TWO`，以及标识符`TWOs`，都不会被替换。

同名的宏可以重复定义，只要定义是相同的，就没有问题。如果定义不同，在LPC语言中会报重复定义的错误。

```c
// 正确
#define FOO hello
#define FOO hello

// 报错
#define BAR hello
#define BAR world
```

上面示例中，宏`FOO`没有变化，所以可以重复定义，宏`BAR`发生了变化，就报`Warning: redefinition of #define BAR before the end of line`。



## 7.2.2 带参数的宏

### 基本用法

宏的强大之处在于，它的名称后面可以使用括号，指定接受一个或多个参数。

```c
#define SQUARE(X) X*X
```

上面示例中，宏`SQUARE`可以接受一个参数`X`，替换成`X*X`。

注意，宏的名称与左边圆括号之间，不能有空格。

这个宏的用法如下。

```c
// 替换成 z = 2*2;
z = SQUARE(2);
```

这种写法很像函数，但又不是函数，而是完全原样的替换，会跟函数有不一样的行为。

```c
#define SQUARE(X) X*X

// 输出19
printf("%d\n", SQUARE(3 + 4));
```

上面示例中，`SQUARE(3 + 4)`如果是函数，输出的应该是49（`7*7`）；宏是原样替换，所以替换成`3 + 4*3 + 4`，最后输出19。

可以看到，原样替换可能导致意料之外的行为。解决办法就是在定义宏的时候，尽量多使用圆括号，这样可以避免很多意外。

```c
#define SQUARE(X) ((X) * (X))
```

上面示例中，`SQUARE(X)`替换后的形式，有两层圆括号，就可以避免很多错误的发生。

宏的参数也可以是空的。

```c
#define getchar() getc(stdin)
```

上面示例中，宏`getchar()`的参数就是空的。这种情况其实可以省略圆括号，但是加上了，会让它看上去更像函数。

一般来说，带参数的宏都是一行的。下面是两个例子。

```c
#define MAX(x, y) ((x)>(y)?(x):(y))
#define IS_EVEN(n) ((n)%2==0)
```

如果宏的长度过长，可以使用反斜杠（`\`）折行，将宏写成多行。

```c
#define PRINT_NUMS_TO_PRODUCT(a, b) { \
  int product = (a) * (b); \
  for (int i = 0; i < product; i++) { \
    printf("%d\n", i); \
  } \
}
```

上面示例中，替换文本放在大括号里面，这是为了创造一个块作用域，避免宏内部的变量污染外部。

带参数的宏也可以嵌套，一个宏里面包含另一个宏。

```c
#define QUADP(a, b, c) ((-(b) + sqrt((b) * (b) - 4 * (a) * (c))) / (2 * (a)))
#define QUADM(a, b, c) ((-(b) - sqrt((b) * (b) - 4 * (a) * (c))) / (2 * (a)))
#define QUAD(a, b, c) QUADP(a, b, c), QUADM(a, b, c)
```

上面示例是一元二次方程组求解的宏，由于存在正负两个解，所以宏`QUAD`先替换成另外两个宏`QUADP`和`QUADM`，后者再各自替换成一个解。

那么，什么时候使用带参数的宏，什么时候使用函数呢？

一般来说，应该首先使用函数，它的功能更强、更容易理解。宏有时候会产生意想不到的替换结果，而且往往只能写成一行，除非对换行符进行转义，但是可读性就变得很差。

宏的优点是相对简单，本质上是字符串替换，不涉及数据类型，不像函数必须定义数据类型。而且，宏将每一处都替换成实际的代码，省掉了函数调用的开销，所以性能会好一些。另外，以前的代码大量使用宏，尤其是简单的数***算，为了读懂前人的代码，需要对它有所了解。

#### `#`运算符，`##`运算符

由于宏不涉及数据类型，所以替换以后可能为各种类型的值。如果希望替换后的值为字符串，可以在替换文本的参数前面加上`#`。

```c
// 示例：7.2.2
#define F(f) f
#define STR(s) #s

int main(object me, string arg)
{
    debug(F("mud.ren"));
    // 不能使用，debug(F(mud.ren)); 会报错！
    debug(STR(mud.ren));
    debug(STR("mud.ren"));

    return 1;
}
```

示例中运行结果：

```
mud.ren
mud.ren
"mud.ren"
```

如果在宏定义时没有使用 `#`，STR(mud.ren) 这种使用是会报错的。`#` 用来将宏参数转换为字符串，也就是在宏参数的开头和末尾添加引号。即使给宏参数“传递”的数据中包含引号，使用#仍然会在两头添加新的引号，而原来的引号会被转义输出。

下面是另一个例子。

```c
#define XNAME(n) "x"#n

// 输出 x4
printf("%s\n", XNAME(4));
```

上面示例中，`#n`指定参数输出为字符串，再跟前面的字符串结合，最终输出为`"x4"`。如果不加`#`，这里实现起来就很麻烦了。

如果替换后的文本里面，参数需要跟其他标识符连在一起，组成一个新的标识符，可以使用`##`运算符。它起到粘合作用，将参数“嵌入”一个标识符之中。

```c
#define MK_ID(n) i##n
```

上面示例中，`n`是宏`MK_ID`的参数，这个参数需要跟标识符`i`粘合在一起，这时`i`和`n`之间就要使用`##`运算符。下面是这个宏的用法示例。

```c
int MK_ID(1), MK_ID(2), MK_ID(3);
// 替换成
int i1, i2, i3;
```

上面示例中，替换后的文本`i1`、`i2`、`i3`是三个标识符，参数`n`是标识符的一部分。从这个例子可以看到，`##`运算符的一个主要用途是批量生成变量名和标识符。

### 取消宏定义(#undef)

`#undef`指令用来取消已经使用`#define`定义的宏。

```c
#define LIMIT 400
#undef LIMIT
```

上面示例的`undef`指令取消已经定义的宏`LIMIT`，后面就可以重新用 LIMIT 定义一个宏。

有时候想重新定义一个宏，但不确定是否以前定义过，就可以先用`#undef`取消，然后再定义。因为同名的宏如果两次定义不一样，会报错，而`#undef`的参数如果是不存在的宏，并不会报错。

------

除了自定义宏，游戏驱动也提供了一些预定义的宏，最常用的是 `__DIR__`、`___FILE__` 和 `__LINE__`。

```
__LINE__：表示当前源代码的行号；
__FILE__：表示当前源文件的名称；
__DIR__：表示当前源文件所在目录；
```

需要特别注意的是：`__FILE__` 和 `file_name()` 的不同，我们新建 `/cmds/test/7.2.1.c` 测试，代码如下：

```c
// 示例：7.2.1
int main(object me, string arg)
{
    debug("文件目录：" + __DIR__);
    debug("文件名：" + __FILE__);
    debug("当行前：" + __LINE__);
    debug("文件名：" + file_name());

    return 1;
}
```

一方面 `__FILE__` 带有扩展名 `.c`，另一方面，在继承对象中的结果也不同，再新建 `/cmds/test/7.2.1.1.c` 使用以下代码测试：

```c
// 示例：7.2.1
inherit __DIR__ "7.2.1";
```

输出结果为：

```
文件目录：/cmds/test/
文件名：/cmds/test/7.2.1.c
当行前：6
文件名：/cmds/test/7.2.1.1
```

另外，FLUFFOS中还提供了大量的预定义宏，不同版本和环境下编译的驱动可能稍有不同，具体参考如下：

```
==== LPC Predefines ====
#define FLUFFOS
#define HAS_DEBUG_LEVEL
#define HAS_ED
#define HAS_PRINTF
#define MAX_FLOAT 179769313486231570814527423731704356798070600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000.000000
#define MAX_INT 9223372036854775807
#define MIN_FLOAT 0.000000
#define MIN_INT -9223372036854775808
#define MUDOS
#define MUD_NAME "LPC-TEST"
#define SIZEOFINT 8
#define __ARCH__ "CYGWIN-64"
#define __ARGUMENTS_IN_TRACEBACK__
#define __ARRAY_STATS__
#define __CACHE_STATS__
#define __CALLOUT_HANDLES__
#define __CFG_COMPILER_STACK_SIZE__ 600
#define __CFG_EVALUATOR_STACK_SIZE__ 65536
#define __CFG_LIVING_HASH_SIZE__ 256
#define __CFG_MAX_CALL_DEPTH__ 150
#define __CFG_MAX_GLOBAL_VARIABLES__ 65536
#define __CFG_MAX_LOCAL_VARIABLES__ 50
#define __CLASS_STATS__
#define __COMMAND_BUF_SIZE__ 2000
#define __COMPILER__ "/usr/bin/c++.exe"
#define __CUSTOM_CRYPT__
#define __CXXFLAGS__ "Broken"
#define __DEBUG_MACRO__
#define __DEFAULT_PRAGMAS__ PRAGMA_WARNINGS + PRAGMA_SAVE_TYPES + PRAGMA_ERROR_CONTEXT + PRAGMA_OPTIMIZE
#define __ED_INDENT_SPACES__ 4
#define __ED_TAB_WIDTH__ 8
#define __GET_CHAR_IS_BUFFERED__
#define __HAS_CONSOLE__
#define __LARGEST_PRINTABLE_STRING__ 8192
#define __LARGE_STRING_SIZE__ 1000
#define __LOCALS_IN_TRACEBACK__
#define __MAX_SAVE_SVALUE_DEPTH__ 100
#define __MUDLIB_ERROR_HANDLER__
#define __NONINTERACTIVE_STDERR_WRITE__
#define __OLD_ED__
#define __PACKAGES_PACKAGES_H__
#define __PACKAGE_COMPRESS__
#define __PACKAGE_CONTRIB__
#define __PACKAGE_CORE__
#define __PACKAGE_CRYPTO__
#define __PACKAGE_DB__
#define __PACKAGE_DEVELOP__
#define __PACKAGE_MATH__
#define __PACKAGE_MATRIX__
#define __PACKAGE_MUDLIB_STATS__
#define __PACKAGE_OPS__
#define __PACKAGE_PARSER__
#define __PACKAGE_PCRE__
#define __PACKAGE_SHA1__
#define __PACKAGE_SOCKETS__
#define __PACKAGE_TRIM__
#define __PACKAGE_UIDS__
#define __PORT__ 5555
#define __RANDOMIZED_RESETS__
#define __RECEIVE_SNOOP__
#define __REF_RESERVED_WORD__
#define __RESTRICTED_ED__
#define __SANE_EXPLODE_STRING__
#define __SANE_SORTING__
#define __SAVE_EXTENSION__ ".o"
#define __SENSIBLE_MODIFIERS__
#define __SMALL_STRING_SIZE__ 100
#define __STRING_STATS__
#define __STRUCT_CLASS__
#define __STRUCT_STRUCT__
#define __SUPPRESS_ARGUMENT_WARNINGS__
#define __THIS_PLAYER_IN_CALL_OUT__
#define __TRACE__
#define __TRAP_CRASHES__
#define __USE_32BIT_ADDRESSES__
#define __VERSION__ "fluffos v20190130 (CMake/Broken)"
#define __WARN_OLD_RANGE_BEHAVIOR__
========================
```

