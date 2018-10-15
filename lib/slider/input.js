var toolbox     = require( 'compose-toolbox' ),
    template    = require( './template' ),
    events      = require( './events' )

function setup() {
  events.watch()

  toolbox.event.change( function() {
    // Don't select previously setup sliders
    var ranges = document.querySelectorAll('[type=range]:not(.slider-input)')

    toolbox.each( ranges, function(slider){
      var data = events.cache( slider )
      slider = init( slider, data )
      events.change( slider )
    })
  })
}

function init( slider, data ) {
  // Set slider class so that it won't be setup twice
  slider.classList.add( 'slider-input' )

  // Match defaults
  slider.setAttribute( 'min', data.min )
  slider.setAttribute( 'max', data.max )

  // Don't let the browser select a default value
  if(!slider.getAttribute('value')) slider.setAttribute( 'value', data.min )
  data.initialValue = slider.dataset.initialValue = slider.value

  if(!slider.getAttribute('id')) slider.setAttribute( 'id', 'slider'+data.id )
  // Insert the template right before the slider
  slider.insertAdjacentHTML( 'beforebegin', template.html( data, slider.outerHTML ) )
  // Grab a reference to new slider container
  var container = slider.previousSibling
  // remove old slider
  slider.parentNode.removeChild(slider)

  // return new slider
  return container.querySelector('.slider-input')
}


module.exports = {
  setup: setup
}
