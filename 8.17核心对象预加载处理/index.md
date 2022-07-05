# 8.17核心对象预加载处理


# 8.17 核心对象预加载处理

在前面章节中我们学习了很多游戏功能的实现，有的功能关系到整个游戏是否正常运行，我们做成了守护进程，如：COMBAT_D、VIRTUAL_D。为了保证游戏稳定运行，我们可以把核心守护进程在游戏启动时预加载，一方面保证相关功能能自启动，另一方面也能提前发现服务错误，避免游戏相关功能异常。

游戏对象自动载入主要用到以下二个 apply 方法：

```c
   string *epilog( int load_empty );
   void preload( string filename );
```

游戏驱动先调用主控对象中的 `epilog(int load_empty)` 方法获取要预加载的对象文件列表，epilog() 方法应该返回一个包含 mudlib 想要预加载的对象的文件名数组。驱动程序会把返回的数组中的每个文件名作为参数调用主控对象中的 `preload(string filename)` 方法。相关代码参考如下：

```c
// Return:              List of files to preload
string *epilog(int load_empty)
{
    string *items;

    items = read_lines(CONFIG_DIR + "preload");
    return items;
}

// preload an object
void preload(string file)
{
    if (objectp(find_object(file)))
        return;

    if (file_size(file + ".c") == -1)
        return;

    catch(load_object(file));
}
```

以上代码中 `read_lines()` 是一个自定义函数，参考代码：

```c
string *read_lines(string file)
{
    string *list;
    string str;

    str = read_file(file);
    if (!str)
        return ({});

    list = explode(str, "\n");
    for (int i = 0; i < sizeof(list); i++)
        if (list[i][0] == '#')
            list[i] = 0;
    list -= ({ 0 });

    return list;
}
```

如果有文件预加载，在驱动启用日志中会有`Loading preload files ...`内容，如：

```
Loading preload files ...
/adm/daemons/securityd...
/adm/daemons/timed...
/adm/daemons/logind...
/adm/daemons/virtuald...
/adm/daemons/rankd...
```

需要自动启动的守护进程推荐预加载，这时还没有任何玩家连线，提前加载也能优化游戏体验。

