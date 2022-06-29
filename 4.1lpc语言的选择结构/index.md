# 4.1LPC语言的选择结构


# 4.1 LPC语言的选择结构

C语言中常用的编程结构有三种（其它编程语言也是如此），它们分别是：

- 顺序结构：代码从前往后依次执行，没有任何“拐弯抹角”，不跳过任何一条语句，所有的语句都会被执行到。
- 选择结构：也叫分支结构。代码会被分成多个部分，程序会根据特定条件（某个表达式的运算结果）来判断到底执行哪一部分。
- 循环结构：程序会重新执行同一段代码，直到条件不再满足，或者遇到强行跳出语句（break 关键字）。

C 语言的程序是顺序执行，即先执行前面的语句，再执行后面的语句。开发者如果想要控制程序执行的流程，就必须使用流程控制的语法结构，主要是条件执行(选择结构)和循环执行（循环结构）。下面我们先介绍选择结构的流程控制语句。

## 4.1.1 if 语句

`if`语句用于条件判断，满足条件时，就执行指定的语句。

```c
if (expression) statement
```

上面式子中，表达式`expression`为真（值不为`0`）时，就执行`statement`语句。

`if`后面的判断条件`expression`外面必须有圆括号，否则会报错。语句体部分`statement`可以是一个语句，也可以是放在大括号里面的复合语句。下面是一个例子。

```c
if (x == 10) printf("x is 10");
```

上面示例中，当变量`x`为`10`时，就会输出一行文字。对于只有一个语句的语句体，语句部分通常另起一行。

```c
if (x == 10)
  printf("x is 10\n");
```

如果有多条语句，就需要把它们放在大括号里面，组成一个复合语句。

```c
if (line_num == MAX_LINES) {
  line_num = 0;
  page_num++;
}
```

`if`语句可以带有`else`分支，指定条件不成立时（表达式`expression`的值为`0`），所要执行的代码。

```c
if (expression) statement
else statement
```

下面是一个例子。

```c
if (i > j)
  max = i;
else
  max = j;
```

如果`else`的语句部分多于一行，同样可以把它们放在大括号里面。

`else`可以与另一个`if`语句连用，构成多重判断。

```c
if (expression)
  statement
else if (expression)
  statement
...
else if (expression)
  statement
else
  statement
```

如果有多个`if`和`else`，可以记住这样一条规则，`else`总是跟最接近的`if`匹配。

```c
if (number > 6)
  if (number < 12)
    printf("The number is more than 6, less than 12.\n");
else
  printf("It is wrong number.\n");
```

上面示例中，`else`部分匹配最近的`if`（即`number < 12`），所以如果`number`等于6，就不会执行`else`的部分。

这样很容易出错，为了提供代码的可读性，建议使用大括号，明确`else`匹配哪一个`if`。

```c
if (number > 6) {
  if (number < 12) {
    printf("The number is more than 6, less than 12.\n");
  }
} else {
  printf("It is wrong number.\n");
}
```

上面示例中，使用了大括号，就可以清晰地看出`else`匹配外层的`if`。



## 4.1.2 三元运算符 ?:

C 语言有一个三元表达式`?:`，可以用作`if...else`的简写形式。

```c
<expression1> ? <expression2> : <expression3>
```

这个操作符的含义是，表达式`expression1`如果为`true`（非0值），就执行`expression2`，否则执行`expression3`。

下面是一个例子，返回两个值之中的较大值。

```c
(i > j) ? i : j;
```

上面的代码等同于下面的`if`语句。

```c
if (i > j)
  return i;
else
  return j;
```



## 4.1.3 switch 语句

switch 语句是一种特殊形式的 if...else 结构，用于判断条件有多个结果的情况。它把多重的`else if`改成更易用、可读性更好的形式。

```c
switch (expression) {
  case value1: statement
  case value2: statement
  default: statement
}
```

上面代码中，根据表达式`expression`不同的值，执行相应的`case`分支。如果找不到对应的值，就执行`default`分支。

下面是一个例子。

```c
switch (grade) {
  case 0:
    printf("False");
    break;
  case 1:
    printf("True");
    break;
  default:
    printf("Illegal");
}
```

上面示例中，根据变量`grade`不同的值，会执行不同的`case`分支。如果等于`0`，执行`case 0`的部分；如果等于`1`，执行`case 1`的部分；否则，执行`default`的部分。`default`表示处理以上所有`case`都不匹配的情况。

每个`case`语句体的结尾，都应该有一个`break`语句，作用是跳出整个`switch`结构，不再往下执行。如果缺少`break`，就会导致继续执行下一个`case`或`default`分支。

```c
switch (grade) {
  case 0:
    printf("False");
  case 1:
    printf("True");
    break;
  default:
    printf("Illegal");
}
```

上面示例中，`case 0`的部分没有`break`语句，导致这个分支执行完以后，不会跳出`switch`结构，继续执行`case 1`分支。

利用这个特点，如果多个`case`分支对应同样的语句体，可以写成下面这样。

```c
switch (grade) {
  case 0:
  case 1:
    printf("True");
    break;
  default:
    printf("Illegal");
}
```

上面示例中，`case 0`分支没有任何语句，导致`case 0`和`case 1`都会执行同样的语句体。

`case`后面的语句体，不用放在大括号里面，这也是为什么需要`break`的原因。

`default`分支用来处理前面的 case 都不匹配的情况，最好放在所有 case 的后面，这样就不用写`break`语句。这个分支是可选的，如果没有该分支，遇到所有的 case 都不匹配的情况，就会直接跳出整个 switch 代码块。

LPC语言和C语言一样可以使用 `if...else`、`switch...case...break...default` 和 `? :` 实现选择结构，但是不同点是对 `switch` 语句，在C语言中只能使用`整型数值`做判断，LPC语言中还可以使用`字符串`和`x..y`范围匹配，如下示例：

```c
// 示例：4.1.1
int main(object me, string arg)
{
    switch(arg)
    {
    case "mud":
        printf("mud.ren:5555\n");
        break;
    case "bbs":
        printf("bbs.mud.ren\n");
        break;
    case "wiki":
        printf("mud.wiki\n");
        break;
    default:
        printf("www.mud.ren\n");
    }

    return 1;
}
```

输入指令：`4.1.1 mud`，输出结果如下：

```
mud.ren:5555
```

我们再建一个示例代码，看看LPC语言中switch的`..x`、`x..y`、`x..`这种范围选择：

```c
// 示例：4.1.2
int main(object me, string arg)
{
    int x = atoi(arg);
    switch (x)
    {
    case 0..0:
        write(0);
        break;
    case 11..20:
        write(2);
        break;
    default:
        write(520);
        break;
    case 1..10:
        write(1);
        break;
    case 21..:
        write(999);
        break;
    case ..-10:
        write(-99);
    };

    return 1;
}
```

