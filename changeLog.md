## 2.0.0 beta
修复生成非h5平台时，preview生成样式文件错误的bug
## 2.0.1 beta
修复解析字体图标，但字体图标关于字体的信息不全导致的解析出错bug
修复图片被判定为背景后， css解析出错bug
## 2.0 beta
* dom相似度判断成功后class命名规范
* `生成的vue目标需要格式化`
## 1.0.5 mandrake
* `去除关于runtime中文件的读写操作， 防止出现占用的情况`
* `绝对定位加强`
* 符号识别增强//// 根据SymbolInstance和SymbolMaster的尺寸比例，等比例转换symbolMaster的坐标尺寸，作为实例SymbolInstance的坐标尺寸。
* table识别增强
* `文字宽高识别增强`
* 自动组合图形探索
* `修复路径 联合 颜色填充随父元素填充none的bug`
* `通过svgToImg把画板整个生成svg的方式导出2倍图，可以去除输入需要设计师导出两倍图的步骤，只要一个sketch文件即可`
* `isEmptyLayer是否应该放到_formatLayout方法前执行//新增isEmptyLayerSlef方法增强判断`
* `文本自适应css增强`
* `文本行高修正`
* `修复文本自适应的bug`
* `字体缺失提示和自动加载系统字体`
* `去除node-sass依赖，解决node-sass编译以及版本问题`
* `uniapp ast转换修复图片路径bug`
* `重新成组的时候，新增规则： 文字不存在子元素`
* overflow:hidden 的判断
* `执行流程问题：styleReset应放在parseLayer的feature之前执行，然后在feature中才能判断成组成list`
* `修复圆形识别成图片的bug`
* `成组成列增强`
* `左右布局样式加强, just-content:space-between;`
* ~~list首个重置样式，转移到前一个对象上，方便做循环~~
* `一段文本中出现有多个样式，忽略margin的bug`
* `删除height忽略padding-bottom的bug`
* 居底对齐css适配
* `修复tag类型父对象定宽的bug`
* `角标识别`
* `每次都生成h5 preview文件， 按照画板来划分文件夹`
* 图片去重，icon识别
* icon识别-图片分类
* `遮罩识别`
* 清除文本首位换行
## 1.0.4 mandrake
* `swiper dot/tab 类短横元素判断`
* `list识别耗费性能问题`
* `cli运行友好交互加强`
* `svg图层合并模式（相交，相差, 联合，减去顶层等）`
* `修复颜色换算bug`
* `puppter Timed out after 30000 ms while trying to connect to the browser bug`
* `svg高斯模糊`
* `textAlign读取错误bug`
* `图片列表样式特列样式丢失问题`
* `修复短横与border判断错误的bug`
## 1.0.3 mandrake
* `修复圆角判断规则`
* `字体是否添加到svg的判断`
* `字体添加到svg中,使用的是foreignObject属性`
* `svg中文字处理字号小于12号字的情况`
* `svg图像圆角处理`
* `单个字体元素svg中文字margin处理不正确问题`
* `文字分段样式识别`
* `线性渐变NAN的问题`
* `svg中图片填充颜色问题`
* `画板首图做为画板背景的特征判断`
* `去不掉：测试去掉设计稿截图算法或者优化截图算法，严选1.1.0首页测试`
* `html格式化`
  
## 1.0.2 mandrake
* `不可见元素清除bug`
* `处理图片被遮住而代码显示全部的问题`
* `元素为空白元素的判断有bug`
* `positon 判断在判断和border相交时出现bug`
* `修复元素重组时排序问题： 当x,y都相等时，应按照面积排序，面积大的在前面`
* `新增元素遮挡判断`
* `svg背景图的识别加强(对分组有依赖)`
## 1.0.1 mandrake

* `margin塌陷问题`
* `横向成组和纵向成组判断加强， 此处最好是上机器学习`
* `图片名称和目录组织`
* `css单位在个平台间的转换`
* `margin-right: auto; margin-left: auto; 在宽度100%的时候应去掉`
* `justify-content: center; 只有在display：flex的元素中才添加`
* `background-color需要判断内元素是否充满了容器，如果充满则不添加`
* `如果元素删除，则样式要被删除掉`
* `生成的代码难以格式化问题`
* `配置文件定义`
* `list高度计算错误问题, 这个是由补齐父对象高度引起`
* `list算法增强， 内部1级元素去除重复项再比较`
* `需要height样式的情况梳理`
* `要有子元素，只有一行元素`
* `fontWeight样式未识别`
* `最后一个元素的marginBottom样式未计算`
* `header未识别`
* `三个元素成行 样式推导`
* `border合并的时候：判断下个兄弟是否是border，如果不是则合并下个相邻兄弟的margin到height和centerY`
* `修复空元素判断，当是空元素的时候会跳过子元素判断的bug`
* `修复margin-left:auto, margin-right:auto 只有在只有一个元素才设置的bug`
* `如果没有margin-top则删除防止margin塌陷的代码（border-top）`
* `svg判断逻辑bug`
* `计算图片的显示面积`

## 1.0.0
* `分组高度 设计稿高度不对问题`
* `positon布局推导问题`
* `分割线border处理`
* `just-content:space-between;`
* `纵向list识别`
* `实用difflib 删除掉所有相同的子元素，然后再比较`
