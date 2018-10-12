var Event = require( 'compose-event' )
window.FormUp = module.exports = require( '../index.js' )
window.FormUp.event = Event

Event.ready(()=> {
  window.FormUp.inputChange.watch()
  window.FormUp.diff.watch(20)
  window.FormUp.steppedNumberInput.watch(20)
  window.FormUp.stepLabels.watch(20)
  window.FormUp.slider.setup()
})
