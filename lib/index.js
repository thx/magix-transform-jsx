// 参考
// https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-react-jsx/src/index.js
// https://github.com/babel/babel/blob/master/packages/babel-helper-builder-react-jsx/src/index.js

let esutils = require("esutils")
let t = require("@babel/types")
let tmplMxEventReg = /mx-(?!view|vframe|owner|autonomy|datafrom|guid|ssid|dep|html|static)([a-zA-Z]+)/;

let tagsProps = {
  '*': {
      lang: 'lang',
      spellcheck: 'spellcheck',
      draggable: 'draggable',
      id: 'id',
      class: 'className',
      className: 'className',
      title: 'title',
      slot: 'slot',
      dir: 'dir',
      accesskey: 'accessKey',
      contenteditable: 'contentEditable',
      tabindex: 'tabIndex',
      translate: 'translate',
      hidden: 'hidden'
  },
  input: {
      name: 'name',
      autofocus: 'autofocus',
      maxlength: 'maxLength',
      minlength: 'minLength',
      disabled: 'disabled',
      readonly: 'readOnly',
      value: 'value',
      placeholder: 'placeholder',
      required: 'required',
      size: 'size',
      pattern: 'pattern',
      multiple: 'multiple',
      src: 'src',
      autocomplete: 'autocomplete'
  },
  'input&checkbox': {
      disabled: 'disabled',
      checked: 'checked',
      value: 'value'
  },
  'input&radio': {
      disabled: 'disabled',
      checked: 'checked',
      value: 'value'
  },
  'input&number': {
      disabled: 'disabled',
      readonly: 'readOnly',
      value: 'value',
      placeholder: 'placeholder',
      size: 'size',
      max: 'max',
      min: 'min',
      step: 'step'
  },
  'input&range': {
      disabled: 'disabled',
      readonly: 'readOnly',
      value: 'value',
      max: 'max',
      min: 'min',
      step: 'step'
  },
  'input&file': {
      accept: 'accept'
  },
  textarea: {
      autofocus: 'autofocus',
      cols: 'cols',
      rows: 'rows',
      value: 'value',
      placeholder: 'placeholder',
      readonly: 'readOnly',
      required: 'required',
      maxlength: 'maxLength',
      minlength: 'minLength'
  },
  select: {
      disabled: 'disabled',
      multiple: 'multiple',
      size: 'size',
      required: 'required'
  },
  form: {
      autocomplete: 'autocomplete',
      novalidate: 'noValidate',
      'accept-charset': 'acceptCharset',
      action: 'action',
      target: 'target',
      method: 'method',
      enctype: 'enctype',
      name: 'name'
  },
  iframe: {
      src: 'src',
      scrolling: 'scrolling',
      sandbox: 'sandbox',
      width: 'width',
      height: 'height',
      name: 'name'
  },
  a: {
      href: 'href',
      charset: 'charset',
      hreflang: 'hreflang',
      name: 'name',
      rel: 'rel',
      rev: 'rev',
      type: 'type',
      target: 'target'
  },
  area: {
      href: 'href',
      coords: 'coords',
      shape: 'shape',
      target: 'target',
      nohref: 'noHref',
      alt: 'alt',
      name: 'name'
  },
  th: {
      colspan: 'colSpan',
      rowspan: 'rowSpan'
  },
  td: {
      colspan: 'colSpan',
      rowspan: 'rowSpan',
      nowrap: 'noWrap'
  },
  img: {
      src: 'src',
      alt: 'alt',
      width: 'width',
      height: 'height',
      usemap: 'useMap',
      ismap: 'isMap'
  },
  audio: {
      autoplay: 'autoplay',
      controls: 'controls',
      src: 'src',
      loop: 'loop',
      muted: 'muted',
      volume: 'volume'
  },
  video: {
      autoplay: 'autoplay',
      controls: 'controls',
      src: 'src',
      loop: 'loop',
      muted: 'muted',
      volume: 'volume',
      width: 'width',
      height: 'height'
  },
  button: {
      autofocus: 'autofocus',
      disabled: 'disabled',
      value: 'value',
      name: 'name'
  },
  canvas: {
      width: 'width',
      height: 'height'
  },
  progress: {
      max: 'max',
      value: 'value'
  },
  hr: {
      noshade: 'noShade'
  }
};
let allAttrs = {
  '*': {
      style: 'style',
  },
  label: {
      'for': 'for'
  },
  input: {
      type: 'type'
  },
  button: {
      type: 'type'
  }
};

function getProps(tag, type) {
  let globals = Object.assign({}, tagsProps['*']);
  let tags = tagsProps[tag];
  if (tags) {
      globals = Object.assign(globals, tags);
  }
  tags = tagsProps[tag + '&' + type];
  if (tags) {
      globals = Object.assign(globals, tags);
  }
  return globals;
}


let Visitor = function({ types: t }) {
  function isMagixExtend(node){
    return t.isMemberExpression(node) && node.property && node.property.name === 'extend' && node.object && t.isMemberExpression(node.object) && node.object.property && node.object.property.name === 'View'
  }
  function helper(opts) {
    const visitor = {}

    // 针对magix的事件，加一个特殊的属性
    visitor.CallExpression = {
      exit(path, file) {
        let node = path.node
        if(isMagixExtend(node.callee) && file.eventLists && file.eventLists.length > 0){
          let name = t.stringLiteral('__<'+file.eventLists.join(',')+'>')
          let value = t.nullLiteral()
          let properties = node.arguments[0].properties
          properties.push(t.objectProperty(name,value))
        } 
      }
    }
    visitor.JSXElement = {
      exit(path, file) {
        const callExpr = buildElementCall(path, file)
        if (callExpr) {
          path.replaceWith(t.inherits(callExpr, path.node))
        }
      },
    }
    // visitor.JSXFragment = {
    //   exit(path, file) {
    //     const callExpr = buildFragmentCall(path, file)
    //     if (callExpr) {
    //       path.replaceWith(t.inherits(callExpr, path.node))
    //     }
    //   },
    // }

    return visitor

    function convertJSXIdentifier(node, parent) {
      if (t.isJSXIdentifier(node)) {
        if (node.name === "this" && t.isReferenced(node, parent)) {
          return t.thisExpression()
        } else if (esutils.keyword.isIdentifierNameES6(node.name)) {
          node.type = "Identifier"
        } else {
          return t.stringLiteral(node.name)
        }
      } else if (t.isJSXMemberExpression(node)) {
        return t.memberExpression(
          convertJSXIdentifier(node.object, node),
          convertJSXIdentifier(node.property, node),
        );
      } else if (t.isJSXNamespacedName(node)) {
        /**
         * If there is flag "throwIfNamespace"
         * print XMLNamespace like string literal
         */
        return t.stringLiteral(`${node.namespace.name}:${node.name.name}`);
      }

      return node;
    }

    function convertAttributeValue(node) {
      if (t.isJSXExpressionContainer(node)) {
        return node.expression;
      } else {
        return node;
      }
    }

    function convertAttribute(node,file) {
      const value = convertAttributeValue(node.value || t.booleanLiteral(true));

      if (t.isStringLiteral(value) && !t.isJSXExpressionContainer(node.value)) {
        value.value = value.value.replace(/\n\s+/g, " ");

        // "raw" JSXText should not be used from a StringLiteral because it needs to be escaped.
        if (value.extra && value.extra.raw) {
          delete value.extra.raw;
        }
      }
      
      // 需要做属性转换，onClick => mx-click
      if(/on([A-Z][\w\W]+)/.test(node.name.name)){
        node.name.name = node.name.name.replace(/on([A-Z][\w\W]+)/g,function(match,Key){
          return 'mx-' + Key.toString().toLowerCase()
        })
      }

      // 针对click等事件属性，需要专门记录下来
      let match = node.name.name.match(tmplMxEventReg)
      if(match && match[1]){
        file['eventLists'] = file['eventLists'] || []
        if(!file['eventLists'].includes(match[1])) file['eventLists'].push(match[1])
      }

      if (t.isValidIdentifier(node.name.name)) {
        node.name.type = "Identifier";
      } else {
        node.name = t.stringLiteral(
          t.isJSXNamespacedName(node.name)
            ? node.name.namespace.name + ":" + node.name.name.name
            : node.name.name,
        );
      }

      return t.inherits(t.objectProperty(node.name, value), node);
    }

    function buildElementCall(path, file) {
      if (opts.filter && !opts.filter(path.node, file)) return;

      const openingPath = path.get("openingElement");
      openingPath.parent.children = t.react.buildChildren(openingPath.parent);

      const tagExpr = convertJSXIdentifier(
        openingPath.node.name,
        openingPath.node,
      );
      const args = [];

      let tagName;
      if (t.isIdentifier(tagExpr)) {
        tagName = tagExpr.name;
      } else if (t.isLiteral(tagExpr)) {
        tagName = tagExpr.value;
      }

      const state = {
        tagExpr: tagExpr,
        tagName: tagName,
        args: args,
      }

      if (opts.pre) {
        opts.pre(state, file);
      }

      let attribs = openingPath.node.attributes;
      if (attribs.length) {
        attribs = buildOpeningElementAttributes(attribs, file, state);
      } else {
        attribs = t.nullLiteral();
      }

      args.push(attribs, ...path.node.children);

      if (opts.post) {
        opts.post(state, file);
      }

      return state.call || t.callExpression(state.callee, args);
    }

    function pushProps(_props, objs) {
      if (!_props.length) return _props;

      objs.push(t.objectExpression(_props));
      return [];
    }

    /**
     * The logic for this is quite terse. It's because we need to
     * support spread elements. We loop over all attributes,
     * breaking on spreads, we then push a new object containing
     * all prior attributes to an array for later processing.
     */

    function buildOpeningElementAttributes(attribs, file, state) {
      let _props = [];
      let tagName = state.tagName;
      const objs = [];

      const useBuiltIns = file.opts.useBuiltIns || false;
      if (typeof useBuiltIns !== "boolean") {
        throw new Error(
          "transform-jsx currently only accepts a boolean option for " +
            "useBuiltIns (defaults to false)",
        );
      }

      let hasMxView = false

      if(!t.react.isCompatTag(state.tagName)){ // 如果是大写的，那么代表是 magix view
        hasMxView = true
      }

      while (attribs.length) {
        const prop = attribs.shift();

        if (t.isJSXSpreadAttribute(prop)) {
          _props = pushProps(_props, objs);
          objs.push(prop.argument);
        } else {
          // 有magix view
          if(!hasMxView && /mx-view/.test(prop.name.name)){
            hasMxView = true
          }

          
          _props.push(convertAttribute(prop,file));
          
          
        }
      }
      // 针对是 magix view的 需要作出属性的转换     <div mx-view="xxx"   a='222'  class="mmmm"></div> => <div mx-view="xxx"   view-a='222'  class="mmmm"></div>
      if(hasMxView){
        _props.forEach(prop => {
          // 针对magix-view的 特殊属性添加view前缀
          let type = t.isIdentifier(prop.key) ? 'name' : 'value'
          let name = prop.key[type]
          if(!/^mx-/.test(name) && !/^view-/.test(name) && !getProps(tagName)[name]){
            prop.key = t.stringLiteral(
              'view-' + name  // 添加view-前缀
            )
          }
        })
      }

      pushProps(_props, objs);

      if (objs.length === 1) {
        // only one object
        attribs = objs[0];
      } else {
        // looks like we have multiple objects
        if (!t.isObjectExpression(objs[0])) {
          objs.unshift(t.objectExpression([]));
        }

        const helper = useBuiltIns
          ? t.memberExpression(t.identifier("Object"), t.identifier("assign"))
          : file.addHelper("extends");

        // spread it
        attribs = t.callExpression(helper, objs);
      }

      return attribs;
    }

    // function buildFragmentCall(path, file) {
    //   if (opts.filter && !opts.filter(path.node, file)) return;

    //   const openingPath = path.get("openingElement");
    //   openingPath.parent.children = t.react.buildChildren(openingPath.parent);

    //   const args = [];
    //   const tagName = null;
    //   const tagExpr = file.get("jsxFragIdentifier")();

    //   const state = {
    //     tagExpr: tagExpr,
    //     tagName: tagName,
    //     args: args,
    //   };

    //   if (opts.pre) {
    //     opts.pre(state, file);
    //   }

    //   // no attributes are allowed with <> syntax
    //   args.push(t.nullLiteral(), ...path.node.children);

    //   if (opts.post) {
    //     opts.post(state, file);
    //   }

    //   file.set("usedFragment", true);
    //   return state.call || t.callExpression(state.callee, args);
    // }
  }

  let visitor = helper({
    pre(state) {
      const tagName = state.tagName;
      const args = state.args;
      // https://github.com/babel/babel/blob/master/packages/babel-types/src/validators/react/isCompatTag.js
      if (t.react.isCompatTag(tagName)) {  // start with a lowercase ASCII letter  
        args.push(t.stringLiteral(tagName));
      } else {
        // 否则就是变量,也就是组件的场景，这个时候我们需要修改为 mx-view='xxxx'
        // <Hello />   => <div mx-view="hello"></div>    // 还要注意提前注册
        // 通用转换 <mx-loading />  => <div mx-view="xxxxx">
        args.push(state.tagExpr);
      }
    },
    post(state, pass) {
      // 从属性里面找出传参
      // let attribs = state.args[1]
      // if(attribs && attribs.properties && attribs.properties.length > 0){
      //   let compareKey,key,value
      //   compareKey = ''
      //   attribs.properties.forEach(function(attr){
      //     key = attr.key.value
      //     value = attr.value.value
      //   })
      // }
      // 通用的创建
      const createMEM = t.memberExpression(t.thisExpression(),t.identifier('$vcr'))
      state.callee = createMEM
    }
  })
  return {
    inherits: require("babel-plugin-syntax-jsx"),
    visitor: visitor
  }
}


module.exports = Visitor
