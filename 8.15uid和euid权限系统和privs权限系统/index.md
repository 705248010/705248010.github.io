# 8.15UID和EUID权限系统和privs权限系统


# 8.15 UID 和 EUID 权限系统 | privs权限系统

## UID权限系统

当驱动编译时 `#define __PACKAGE_UIDS__` 就支持 `UID` 和 `EUID` 相关的功能。

linux系统中每个进程都有2个ID，分别为用户ID（uid）和有效用户ID（euid），UID一般表示进程的创建者（属于哪个用户创建），而EUID表示进程对于文件和资源的访问权限（具备等同于哪个用户的权限）。C语言中，可以通过函数getuid()和geteuid()来获得进程的两个ID值。

在LPC语言中，非常类似，我们可以通过 UID 实现权限控制功能。

UID 具体有以下相关外部函数：

```
seteuid(3), geteuid(3), getuid(3), export_uid(3), set_author(3), domain_stats(3), author_stats(3)
```

还有以下 apply 方法：

```
valid_seteuid(4), get_root_uid(4), author_file(4), get_bb_uid(4), domain_file(4), creator_file(4)
```

一个对象的用户ID（uid）由对象创建时 `creator_file()` 方法的返回值决定，这个方法在主控对象中。

如果对象没有设置 euid，则 euid 和 uid 相同。如果 euid 设置为 0，当前对象的用户ID（uid）可以且仅可以使用 `export_uid()` 外部函数改变。另外，如果 euid 为 0，这个对象不能载入或复制任何对象。

请注意：有很多对UID系统不熟悉的新手开发者误认为配置好相关apply方法就实现了权限系统，这是不对的。驱动只是提供了UID系统权限接口，能让你实现完整的权限验证模块，但并不是直接提供权限控制的具体实现，你的LIB的权限系统需要自己使用相关efun和apply开发实现，如果自己代码没写好，也会出现重大权限漏洞。



## privs权限系统

因为UID权限系统虽然非常强大，但实现起来比较复杂，搞不好就出漏洞了，除了UID方式，还有使用privs权限控制的方式，这是国外LIB使用比较多的鉴权方式，实现起来相对简单，主要是通过文件路径和目录判断是否有权限。

privs相关efun只有二个：`set_privs` 和 `query_privs`，另外也有一个apply方法：`privs_file`。

请注意：privs权限系统并不是简单的判断当前目录路径，如果你有某个目录的读写权限，这个目录下的文件复制到其它目录，你依然有这个被复制的文件的读写权限。

