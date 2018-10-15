var toolbox = require( 'compose-toolbox' ),
    extractData = require( './extract-data' ),
    objectSize = require( './object-size' ),
    Event = toolbox.event,
    watching = false


function change ( event ) {
  if ( event.currentTarget.outerHTML.match(/data-step-label/) )
    injectLabels( event.currentTarget )
}

function injectLabels ( input ) {
  // Grab only the labels and values for this index

  var labels = getLabels( input ) // example:  { disk: '15GB' } 

  for ( key in labels ) {
                                      // [data-step-label="disk"]
    var el = document.querySelector( '[data-step-label="'+key+'"]' )

    if (el) {
      // If user has a specific child element of $el they want to inject label text into
      var container = el.querySelector('.label-content')
      if ( container ) { container.innerHTML = labels[key] }

      // Else inject full label template into $el
      else { el.innerHTML = labelHTML(labels[key]) }
    }
  }
}

function getLabels (el) {
  var index = getIndex( el )

  if (typeof index == undefined) return {} // Element is out of bounds of input

  var labels = extractData( el, 'data-step-label' ),
      selected = {},
      labelNotFound


  for ( label in labels ) {
    var selectedLabel = labels[label].split(';')[index]

    // If label not found at index, bail out.
    if (!selectedLabel) labelNotFound = true

    selected[label] = selectedLabel
  }

  if (labelNotFound) { return {} }
  else return selected
}

function getIndex (el) {
  var min = Number(el.getAttribute('min') || 0),
      max = Number(el.getAttribute('max') || 100),
      step = Number(el.getAttribute('step'))
      value = Number(el.value)
  if ( !step ) step = 1

  // Element is out of bounds of input
  if (value % step != 0) return
  // The nubmer of units is the number of steps between min and max
  var units = ( max - min ) / step
  
  // Return the current step number
  return ( value / step ) - ( min / step )
}

function labelHTML (label) {
  return "<span class='label-content'>" + label + "</span>"
}

function watch(delay) {
  if ( !watching ) {
    watching = true

    Event.ready(function(){
      Event.on( document, 'input', "input[type='range'][data-has-step-labels], input[step][data-has-step-labels]", change )

      var inputs = toolbox.slice(document.querySelectorAll('input[step],input[type="range"]'))
      inputs.forEach(function(input) {
        if ( objectSize(extractData(input, 'data-step-label')) > 0 ) {
          input.dataset.hasStepLabels = true
          injectLabels(input)
        }
      })
    })
  }
}

module.exports = {
  watch: watch
}
