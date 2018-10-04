var toolbox = require( 'compose-toolbox' ),
    Event = toolbox.event

// input type=number value=1.2 data-step=0.25 data-max=1000 data-min=0
// 123.2GB => 123.25GB

// Behavior trigger
// input[type=number] data-step, data-max, data-min
//
// Event 'input' [type=number][data-step]
//
//
// Setup registers the event
//
//
//
//
function change (event) {
  // do stuff
  var input = event.currentTarget,
      step = Number(input.getAttribute('step')),
      value = Number(input.value),
      adj = Math.round(1+'e'+precision(step)),

      tempStep = step * adj,
      tempValue = value * adj,

      halfStep = tempStep / 2,
      remainder = tempValue % tempStep


  if ( value != "" || remainder != 0 ) {
    if ( remainder < halfStep ) tempValue = tempValue - remainder
    else tempValue = tempValue + (tempStep - remainder)

    input.value = Number(tempValue / adj)
  }
}

function precision(a) {
  if (!isFinite(a)) return 0;
  var e = 1, p = 0;
  while (Math.round(a * e) / e !== a) { e *= 10; p++; }
  return p;
}

Event.on( document, 'input', 'input[step]', Event.debounce(change, 500) )
