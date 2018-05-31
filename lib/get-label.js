var toolbox = require( 'compose-toolbox' )

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
    var selector = labelledBy.split(' ').map( name => '#'+name ).join(',')
    var labelText = Array.prototype.map.call( document.querySelectorAll( selector ), e => e.textContent )
    if ( labelText ) label = labelText.join(' ')
  }

  return label
}


getLabel.text = function ( input ) {
  input = getInput( input ); if (!input) return
  var label = getLabel( input ),
      labelText

  // Grab text from input data-label, or label.textContent, or input placeholder=""
  labelText = getAriaLabel( input )
  labelText = (!labelText && label) ? label.textContent : labelText
  labelText = labelText || input.getAttribute( 'placeholder' )

  if ( labelText ) return labelText.trim()
}

module.exports = getLabel
