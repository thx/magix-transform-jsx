let JSX = require('../index.js')

// http://astexplorer.net/#/Z1exs6BWMq
// https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-babylon
// https://babeljs.io/docs/core-packages/

let code = `
var a =  function(){
  if(data.key==1){
    return (
      <div data-id="2222">
        <Test view-x="2222" m={{a:1111}} class="xxx"/>
        <span class="mmmm" id="2222">1111</span>
        <span onClick={this.testcb.bind(this,{a:222})} test="2">2222</span>
      </div>
    )
  }
};
`


let result = JSX.transform(code).code



console.log(result)
