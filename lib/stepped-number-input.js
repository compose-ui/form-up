var toolbox = require( 'compose-toolbox' ),
    Event = toolbox.event,
    watching = false

function change (event) {
  var input = event.currentTarget,
      value = Number(input.value)
      min = Number(input.getAttribute('min'))
      max = Number(input.getAttribute('max'))

  input.setAttribute( 'env', process.env.npm_lifecycle_event )
  if ( value != NaN ) {
    if ( value < min )
      input.value = min
    else if ( max < value )
      input.value = max
    else
      input.value = roundToNearest( Number(input.value), Number(input.getAttribute('step')) )

    Event.fire( input, 'input' )
  }
}

function roundToNearest( value, step ) {

  // Nubers with decimals screw up in Javascript.
  // Scale to whole numbers before operating to avoid rounding errors.
  // 0.25 => 25
  var originalValue = value
  var stepPrecision = Math.round( 1+'e'+precision( step ) ),
      valuePrecision = Math.round( 1+'e'+precision( value ) ),
      scale  = ( stepPrecision < valuePrecision ) ? valuePrecision : stepPrecision
      
  // Scale up values to avoid Javascript rounding errors on decimal numbers.
  var step  = step * scale,
      value = value * scale

  // If a remainder is present, rounding is necessary
  var remainder = value % step
  if ( remainder == 0 ) return originalValue

  // If remainder is larger than half of the step
  // it's closer to the next step and should be rounded up
  if ( remainder < step / 2 ) value = value - remainder

  // Otherwise round down (but subtracting the difference)
  else value = value + (step - remainder)

  return value / scale
}

// Returns the number of digits after the decimal, the precision, if you will
function precision(a) {
  if (!isFinite(a)) return 0;
  var e = 1, p = 0;
  while (Math.round(a * e) / e !== a) { e *= 10; p++; }
  return p;
}

function watch(delay) {
  if ( !watching ) {
    Event.on( document, 'input', "input[step]:not([step=any])", Event.debounce(change, delay || 500) )
    watching = true
  }
}

module.exports = {
  watch: watch
}
