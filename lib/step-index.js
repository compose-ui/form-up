module.exports = function stepIndex (el) {
  var min = Number(el.getAttribute('min') || 0),
      max = Number(el.getAttribute('max') || 100),
      step = Number(el.getAttribute('step')) || 1,
      value = Number(el.value)

  // Element is out of bounds of input
  if (value % step != 0) return
  // The nubmer of units is the number of steps between min and max
  var units = ( max - min ) / step
  
  // Return the current step number
  return ( value / step ) - ( min / step )
}
