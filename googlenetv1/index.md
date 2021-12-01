# GoogleNetV1


# GoogleNet V1

## Abstract

本文作者在ImageNet大规模视觉识别挑战赛2014（ILSVRC14）上提出了一种代号为Inception的深度卷积神经网络结构，并在分类和检测上取得了新的最好结果。这个架构的主要特点是提高了网络内部计算资源的利用率。通过精心的手工设计，在增加了网络深度和广度的同时保持了计算预算不变。为了优化质量，架构的设计以赫布理论和多尺度处理直觉为基础。作者在ILSVRC14提交中应用的一个特例被称为GoogLeNet，一个22层的深度网络，其质量在分类和检测的背景下进行了评估。



## 1. Introduction

过去三年中，由于深度学习和卷积网络的发展[10]，目标分类和检测能力得到了显著提高。一个令人鼓舞的消息是，大部分的进步不仅仅是更强大硬件、更大数据集、更大模型的结果，而主要是新的想法、算法和网络结构改进的结果。例如，ILSVRC 2014竞赛中最靠前的输入除了用于检测目的的分类数据集之外，没有使用新的数据资源。本文在ILSVRC 2014中的GoogLeNet提交实际使用的参数只有两年前Krizhevsky等人[9]获胜结构参数的1/12，而结果明显更准确。在目标检测前沿，最大的收获不是来自于越来越大的深度网络的简单应用，而是来自于深度架构和经典计算机视觉的协同，像Girshick等人[6]的R-CNN算法那样。

**另一个显著因素是随着移动和嵌入式设备的推动，算法的效率很重要——尤其是它们的电力和内存使用。值得注意的是，正是包含了这个因素的考虑才得出了本文中呈现的深度架构设计，而不是单纯的为了提高准确率。**对于大多数实验来说，模型被设计为在一次推断中保持15亿乘加的计算预算，所以最终它们不是单纯的学术好奇心，而是能在现实世界中应用，甚至是以合理的代价在大型数据集上使用。

在本文中将关注一个高效的计算机视觉深度神经网络架构，代号为Inception，它的名字来自于Lin等人[12]网络论文中的Network与著名的“we need to go deeper”网络梗图[1]的结合。在本文的案例中，单词“deep”用在两个不同的含义中：首先，在某种意义上，以“Inception module”的形式引入了一种新层次的组织方式，在更直接的意义上增加了网络的深度。一般来说，可以把Inception模型看作论文[12]的逻辑顶点同时从Arora等人[2]的理论工作中受到了鼓舞和引导。这种架构的好处在ILSVRC 2014分类和检测挑战赛中通过实验得到了验证，它明显优于目前的最好水平。



## 2. Related Work

从LeNet-5 [10]开始，卷积神经网络（CNN）通常有一个标准结构——堆叠的卷积层（后面可以选择有对比归一化和最大池化）后面是一个或更多的全连接层。这个基本设计的变种在图像分类论文中流行，并且目前为止在MNIST，CIFAR和更著名的ImageNet分类挑战赛中[9, 21]的已经取得了最佳结果。对于更大的数据集例如ImageNet来说，最近的趋势是增加层的数目[12]和层的大小[21, 14]，同时使用dropout[7]来解决过拟合问题。

尽管担心最大池化层会引起准确空间信息的损失，但与[9]相同的卷积网络结构也已经成功的应用于定位[9, 14]，目标检测[6, 14, 18, 5]和行人姿态估计[19]。

**受灵长类视觉皮层神经科学模型的启发，Serre等人[15]使用了一系列固定的不同大小的Gabor滤波器来处理多尺度。本文使用一个了类似的策略。**然而，与[15]的固定的2层深度模型相反，Inception结构中所有的滤波器是学习到的。此外，Inception层重复了很多次，在GoogLeNet模型中得到了一个22层的深度模型。

Network-in-Network是Lin等人[12]为了增加神经网络表现能力而提出的一种方法。在他们的模型中，网络中添加了额外的1 × 1卷积层，增加了网络的深度。本文的架构中大量的使用了这个方法。**但是，在本文的设置中，1 × 1卷积有两个目的：最关键的是，它们主要是用来作为降维模块来移除卷积瓶颈，否则将会限制网络的大小。这不仅允许了深度的增加，而且允许网络的宽度增加但没有明显的性能损失。**

最后，目前最好的目标检测是Girshick等人[6]的基于区域的卷积神经网络（R-CNN）方法。R-CNN将整个检测问题分解为两个子问题：利用低层次的信号例如颜色，纹理以跨类别的方式来产生目标位置候选区域，然后用CNN分类器来识别那些位置上的对象类别。这样Two-Stage的方法利用了低层特征分割边界框的准确性，也利用了目前的CNN非常强大的分类能力。我们在我们的检测提交中采用了类似的方式，但探索增强这两个阶段，例如对于更高的目标边界框召回使用多盒[5]预测，并融合了更好的边界框候选区域分类方法。

{{< admonition info>}}

R-CNN这一部分暂时跳过，看不懂，看完R-CNN论文回头再来看。

{{< /admonition >}}



## 3. Motivation and High Level Considerations

提高深度神经网络性能最直接的方式是增加它们的尺寸。这不仅包括增加深度——网络层次的数目——也包括它的宽度：每一层的单元数目。这是一种训练更高质量模型容易且安全的方法，尤其是在可获得大量标注的训练数据的情况下。但是这个简单方案有两个主要的缺点。

1. 更大的尺寸通常意味着更多的参数，这会使增大的网络更容易过拟合，尤其是在训练集的标注样本有限的情况下。这是一个主要的瓶颈，因为要获得强标注数据集费时费力且代价昂贵，经常需要专家评委在各种细粒度的视觉类别进行区分，例如图1中显示的ImageNet中的类别（甚至是1000类ILSVRC的子集）。

   {{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V1/Figure_1.png?raw=true" caption="图1" >}}

   > 图1: ILSVRC 2014分类挑战赛的1000类中两个不同的类别。区分这些类别需要领域知识。

2. 均匀增加网络尺寸的另一个缺点是计算资源使用的显著增加。例如，在一个深度视觉网络中，如果两个卷积层相连，它们的滤波器数目的任何均匀增加都会引起计算量以平方增加。如果增加的能力使用时效率低下（例如，如果大多数权重结束时接近于0），那么会浪费大量的计算能力。由于计算预算总是有限的，计算资源的有效分布更偏向于尺寸无差别的增加，即使主要目标是增加性能的质量。

**解决这两个问题的一个基本的方式就是引入稀疏性并将全连接层替换为稀疏的全连接层，甚至是卷积层。**他们的主要成果说明如果数据集的概率分布可以通过一个大型稀疏的深度神经网络表示，则最优的网络拓扑结构可以通过分析前一层激活的相关性统计和聚类高度相关的神经元来一层层的构建。虽然严格的数学证明需要在很强的条件下，但事实上这个声明与著名的赫布理论产生共鸣：神经元一起激发，一起连接。实践表明，基础概念甚至适用于不严格的条件下。

遗憾的是，当碰到在非均匀的稀疏数据结构上进行数值计算时，以现在的计算架构效率会非常低下。即使算法运算的数量减少100倍，查询和缓存丢失上的开销仍占主导地位：切换到稀疏矩阵可能是不可行的。随着稳定提升和高度调整的数值库的应用，差距仍在进一步扩大，数值库要求极度快速密集的矩阵乘法，利用底层的CPU或GPU硬件[16, 9]的微小细节。非均匀的稀疏模型也要求更多的复杂工程和计算基础结构。目前大多数面向视觉的机器学习系统通过采用卷积的优点来利用空域的稀疏性。然而，卷积被实现为对上一层块的密集连接的集合。为了打破对称性，提高学习水平，从论文[11]开始，ConvNets习惯上在特征维度使用随机的稀疏连接表，然而为了进一步优化并行计算，论文[9]中趋向于变回全连接。目前最新的计算机视觉架构有统一的结构。更多的滤波器和更大的批大小要求密集计算的有效使用。

这提出了下一个中间步骤是否有希望的问题：一个架构能利用滤波器水平的稀疏性，正如理论所认为的那样，但能通过利用密集矩阵计算来利用目前的硬件。稀疏矩阵乘法的大量文献（例如[3]）认为对于稀疏矩阵乘法，将稀疏矩阵聚类为相对密集的子矩阵会有更佳的性能。在不久的将来会利用类似的方法来进行非均匀深度学习架构的自动构建，这样的想法似乎并不牵强。

Inception架构开始作为案例研究，用于评估一个复杂网络拓扑构建算法的假设输出，该算法试图近似[2]中所示的视觉网络的稀疏结构，并通过密集的、容易获得的组件来覆盖假设结果。尽管是一个非常投机的事情，但与基于[12]的参考网络相比，早期可以观测到适度的收益。随着一点点调整加宽差距，作为[6]和[5]的基础网络，Inception被证明在定位上下文和目标检测中尤其有用。有趣的是，虽然大多数最初的架构选择已被质疑并分离开进行全面测试，但结果证明它们是局部最优的。然而必须谨慎：尽管Inception架构在计算机上领域取得成功，但这是否可以归因于构建其架构的指导原则仍是有疑问的。确保这一点将需要更彻底的分析和验证。



## 4. Architectural Details

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V1/Figure_2.png?raw=true" caption="图2" >}}



## 5. GoogLeNet

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V1/Table_1.png?raw=true" caption="表1" >}}

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V1/Figure_3.png?raw=true" caption="图3" >}}



## 6. Training Methodology





## 7. ILSVRC 2014 Classification Challenge Setup and Results

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V1/Table_2.png?raw=true" caption="表2" >}}

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V1/Table_3.png?raw=true" caption="表3" >}}



## 8. ILSVRC 2014 Detection Challenge Setup and Results

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V1/Table_4.png?raw=true" caption="表4" >}}

{{< image src="https://github.com/705248010/notes_images/blob/master/GoogleNet/V1/Table_5.png?raw=true" caption="表5" >}}



## 9. Conclusions





## References

{{< admonition quote "引用" false>}}

[1] Know your meme: We need to go deeper. http://knowyourmeme.com/memes/we-need-to-go-deeper. Accessed: 2014-09-15.

[2] S. Arora, A. Bhaskara, R. Ge, and T. Ma. Provable bounds for learning some deep representations. CoRR, abs/1310.6343, 2013.

[3] U. V. C ̧atalyu ̈rek, C. Aykanat, and B. Uc ̧ar. On two-dimensional sparse matrix partitioning: Models, methods, and a recipe. SIAM J. Sci. Comput., 32(2):656–683, Feb. 2010.

[4] J. Dean, G. Corrado, R. Monga, K. Chen, M. Devin, M. Mao, M. Ranzato, A. Senior, P. Tucker, K. Yang, Q. V. Le, and A. Y. Ng. Large scale distributed deep networks. In P. Bartlett, F. Pereira, C. Burges, L. Bottou, and K. Weinberger, editors, NIPS, pages 1232–1240. 2012.

[5] D. Erhan, C. Szegedy, A. Toshev, and D. Anguelov. Scalable object detection using deep neural networks. In CVPR, 2014.

[6] R. B. Girshick, J. Donahue, T. Darrell, and J. Malik. Rich feature hierarchies for accurate object detection and semantic segmentation. In Computer Vision and Pattern Recognition, 2014. CVPR 2014. IEEE Conference on, 2014.

[7] G. E. Hinton, N. Srivastava, A. Krizhevsky, I. Sutskever, and R. Salakhutdinov. Improving neural networks by preventing co-adaptation of feature detectors. CoRR, abs/1207.0580, 2012.

[8] A. G. Howard. Some improvements on deep convolutional neural network based image classification. CoRR, abs/1312.5402, 2013.

[9] A. Krizhevsky, I. Sutskever, and G. Hinton. Imagenet classification with deep convolutional neural networks. In Advances in Neural Information Processing Systems 25, pages 1106–1114, 2012.

[10] Y. LeCun, B. Boser, J. S. Denker, D. Henderson, R. E. Howard, W. Hubbard, and L. D. Jackel. Backpropagation applied to handwritten zip code recognition. Neural Comput., 1(4):541–551, Dec. 1989.

[11] Y. LeCun, L. Bottou, Y. Bengio, and P. Haffner. Gradient-based learning applied to document recognition. Proceedings of the IEEE, 86(11):2278–2324, 1998.

[12] M. Lin, Q. Chen, and S. Yan. Network in network. CoRR, abs/1312.4400, 2013.

[13] B. T. Polyak and A. B. Juditsky. Acceleration of stochastic approximation by averaging. SIAM J. Control Optim., 30(4):838–855, July 1992.

[14] P. Sermanet, D. Eigen, X. Zhang, M. Mathieu, R. Fergus, and Y. LeCun. Overfeat: Integrated recognition, localization and detection using convolutional networks. CoRR, abs/1312.6229, 2013.

[15] T. Serre, L. Wolf, S. M. Bileschi, M. Riesenhuber, and T. Poggio. Robust object recognition with cortex-like mechanisms. IEEE Trans. Pattern Anal. Mach. Intell., 29(3):411–426, 2007.

[16] F. Song and J. Dongarra. Scaling up matrix computations on shared-memory manycore systems with 1000 cpu cores. In Proceedings of the 28th ACM Interna- tional Conference on Supercomputing, ICS ’14, pages 333–342, New York, NY, USA, 2014. ACM.

[17] I. Sutskever, J. Martens, G. E. Dahl, and G. E. Hinton. On the importance of initialization and momentum in deep learning. In ICML, volume 28 of JMLR Proceed- ings, pages 1139–1147. JMLR.org, 2013.

[18] C.Szegedy,A.Toshev,andD.Erhan.Deep neural networks for object detection. In C. J. C. Burges, L. Bottou, Z. Ghahramani, and K. Q. Weinberger, editors, NIPS, pages 2553–2561, 2013.

[19] A. Toshev and C. Szegedy. Deeppose: Human pose estimation via deep neural networks. CoRR, abs/1312.4659, 2013.

[20] K. E. A. van de Sande, J. R. R. Uijlings, T. Gevers, and A. W. M. Smeulders. Segmentation as selective search for object recognition. In Proceedings of the 2011 International Conference on Computer Vision, ICCV ’11, pages 1879–1886, Washington, DC, USA, 2011. IEEE Computer Society.

[21] M. D. Zeiler and R. Fergus. Visualizing and understanding convolutional networks. In D. J. Fleet, T. Pajdla, B. Schiele, and T. Tuytelaars, editors, ECCV, volume 8689 of Lecture Notes in Computer Science, pages 818–833. Springer, 2014.

{{< /admonition >}}
