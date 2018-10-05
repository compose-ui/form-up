var Event = require( 'compose-event' )
window.FormUp = module.exports = require( '../index.js' )
window.FormUp.event = Event

Event.ready(()=> {
  window.FormUp.inputChange.watch()
  window.FormUp.diff.watch()
  window.FormUp.steppedNumberInput.watch(40)
})
