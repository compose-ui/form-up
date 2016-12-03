var assert = require('chai').assert
var toolbox = require( 'compose-toolbox' )
var Event = toolbox.event

// Utlitiy function for easily appending to HTML
var Utils = {

  injectHTML: function( el, html ) {

    el.insertAdjacentHTML( 'beforeend', html )

    return el.lastChild
  },

  container: function() {
    var div = document.querySelector('.container')

    if ( !div ){
      div = Utils.injectHTML( document.body, '<div class="container"></div>' )
    } else {
      div.innerHTML = ''
    }
    return div
  },

  addInput: function( form, options ) {

    options = options || {}

    defaults = {
      required: true,
      type: 'text'
    }

    var label = Utils.injectHTML( form, '<label></label>' )
    var input = Utils.injectHTML( label, '<input />' )

    for ( var attr in defaults ) { input.setAttribute( attr, defaults[attr] ) }
    for ( var attr in options ) { input.setAttribute( attr, options[attr] ) }

    return input
  },

  submit: function( form ) {
    Event.fire( form, 'submit' )
  },

  setValue: function( input, value ) {
    input.setAttribute( 'value', value )
    input.value = value
    Event.fire( input, 'blur' )
  },

  isValid: function( input ) {
    assert.isTrue( input.checkValidity() == true && input.parentNode.classList.contains( 'valid' ) )
  },

  isInvalid: function( input ) {
    assert.isTrue( input.checkValidity() == false && input.parentNode.classList.contains( 'invalid' ) )
  }
}

module.exports = Utils
