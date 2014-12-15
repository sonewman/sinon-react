module.exports = exports = function (sinon) {
  return new SinonReact(sinon)
}
exports.SinonReact = SinonReact

var React = require('react')
var cheerio = require('cheerio')
var isBrowser = global.document ? true : false
var defaultContainer

function SinonReact(sinon) {
  this.sinon = sinon
  this._rendered = []
  this._mutated = []
}

function getDefaultContainer() {
  if (defaultContainer) {
    return defaultContainer
  }
  
  var el = document.createElement('div')
  var body = document.getElementsByTagName('body')[0]
  body.appendChild(el)
  defaultContainer = el
  return el
}

function renderInBrowser(sr, comp, cont, cb) {
  if (isFunc(cont)) {
    cb = cont
    cont = undefined
  }

  if (!cont) cont = getDefaultContainer()

  var rc = isFunc(cb)
    ? React.render(comp, cont, cb)
    : React.render(comp, cont)
  
  sr.rendered.push(rc)
  return rc
}

function isFunc(obj) { return 'function' === typeof obj }

SinonReact.prototype.render = function (component, container, cb) {
  return isBrowser
    ? renderInBrowser(this, component, container, cb)
    : React.renderToStaticMarkup(component, container)
}

function reactClassCtor(reactClass) {
  return reactClass.type                // React 0.11.1
    || reactClass.componentConstructor  // React 0.8.0
}

function reactClassProto(reactClass) {
  var ctor = reactClassCtor(reactClass)
  if (!ctor) {
    throw new Error(
      'A component constructor could not be found for this class. '
      + 'Are you sure you passed in a the component definition for a React component?'
    )
  }

  return ctor.prototype
}

function stubOrSpy(sr, which, obj, attr, spy) {
  var orig = obj[attr]

  sr._mutated.push({
    obj: obj
    , attr: attr
    , orig: orig
    , spy: spy
  })

  return spy;
}

function stubOrSpyReactClass(sr, which, reactClass, method) {
  var proto = reactClassProto(reactClass)
  var spy = sr.sinon[which](proto, method)

  // react.js will autobind `this` to the correct value and it caches that
  //  result on a __reactAutoBindMap for performance reasons.
  if(proto.__reactAutoBindMap)
    proto.__reactAutoBindMap[method] = spy;

  return stubOrSpy(sr, which, proto, method, spy)
}

SinonReact.prototype.stubClassMethod = function (reactClass, method) {
  return stubOrSpyReactClass(this, 'stub', reactClass, method)
}

SinonReact.prototype.spyOnClassMethod = function (reactClass, method) {
  return stubOrSpyReactClass(this, 'spy', reactClass, method)
}

SinonReact.prototype.setClassAttribute = function (reactClass, attribute, value) {
  reactClassProto(reactClass)[attribute] = value
  return reactClass
}

SinonReact.prototype.stubComponent = function (obj, attr) {
  var comp = React.createClass({
    render: function () {
      return React.DOM.div()
    }
  })
  stubOrSpy(this, 'stub', obj, attr, comp)
  return comp
}

function restore(item) {
  var obj = item.obj
  var spy = item.spy

  if (obj.__reactAutoBindMap)
    obj.__reactAutoBindMap[item.method] = item.orig

  obj[item.method] = item.orig
  if (spy && isFunc(spy.restore)) spy.restore()
}

SinonReact.prototype.restore = function () {
  // we need to do this one by one even if
  // `this.sinon` is a sandbox because we also
  // potentially need to reset `obj.__reactAutoBindMap`
  for (var i = 0; i < this._mutated.length; i++)
    restore(this._mutated[i])

  this._mutated = []
  unmountAll(this._rendered)
  this._rendered = []
  
  // if `this.sinon` is a sandbox
  if (isFunc(this.sinon.restore))
    this.sinon.restore()
}

function unmountAll(rendered) {
  for (var i = 0; i < rendered.length; i++)
    unmount(rendered[i]);
}

function isMounted(comp) {
  return !!component
    && isFunc(comp.isMounted)
    && comp.isMounted()
}

function unmount(component){
  return isMounted(component)
    ? React.unmountComponentAtNode(component.getDOMNode().parentNode)
    : false
}

SinonReact.$ = function (el) {
  el = isFunc(el.getDOMNode)
    ? el.getDOMNode().outerHTML
    : el

  return cheerio.load(el)
}
