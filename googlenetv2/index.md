# GoogLeNetV2


# GoogLeNet V2

## Abstract

训练深度神经网络的复杂性在于，每层输入的分布在训练过程中会发生变化，因为前面的层的参数会发生变化。通过要求较低的学习率和仔细的参数初始化减慢了训练，并且使具有饱和非线性的模型训练起来非常困难。本文将这种现象称为*内部协变量转移*，并通过标准化层输入来解决这个问题。本文力图使标准化成为模型架构的一部分，并为*每个训练小批量数据*执行标准化。批标准化使我们能够使用更高的学习率，并且不用太注意初始化。它也作为一个正则化项，在某些情况下不需要Dropout。将批量标准化应用到最先进的图像分类模型上，批标准化在取得相同的精度的情况下，减少了14倍的训练步骤，并以显著的差距击败了原始模型。使用批标准化网络的组合，我们改进了在ImageNet分类上公布的最佳结果：达到了`4.9％ top-5`的验证误差（和`4.8％`测试误差），超过了人类评估者的准确性。



## 1. Introduction

随机梯度下降（SGD）已经被证明是训练深度网络的有效方式，并且已经使用诸如动量（Sutskever等，2013）和Adagrad（Duchi等人，2011）等SGD变种取得了最先进的性能。SGD优化网络参数$\Theta$，以最小化损失
$$
\Theta = arg \ min_{\Theta}\frac{1}{N} \sum_{i=1}^{N}ℓ(x_i,\Theta)
$$
$x_1...N$是训练数据集。使用SGD，训练将逐步进行，在每一步中，我们考虑一个大小为$m$的小批量数据$x_1...m$。通过计算$\frac{1}{m}\sum^m_{i=1}\frac{∂ℓ(xi,Θ)}{∂Θ}$，使用小批量数据来近似损失函数关于参数的梯度。使用小批量样本，而不是一次一个样本，在一些方面是有帮助的。首先，小批量数据的梯度损失是训练集上的梯度估计，其质量随着批量增加而改善。第二，由于现代计算平台提供的并行性，对一个批次的计算比单个样本计算$m$次效率更高。

虽然随机梯度是简单有效的，但它需要仔细调整模型的超参数，特别是优化中使用的学习速率以及模型参数的初始值。训练的复杂性在于每层的输入受到前面所有层的参数的影响——因此当网络变得更深时，网络参数的微小变化就会被放大。

层输入的分布变化是一个问题，因为这些层需要不断适应新的分布。当学习系统的输入分布发生变化时，据说会经历*协变量转移*（Shimodaira，2000）。这通常是通过域适应（Jiang，2008）来处理的。然而，协变量漂移的概念可以扩展到整个学习系统之外，应用到学习系统的一部分，例如子网络或一层。考虑网络计算
$$
ℓ=F_2(F_1(u,Θ_1),Θ_2)
$$
$F_1$和$F_2$是任意变换，学习参数$Θ_1$，$Θ_2$以便最小化损失$ℓ$。学习$Θ_2$可以看作输入$x=F_1(u,Θ_1)$送入到子网络
$$
ℓ=F_2(x,Θ_2)
$$
例如，梯度下降步骤
$$
Θ_2←Θ_2−\frac{α}{m}\sum_{i=1}^{m}\frac{∂F_2(x_i,Θ_2)}{∂Θ_2}
$$
（对于批大小$m$和学习率$α$）与输入为$x$的单独网络$F_2$完全等价。因此，输入分布特性使训练更有效——例如训练数据和测试数据之间有相同的分布——也适用于训练子网络。因此$x$的分布在时间上保持固定是有利的。然后，$Θ_2$不必重新调整来补偿x分布的变化。

子网络输入的固定分布对于子网络外的层也有积极的影响。考虑一个激活函数为$g(x)=\frac{1}{1+exp(−x)}$的层，$u$是层输入，权重矩阵$W$和偏置向量$b$是要学习的层参数，$g(x)=\frac{1}{1+exp(−x)}$。随着$|x|$的增加，$g′(x)$趋向于0。这意味着对于$x=Wu+b$的所有维度，除了那些具有小的绝对值之外，流向uu的梯度将会消失，模型将缓慢的进行训练。然而，由于$x$受$W,b$和下面所有层的参数的影响，训练期间那些参数的改变可能会将$x$的许多维度移动到非线性的饱和状态并减慢收敛。这个影响随着网络深度的增加而放大。在实践中，饱和问题和由此产生的梯度消失通常通过使用修正线性单元(Nair & Hinton, 2010)$ ReLU(x)=max(x,0)$，仔细的初始化(Bengio & Glorot, 2010; Saxe et al., 2013)和小的学习率来解决。**然而，如果我们能保证非线性输入的分布在网络训练时保持更稳定，那么优化器将不太可能陷入饱和状态，训练将加速**。

**本文把训练过程中深度网络内部结点的分布变化称为*内部协变量转移*。消除它可以保证更快的训练**。我们提出了一种新的机制，我们称为为*批标准化*，它是减少内部协变量转移的一个步骤，这样做可以显著加速深度神经网络的训练。**它通过标准化步骤来实现，标准化步骤修正了层输入的均值和方差。批标准化减少了梯度对参数或它们的初始值尺度上的依赖，对通过网络的梯度流动有有益的影响。这允许我们使用更高的学习率而没有发散的风险。此外，批标准化使模型正则化并减少了对Dropout(Srivastava et al., 2014)的需求。最后，批标准化通过阻止网络陷入饱和模式让使用饱和非线性成为可能**。

在4.2小节，本文将批标准化应用到性能最好的ImageNet分类网络上，并且表明可以使用仅7％的训练步骤来匹配其性能，并且可以进一步超过其准确性一大截。通过使用批标准化训练的网络的集合，最终取得了top-5错误率，其改进了ImageNet分类上已知的最佳结果。



## 2. Towards Reducing Internal Covariate Shift

**由于训练过程中网络参数的变化，本文将*内部协变量转移*定义为网络激活分布的变化**。为了改善训练，以寻求减少内部协变量转移。随着训练的进行，通过固定层输入$x$的分布，期望提高训练速度。众所周知(LeCun et al., 1998b; Wiesler & Ney, 2011)如果对网络的输入进行白化，网络训练将会收敛的更快——即输入线性变换为具有零均值和单位方差，并去相关。当每一层观察下面的层产生的输入时，实现每一层输入进行相同的白化将是有利的。通过白化每一层的输入，将采取措施实现输入的固定分布，消除内部协变量转移的不良影响。

{{< admonition tip "白化">}}

白化，whitening。

白化的目的是去除输入数据的冗余信息。假设训练数据是图像，由于图像中相邻像素之间具有很强的相关性，所以用于训练时输入是冗余的。而白化的目的就是降低输入的冗余性。

 输入数据集$X$，经过白化处理后，新的数据$X'$满足两个性质：

1. 特征之间相关性较低；
2. 所有特征具有相同的方差。

{{< /admonition >}}

本文考虑在每个训练步骤或在某些间隔来白化激活值，通过直接修改网络或根据网络激活值来更改优化方法的参数(Wiesler et al., 2014; Raiko et al., 2012; Povey et al., 2014; Desjardins & Kavukcuoglu)。然而，如果这些修改分散在优化步骤中，那么梯度下降步骤可能会试图以要求标准化进行更新的方式来更新参数，这会降低梯度下降步骤的影响。例如，考虑一个层，其输入uu加上学习到的偏置$b$，通过减去在训练集上计算的激活值的均值对结果进行归一化：$\hat x=x−E[x]$，$x=u+b$，$X=x_1...N$是训练集上$x$值的集合，$E[x]=\frac{1}{N}\sum^N_{i=1}x_i$。如果梯度下降步骤忽略了$E[x]$对$b$的依赖，那它将更新$b←b+Δb$，其中$Δb∝−∂ℓ/∂\hat x$。然后$u+(b+Δb)−E[u+(b+Δb)]=u+b−E[u+b]$。因此，结合$b$的更新和接下来标准化中的改变会导致层的输出没有变化，从而导致损失没有变化。随着训练的继续，$b$将无限增长而损失保持不变。如果标准化不仅中心化而且缩放了激活值，问题会变得更糟糕。**在最初的实验中已经观察到了这一点，当标准化参数在梯度下降步骤之外计算时，模型会爆炸。**

上述方法的问题是梯度下降优化没有考虑到标准化中发生的事实。为了解决这个问题，本文希望确保对于任何参数值，网络总是产生具有所需分布的激活值。这样做将允许关于模型参数损失的梯度来解释标准化，以及它对模型参数$Θ$的依赖。设$x$为层的输入，将其看作向量，$\chi$是这些输入在训练集上的集合。标准化可以写为变换
$$
\hat x=Norm(x,\chi)
$$
它不仅依赖于给定的训练样本$x$而且依赖于所有样本$\chi$——它们中的每一个都依赖于$Θ$，如果$x$是由另一层生成的。对于反向传播，将需要计算雅可比行列式$\frac{∂Norm(x,X)}{∂x}$和$\frac{∂Norm(x,X)}{∂X}$；忽略后一项会导致上面描述的爆炸。在这个框架中，白化层输入是昂贵的，因为它要求计算协方差矩阵$Cov[x]=E_x∈\chi[x_{x^T}]−E[x]E[x]^T$和它的平方根倒数，从而生成白化的激活$Cov[x]^{−1/2}(x−E[x])$和这些变换进行反向传播的偏导数。这促使我们寻求一种替代方案，以可微分的方式执行输入标准化，并且在每次参数更新后不需要对整个训练集进行分析。

以前的一些方法（例如（Lyu＆Simoncelli，2008））使用通过单个训练样本计算的统计信息，或者在图像网络的情况下，使用给定位置处不同特征图上的统计。然而，通过丢弃激活值绝对尺度改变了网络的表示能力。本文希望通过对相对于整个训练数据统计信息的单个训练样本的激活值进行归一化来保留网络中的信息。



## 3. Normalization via Mini-Batch Statistics

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V2/Algorithm_1.png?raw=true" caption="算法1" >}}

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V2/Algorithm_2.png?raw=true" caption="算法2" >}}



### 3.1. Training and Inference with Batch-Normalized Networks





### 3.2. Batch-Normalized Convolutional Networks





### 3.3. Batch Normalization enables higher learning rates





## 4. Experiments

### 4.1. Activations over time

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V2/Figure_1.png?raw=true" caption="图1" >}}

> (a)使用批标准化和不使用批标准化训练的网络在MNIST上的测试准确率，以及训练的迭代次数。批标准化有助于网络训练的更快，取得更高的准确率。(b，c)典型的sigmoid在训练过程中输入分布的演变，显示为15%，50%，85%。批标准化使分布更稳定并降低了内部协变量转移。



### 4.2. ImageNet classification



#### 4.2.1. ACCELERATING BN NETWORKS





#### 4.2.2. SINGLE-NETWORK CLASSIFICATION

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V2/Figure_2.png?raw=true" caption="图2" >}}

> Inception和它的批标准化变种在单个裁剪图像上的验证准确率以及训练步骤的数量。

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V2/Figure_3.png?raw=true" caption="图3" >}}

> 对于Inception和它的批标准化变种，达到Inception最大准确率(72.2%)所需要的训练步骤数量，以及网络取得的最大准确率。



#### 4.2.3. ENSEMBLE CLASSIFICATION

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V2/Figure_4.png?raw=true" caption="图4" >}}

> 批标准化Inception与以前的最佳结果在提供的包含5万张图像的验证集上的比较。组合结果是在测试集上由测试服务器评估的结果。BN-Inception组合在验证集的5万张图像上取得了`4.9% top-5`的错误率。所有报道的其它结果是在验证集上。



## 5. Conclusion





## Extra

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V2/Figure_5.png?raw=true" caption="图5" >}}

> 加入BN后的网络结构。
>
> 由于加入了BN，原始v1的网络结构也有了比较大的变化。
>
> 1. 增加学习率。
> 2. 移除Dropout。加速训练的同时不会增加过拟合。
> 3. 减少L2权值正则化的影响。也就是L2范数前面的因子减少到原来的5分之1。
> 4. 降低了学习速率衰减的倍数。
> 5. 移除LRN局部响应归一化层。
> 6. 更彻底地打乱训练样本。防止相同的那些样本总是一起出现在mini-batch中。
> 7. 减少光度扭曲。由于训练速度变快，观察每张训练样本的时间很少了，为了让训练器更加聚焦于真实样本，只能扭曲他们更少。



## References

{{< admonition quote "引用" false>}}

Bengio, Yoshua and Glorot, Xavier. Understanding the difficulty of training deep feedforward neural networks. In Proceedings of AISTATS 2010, volume 9, pp. 249–256, May 2010.

Dean, Jeffrey, Corrado, Greg S., Monga, Rajat, Chen, Kai, Devin, Matthieu, Le, Quoc V., Mao, Mark Z., Ranzato, Marc’Aurelio, Senior, Andrew, Tucker, Paul, Yang, Ke, and Ng, Andrew Y. Large scale distributed deep networks. In NIPS, 2012.

Desjardins, Guillaume and Kavukcuoglu, Koray. Natural neural networks. (unpublished).

Duchi, John, Hazan, Elad, and Singer, Yoram. Adaptive subgradient methods for online learning and stochastic optimization. J. Mach. Learn. Res., 12:2121–2159, July 2011. ISSN 1532-4435.

Gu ̈lc ̧ehre, C ̧ aglar and Bengio, Yoshua. Knowledge matters: Importance of prior information for optimization. CoRR, abs/1301.4083, 2013.

He, K., Zhang, X., Ren, S., and Sun, J. Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet Classification. ArXiv e-prints, February 2015.

Hyva ̈rinen, A. and Oja, E. Independent component analysis: Algorithms and applications. Neural Netw., 13(4-5): 411–430, May 2000.
Jiang, Jing. A literature survey on domain adaptation of statistical classifiers, 2008.

LeCun, Y., Bottou, L., Bengio, Y., and Haffner, P. Gradient-based learning applied to document recognition. Proceedings of the IEEE, 86(11):2278–2324, November 1998a.

LeCun, Y., Bottou, L., Orr, G., and Muller, K. Efficient backprop. In Orr, G. and K., Muller (eds.), Neural Networks: Tricks of the trade. Springer, 1998b.

Lyu, S and Simoncelli, E P. Nonlinear image representation using divisive normalization. In Proc. Computer Vision and Pattern Recognition, pp. 1–8. IEEE Computer Society, Jun 23-28 2008. doi: 10.1109/CVPR.2008.4587821.

Nair, Vinod and Hinton, Geoffrey E. Rectified linear units improve restricted boltzmann machines. In ICML, pp. 807–814. Omnipress, 2010.

Pascanu, Razvan, Mikolov, Tomas, and Bengio, Yoshua. On the difficulty of training recurrent neural networks. In Proceedings of the 30th International Conference on Machine Learning, ICML 2013, Atlanta, GA, USA, 16-21 June 2013, pp. 1310–1318, 2013.

Povey, Daniel, Zhang, Xiaohui, and Khudanpur, Sanjeev. Parallel training of deep neural networks with natural gradient and parameter averaging. CoRR, abs/1410.7455, 2014.

Raiko, Tapani, Valpola, Harri, and LeCun, Yann. Deep learning made easier by linear transformations in perceptrons. In International Conference on Artificial Intelligence and Statistics (AISTATS), pp. 924–932, 2012.

Russakovsky, Olga, Deng, Jia, Su, Hao, Krause, Jonathan, Satheesh, Sanjeev, Ma, Sean, Huang, Zhiheng, Karpathy, Andrej, Khosla, Aditya, Bernstein, Michael, Berg, Alexander C., and Fei-Fei, Li. ImageNet Large Scale Visual Recognition Challenge, 2014.

Saxe, Andrew M., McClelland, James L., and Ganguli, Surya. Exact solutions to the nonlinear dynamics of learning in deep linear neural networks. CoRR, abs/1312.6120, 2013.

Shimodaira, Hidetoshi. Improving predictive inference under covariate shift by weighting the log-likelihood function. Journal of Statistical Planning and Inference, 90 (2):227–244, October 2000.

Srivastava, Nitish, Hinton, Geoffrey, Krizhevsky, Alex, Sutskever, Ilya, and Salakhutdinov, Ruslan. Dropout: A simple way to prevent neural networks from overfitting. J. Mach. Learn. Res., 15(1):1929–1958, January 2014.

Sutskever, Ilya, Martens, James, Dahl, George E., and Hinton, Geoffrey E. On the importance of initialization and momentum in deep learning. In ICML (3), volume 28 of JMLR Proceedings, pp. 1139–1147. JMLR.org, 2013.

Szegedy, Christian, Liu, Wei, Jia, Yangqing, Sermanet, Pierre, Reed, Scott, Anguelov, Dragomir, Erhan, Dumitru, Vanhoucke, Vincent, and Rabinovich, Andrew. Going deeper with convolutions. CoRR, abs/1409.4842, 2014.

Wiesler, Simon and Ney, Hermann. A convergence analysis of log-linear training. In Shawe-Taylor, J., Zemel, R.S., Bartlett, P., Pereira, F.C.N., and Weinberger, K.Q. (eds.), Advances in Neural Information Processing Systems 24, pp. 657–665, Granada, Spain, December 2011.

Wiesler, Simon, Richard, Alexander, Schlu ̈ter, Ralf, and Ney, Hermann. Mean-normalized stochastic gradient for large-scale deep learning. In IEEE International Conference on Acoustics, Speech, and Signal Processing, pp. 180–184, Florence, Italy, May 2014.

Wu, Ren, Yan, Shengen, Shan, Yi, Dang, Qingqing, and Sun, Gang. Deep image: Scaling up image recognition, 2015.

{{< /admonition >}}
