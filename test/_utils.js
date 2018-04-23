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

  addInput: function( form, options, tag ) {

    options = options || {}
    tag = tag || '<input type="text">'

    defaults = {
      required: true,
    }

    var label = Utils.injectHTML( form, '<label></label>' )
    var input = Utils.injectHTML( label, tag )

    for ( var attr in defaults ) { input.setAttribute( attr, defaults[attr] ) }
    for ( var attr in options ) { input.setAttribute( attr, options[attr] ) }

    return input
  },

  submit: function( form ) {
    Event.fire( form.querySelector('[type=submit]'), 'click' )
  },

  setValue: function( input, value ) {
    input.setAttribute( 'value', value )
    input.value = value
    Event.fire( input, 'blur' )
  },

  selectOption: function( select, index ) {
    select.selectedIndex = index

    // Shabby test code justification: It's really hard to trigger events in tests, so this
    // short circuits the system. It's not ideal but for now
    // it'll do.
    select.parentNode.classList.toggle( 'invalid', !select.checkValidity() )
    select.parentNode.classList.toggle( 'valid', select.checkValidity() )

  },

  isValid: function( input ) {
    expect( input.checkValidity() && input.parentNode.classList.contains( 'valid' )).toBeTruthy()
  },

  isInvalid: function( input ) {
    expect( !input.checkValidity() && input.parentNode.classList.contains( 'invalid' ) ).toBeTruthy()
  }
}

module.exports = Utils
