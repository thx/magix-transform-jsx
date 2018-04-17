
let visitor = require('./lib/index.js')
let babel = require("babel-core");
let path = require('path')
// import * as babylon from "babylon";
// import generate from "babel-generator";

// let babylon = require('babylon')
// let generate = require('babel-generator').default
// let traverse = require('babel-traverse').default
// let types = require('@babel/types')
// 提供私有api，直接转换，不依赖webpack的babel-loader
let Transform = visitor


Transform.transform = function(code,options){
  options = Object.assign({
    // parserOpts:{
    //   'jsx'
    // },
    presets: ['env','stage-0'],
    plugins:[path.resolve(__dirname, './lib/index.js')]
  },options)
  return babel.transform(code, options)
}



module.exports = Transform