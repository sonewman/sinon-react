require('should')
var React = require('react')
var sinon = require('sinon')
var SinonReact = require('../../').SinonReact

describe('SinonReact', function () {
  var Component

  describe('#render(component, container)', function () {
    beforeEach(function () {
      Component = React.createClass({
        getName: function () {
          return 'John'
        }
        , render: function () {
          return React.createElement('div', null, 'Hello ', this.getName())
        }
      })
    })
    
    it('Should rendered React Component as string as on server', function () {
      new SinonReact(sinon)
        .render(React.createElement(Component))
        .should.equal('<div>Hello John</div>')
    })
  })
  
  describe('#stubClassMethod(Component, attribute)', function () {
    beforeEach(function () {
      Component = React.createClass({
        getName: function () {
          return 'John'
        }
        , render: function () {
          return React.createElement('div', null, 'Hello ', this.getName())
        }
      })
    })
    
    it('Should allow a user to stub a ReactClass method', function () {
      var sr = new SinonReact(sinon)
      var getName = sr.stubClassMethod(Component, 'getName')
      sr.render(React.createElement(Component))
      sinon.assert.calledOnce(getName)
    })
  })

  describe('#spyOnClassMethod(Component, attribute)', function () {
    var getNameCall = sinon.stub()

    beforeEach(function () {
      Component = React.createClass({
        getName: function () {
          getNameCall()
          return 'John'
        }
        , render: function () {
          return React.createElement('div', null, 'Hello ', this.getName())
        }
      })
    })
    
    it('Should allow a user to spy on a ReactClass method', function () {
      var sr = new SinonReact(sinon)
      var getNameSpy = sr.spyOnClassMethod(Component, 'getName')
      var html = sr.render(React.createElement(Component))
      sinon.assert.calledOnce(getNameSpy)
      sinon.assert.calledOnce(getNameCall)
      html.should.equal('<div>Hello John</div>')
    })
  })
  
  describe('#setClassMethod(reactClass, attribute, value)', function () {
    beforeEach(function () {
      Component = React.createClass({
        name: 'John'
        , getName: function () {
          return this.name
        }
        , render: function () {
          return React.createElement('div', null, 'Hello ', this.getName())
        }
      })
    })
    
    it('Should allow a user set an attribute on a ReactClass', function () {
      var sr = new SinonReact(sinon)
      sr.setClassAttribute(Component, 'name', 'Jack')
      var html = sr.render(React.createElement(Component))
      html.should.equal('<div>Hello Jack</div>')
    })
  })

  describe('#stubComponent(obj, attribute)', function () {
    beforeEach(function () {
      this.childRendered = sinon.stub()
      this.Child = React.createClass({
        render: function () {
          this.childRendered()
          return React.createElement('div', null, 'Hello World')
        }.bind(this)
      })
      
      this.Parent = React.createClass({
        render: function () {
          return React.createElement('div', null, this.Child)
        }.bind(this)
      })
    })

    it('Should stub out a component', function () {
      var sr = new SinonReact(sinon)
      sr.stubComponent(this, 'Child')
      sr.render(React.createElement(this.Parent))
      sinon.assert.notCalled(this.childRendered)
    })
  })

  describe('#$(element)', function () {
    it('Should take virtual DOM node and return a cheerio object', function () {
      var el = {
        getDOMNode: function () {
          return { outerHTML: '<div>test string</div>' }
        }
      }
      
      var $ = SinonReact.$(el)
      $('div').html().should.equal('test string')
    })
    
    it('Should take a html string and return a cheerio object', function () {
      var $ = SinonReact.$('<div>test string</div>')
      $('div').html().should.equal('test string')
    })
  })
})
