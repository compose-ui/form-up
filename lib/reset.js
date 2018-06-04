var Event = require( 'compose-event' ),
    toolbox = require( 'compose-toolbox' )

function setValue(input, value) {

  // Trigger event watchers that the input was changed.
  if ( input.value != value ) {
    input.value = value
    Event.fire( input, 'input' )
  }

    if ( input.dataset.unit ) {
      var select = document.querySelector('[data-unit-select="'+input.dataset.unitKey+'"]')
      if ( select && select.classList.contains('input-changed') ) {
        select.value = input.dataset.unit
        Event.fire( select, 'input' )
      }
    }
}

function restoreDefault( event ) {
  var targets = document.querySelectorAll( event.currentTarget.dataset.restoreDefault )

  Array.prototype.forEach.call( targets, el => {

    // Restore to default a single element
    if ( el.dataset.default ) {
      setValue( el, el.dataset.default )
    } else {

      // Restore all inputs to default when
      // data-restore-default points to a parent element
      Array.prototype.forEach.call( el.querySelectorAll( '[data-default]' ), child =>{
        setValue( child, child.dataset.default )
      })
    }
  })
}

function resetValue( event ) {
  var inputs = document.querySelectorAll( event.currentTarget.dataset.resetInput )

  Array.prototype.forEach.call( inputs, i => {
    setValue( i, i.dataset.initialValue )
  })
}

function resetForm(event) {
  var form = toolbox.getClosest( event.target, 'form' )
  Event.delay( function() {
    toolbox.each( form.querySelectorAll( 'input, select, textarea' ), function( el ) {
      Event.fire(el, 'input')
    })
  }, 100)
}

Event.on( document, 'click', '[data-reset-input]', resetValue )
Event.on( document, 'click', '[type=reset]', resetForm )
