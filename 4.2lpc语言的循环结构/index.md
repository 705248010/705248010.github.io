# 4.2LPC语言的循环结构


# 4.2 LPC语言的循环结构

循环结构在C语言中有 `while`、`do..while`、`for` 和 `if..goto` 四种，在LPC语言中没有 `goto` 关键字，所以基本循环只有三种，而且使用方法和C语言完全一样。

## 4.2.1 while 语句

`while`语句用于循环结构，满足条件时，不断执行循环体。

```c
while (expression)
  statement
```

上面代码中，如果表达式`expression`为非零值（表示真），就会执行`statement`语句，然后再次判断`expression`是否为零；如果`expression`为零（表示伪）就跳出循环，不再执行循环体。

```c
while (i < n)
  i = i + 2;
```

上面示例中，只要`i`小于`n`，`i`就会不断增加2。

如果循环体有多个语句，就需要使用大括号将这些语句组合在一起。

```c
while (expression) {
  statement;
  statement;
}
```

下面是一个例子。

```c
i = 0;

while (i < 10) {
  printf("i is now %d!\n", i);
  i++;
}

printf("All done!\n");
```

上面代码中，循环体会执行10次，每次将`i`增加`1`，直到等于`10`才退出循环。

只要条件为真，`while`会产生无限循环。下面是一种常见的无限循环的写法。

```c
while (1) {
  // ...
}
```

上面的示例虽然是无限循环，但是循环体内部可以用`break`语句跳出循环。



## 4.2.2 do...while 结构

`do...while`结构是`while`的变体，它会先执行一次循环体，然后再判断是否满足条件。如果满足的话，就继续执行循环体，否则跳出循环。

```c
do statement
while (expression);
```

上面代码中，不管条件`expression`是否成立，循环体`statement`至少会执行一次。每次`statement`执行完毕，就会判断一次`expression`，决定是否结束循环。

```c
i = 10;

do --i;
while (i > 0);
```

上面示例中，变量`i`先减去1，再判断是否大于0。如果大于0，就继续减去1，直到`i`等于`0`为止。

如果循环部分有多条语句，就需要放在大括号里面。

```c
i = 10;

do {
  printf("i is %d\n", i);
  i++;
} while (i < 10);

printf("All done!\n");
```

上面例子中，变量`i`并不满足小于`10`的条件，但是循环体还是会执行一次。



## 4.2.3 for 语句

`for`语句是最常用的循环结构，通常用于精确控制循环次数。

```c
for (initialization; continuation; action)
  statement;
```

上面代码中，`for`语句的条件部分（即圆括号里面的部分）有三个表达式。

- `initialization`：初始化表达式，用于初始化循环变量，只执行一次。
- `continuation`：判断表达式，只要为`true`，就会不断执行循环体。
- `action`：循环变量处理表达式，每轮循环结束后执行，使得循环变量发生变化。

循环体部分的`statement`可以是一条语句，也可以是放在大括号里面的复合语句。下面是一个例子。

```c
for (int i = 10; i > 0; i--)
  printf("i is %d\n", i);
```

上面示例中，循环变量`i`在`for`的第一个表达式里面声明，该变量只用于本次循环。离开循环体之后，就会失效。

条件部分的三个表达式，每一个都可以有多个语句，语句与语句之间使用逗号分隔。

```c
int i, j;
for (i = 0, j = 999; i < 10; i++, j--) {
  printf("%d, %d\n", i, j);
}
```

上面示例中，初始化部分有两个语句，分别对变量`i`和`j`进行赋值。

`for`的三个表达式都不是必需的，甚至可以全部省略，这会形成无限循环。

```c
for (;;) {
  printf("本行会无限循环地打印。\n" );
}
```

上面示例由于没有判断条件，就会形成无限循环。



## 4.2.4 break 语句

`break`语句有两种用法。一种是与`switch`语句配套使用，用来中断某个分支的执行，这种用法前面已经介绍过了。另一种用法是在循环体内部跳出循环，不再进行后面的循环了。

```c
for (int i = 0; i < 3; i++) {
  for (int j = 0; j < 3; j++) {
    printf("%d, %d\n", i, j);
    break;
  }
}
```

上面示例中，`break`语句使得循环跳到下一个`i`。

```c
while ((ch = getchar()) != EOF) {
  if (ch == '\n') break;
  putchar(ch);
}
```

上面示例中，一旦读到换行符（`\n`），`break`命令就跳出整个`while`循环，不再继续读取了。

注意，`break`命令只能跳出循环体和`switch`结构，不能跳出`if`结构。

```c
if (n > 1) {
  if (n > 2) break; // 无效
  printf("hello\n");
}
```

上面示例中，`break`语句是无效的，因为它不能跳出外层的`if`结构。



## 4.2.5 continue 语句

`continue`语句用于在循环体内部终止本轮循环，进入下一轮循环。只要遇到`continue`语句，循环体内部后面的语句就不执行了，回到循环体的头部，开始执行下一轮循环。

```c
for (int i = 0; i < 3; i++) {
  for (int j = 0; j < 3; j++) {
    printf("%d, %d\n", i, j);
    continue;
  }
}
```

上面示例中，有没有`continue`语句，效果一样，都表示跳到下一个`j`。

```c
while ((ch = getchar()) != '\n') {
  if (ch == '\t') continue;
  putchar(ch);
}
```

上面示例中，只要读到的字符是制表符（`\t`），就用`continue`语句跳过该字符，读取下一个字符。



## 4.2.6 foreach 语句

和C语言不同的是，在LPC语言中增加了 `foreach` 循环语句用来处理数组和映射，语法如下：

```
foreach (<var> [, <var>] in <expr) <statement or block>
```

如：

```
foreach(item in array){}
foreach(key, value in mapping){}
```

给一个简单的示例：

```c
// 示例：4.2.1
int main(object me, string arg)
{
    int *array = ({1, 2, 3, 4, 5, 6, 7});

    foreach(int i in array)
    {
        printf("%d\n", i);
    }

    return 1;
}
```

运行后输出结果如下：

```
1
2
3
4
5
6
7
```

如果需要循环处理数组和映射，在LPC中推荐使用 `foreach`，简单方便。

另外，`foreach`还支持传引用`ref`，具体语法如下：

```
foreach (ref x in array)
foreach (x, ref y in mapping)
```

如下示例：

```c
int main(object me, string arg)
{
    mixed *arr = ({1,2,3,4,5});

    foreach(int ref x in arr)
        x *= 3;
    // print_r为自己写的sefun，格式化打印数组的值方式调试用
    print_r(arr);

    return 1;
}
```

输出结果为：

```
({
    0 => 3
    1 => 6
    2 => 9
    3 => 12
    4 => 15
})
```

在foreach中改变值直接改变了原始数组的值，在映射中使用类似，也可以直接传引用并修改值，这里不再演示。

