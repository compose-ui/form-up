var Event = require( 'compose-event' )
window.FormUp = module.exports = require( '../index.js' )

Event.ready(()=> {
  window.FormUp.inputChange.watch()
  window.FormUp.diff.watch()
})
