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
  var input = event.currentTarget
  input.value = Number(input.value)
}

Event.on( document, 'input', 'input[data-step]', change )
