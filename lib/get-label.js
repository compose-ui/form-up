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


getLabel.text = function ( input ) {
  input = getInput( input ); if (!input) return
  var label = getLabel( input ),
      labelText

  // Grab text from input data-label, or label.textContent, or input placeholder=""
  labelText = input.dataset.label
  labelText = (!labelText && label) ? label.textContent : labelText
  labelText = labelText || input.getAttribute( 'placeholder' )

  if ( labelText ) return labelText.trim()
}

module.exports = getLabel
