# jsx转换插件

用于将magix代码中的jsx模板写法，转换成magix需要的vdom格式。达到在magix里面写jsx的目的。

目前已经实现jsx的所有语法：示例代码如下：

```
import * as Magix from "../lib/magix"
import Test from "./test.jsx"

module.exports = Magix.View.extend({
  tmpl: function (data) {
    var a1='"';
    if(data.key==1){
      return (
        <div data-id="2222">
          <Test x="2222" m={{a:1111}} class="xxx"/>
          <span class="mmmm" id="2222">1111</span>
          <span onClick={this.testcb.bind(this,{a:222})} test="2">2222</span>
        </div>
      )
    }else{
      return (
        <div data-id="2222">eeeeee</div>
      )
    }
  },
  ctor: function (opt) {

  },
  render: function () {

    this.updater.digest()
    setTimeout(()=>{
      this.updater.set({
        "key":1
      }).digest()
    },1000)
  },
  testcb: function(data,e){
    console.log(data)
  }
})

```


## 安装使用

```

tnpm install magix-transform-jsx --save
```

### webpack

配置babel插件

```
module: {
  rules:[
    {
      test: /\.(jsx|js)$/,
      // exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['env','stage-0'],
          plugins: ['magix-transform-jsx']
        }
      }
    }
  ]
}
```

### 其他场景

使用api转换

```
let transform = require('magix-transform-jsx')

transform.parase('')
transform.generate('')

```