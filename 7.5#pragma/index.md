# 7.5pragma


## 7.5 #pragma

`#pragma`是C语言中也存在的预处理指令，在所有的预处理指令中，#pragma 指令可能是最复杂的了，它的作用是设定编译器的状态或者是指示编译器完成一些特定的动作。

在FluffOS中有以下可用状态：

- strict_types
- save_types
- warnings
- optimize

在旧版驱动中还有以下可用状态：

- save_binary
- error_context

这些预处理请写在代码最开始的位置。

