### lens demo
这里演示lens使用的目录结构和使用方法

### 如何使用
1，首先安装lens cli包
```
npm i -g @zuoyanart/lens
```

2, 在此目录根目录下运行命令
```
lens g [platform] //platform: h5 or uniapp
```
比如，要生成h5的页面， 就执行
```js
lens g h5
```

因为lens是全局安装， 此目录可以放在任意一个文件夹路径里

#### 目录结构
├─ h5 `生成的的h5文件所在目录，会自动创建`
├─.yunjinrc  `运行配置文件`
├─ source `Sketch文件，可以在配置文件中自由指定`



### 配置文件
`.yunjinrc.js`是lens读取的配置文件， 里面的配置基本都有注释， 可以自行查看， 基本不需要修改
