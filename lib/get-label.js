var toolbox = require( 'compose-toolbox' )
var Selector = require( './selector' )

function getInput ( input ) {
  if ( typeof input == 'string' ) input = document.querySelector( input )
  return input
}

function getLabel ( input ) {

  input = getInput( input )
  if (!input) return

  // Label wraps input
  var label = toolbox.getClosest( input, 'label' ) || document.querySelector( `label[for="${input.id}"]` )

  return label
}

function getAriaLabel( input ) {
  input = getInput( input ); if (!input) return
  var label = input.getAttribute('aria-label')
  var labelledBy = input.getAttribute( 'aria-labelledby' )

  if ( !label && labelledBy ) {

    // aria-labelledby='someID anotherID' must read multiple elements text content.
    // This creates a selector (prepending the '#' before each) to find the labels.
    //
    var selector = labelledBy.split(' ').map( function ( name ) { return '#'+name } )

    var labelText = Array.prototype.map.call( selector, function( s ) { 
      var el = document.querySelector( s )
      if ( el ) return el.textContent
      else return false
    }).filter( function ( e ) { return e != false } )

    if ( labelText ) label = labelText.join(' ')
  }

  return label
}

// Are inputs in a fieldset with a legend?
// Use that as the label text
function getLegendText ( input ) {
  input = getInput( input ); if (!input) return
  var legendText

  var fieldset = toolbox.getClosest( input, 'fieldset' )

  if ( fieldset ) {
    var legend = fieldset.querySelector( 'legend' )
    if ( legend ) legendText = legend.textContent.trim()
  }

  return legendText
}


function getLabelText ( input ) {
  input = getInput( input ); if (!input) return

  var label = getLabel( input )

  // Grab text from input aria-label, aria-labelledby
  var labelText = getAriaLabel( input )

  // Use or label.textContent, or input placeholder=""
  if ( !labelText ) {
    if (label) labelText = label.textContent

    else labelText = input.getAttribute( 'placeholder' )
  }

  if ( labelText ) return labelText.trim()
}

getLabel.text = getLabelText
getLabel.legend = getLegendText

module.exports = getLabel
