(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var validation = require( './lib/validation' )
var progressive = require( './lib/progressive' )

module.exports = {

  validate: validation.validate,
  invalidateField: validation.invalidateField,
  next: progressive.next,

}

},{"./lib/progressive":2,"./lib/validation":3}],2:[function(require,module,exports){
var toolbox  = require( 'compose-toolbox' ),
    Event    = toolbox.event,
    Callback = toolbox.event.callback,
    formSelector = 'form.progressive',
    watching = false,
    formCallbacks,
    registeredForms

// Remove any existing callbacks and registered forms
function reset () {

  formCallbacks = { next: [] }
  registeredForms = []

}

function newForm( form ) {

  if ( !form ) return

  var steps     = toolbox.slice( form.querySelectorAll( '.form-step' ) ),
      stepIndex = 0,
      navItems  = ''

  if ( steps.length == 0 ) return


  steps.forEach( function( step, index ) { 

    // disable all steps but the current step
    step.disabled     = step != currentStep()
    step.dataset.step = index

  })

  if ( form.dataset.nav ) {
    var nav = '<nav class="progressive-form-nav">'

    steps.forEach( function( step, index ) {
      nav += '<a href="#" class="progressive-form-nav-item" data-step="'+( index + 1 )+'">'
      nav += step.dataset.nav || "Step " + ( index + 1 )
      nav += '</a> '
    })

    nav += '</nav>'

    form.insertAdjacentHTML( 'afterbegin', nav )
  }

  show()

  function previousStep ()  { return steps[ stepIndex - 1] }
  function currentStep ()   { return steps[ stepIndex ] }
  function nextStep ()      { return steps[ stepIndex + 1] }
  function active ()        { return currentStep() && !currentStep().disabled }
 
  // Move to next fieldset
  function forward () {
    showStep( stepIndex + 1 )
  }

  // Move to next fieldset
  function back () {
    showStep( stepIndex - 1 )
  }

  // Accepts a step index
  function showStep ( index ) {

    index = Number( index )

    // Get the step from the index
    var step = steps[ index ]

    // Don't go to a non-existant step, or the current step
    if ( step && step != currentStep() ) {

      var direction = ( stepIndex < index ) ? 'forward' : 'reverse'

      // If a step is currently active
      // dismiss it before going to the specified step
      if ( active() ) {
        return dismiss( function() { showStep( index ) }, direction )
      }

      stepIndex = index

      show( direction )

    }
  }
  
  // Hide a completed step and move to the next
  function dismiss ( callback, direction ) {
    direction = direction || 'forward'

    currentStep().classList.remove( 'active', 'enter' )
    currentStep().classList.add( 'exit' )
    currentStep().dataset.direction = direction

    Event.afterAnimation( currentStep(), function() {
      disable()

      if ( typeof callback === 'function' ) callback()

    })

  }

  function revisit ( callback, direction ) {

    if ( !active() ) {
      direction = direction || 'reverse'

      currentStep().classList.remove( 'exit', 'completed' )
      currentStep().classList.add( 'active', 'enter' )
      currentStep().dataset.direction = direction

      disableOtherFieldsets()

      Event.afterAnimation( currentStep(), function() {
        if ( typeof callback === 'function' ) callback()
      })
    }
  }

  // Show the form-step
  function show ( direction ) {

    disableOtherFieldsets()
    currentStep().classList.remove( 'completed' )
    currentStep().dataset.direction = direction
    currentStep().classList.add( 'active', 'enter' )

    // focus on the first input
    var firstInput = currentStep().querySelector( 'input:not([hidden]), textarea, select' )
    if ( firstInput ) firstInput.focus()

    setNav()

  }

  // Disable a form step after it has been hidden
  function disable () {

    currentStep().disabled = true
    currentStep().classList.add( 'completed' )
    currentStep().classList.remove( 'enter', 'exit' )

  }

  function setNav () {
    toolbox.each( form.querySelectorAll( 'nav [data-step]' ), function ( nav ) {

      if ( nav.dataset.step < stepIndex + 1 ) {
        nav.classList.remove( 'here', 'next' )
        nav.classList.add( 'previous', 'completed' )
      }

      if ( nav.dataset.step == stepIndex + 1 ) {
        nav.classList.remove( 'previous', 'next' )
        nav.classList.add( 'here' )
      }

      if ( nav.dataset.step > stepIndex + 1 ) {
        nav.classList.remove( 'previous', 'here' )
        nav.classList.add( 'next' )
      }

    })
  }

  function enableFieldsets ( form ) {
    toolbox.each( form.querySelectorAll( 'fieldset.form-step[disabled]' ), function( fieldset ) {
      fieldset.disabled = false 
    })
  }

  function disableOtherFieldsets ( ) {
    steps.forEach( function( fieldset ) {
      fieldset.disabled = fieldset != currentStep() 
    })
  }

  registeredForms.push( function( event, trigger ) {
    var target = event.currentTarget

    if ( trigger === 'show-step' ) {
      event.preventDefault()

      if ( toolbox.matches( target, '.previous, .completed, .completed + a' ) )
        showStep( target.dataset.step - 1 )

    } else if ( trigger === 'next' ) {

      // Continue if submit was triggered on this form
      // and no invalid fields are found

      var formEl = ( target.tagName == "FORM" ) ? target : toolbox.getClosest( target, 'form')

      if ( form == formEl && !currentStep().querySelector( ':invalid' ) ) {

        // Get the function which triggers callbacks
        var fireCallbacks = getCallbacks( form )

        // This is the last stop, be sure all fieldsets are enabled!
        if ( !nextStep() ) enableFieldsets( form )
        else disableOtherFieldsets( form )

        // If there are callbacks, let them handle this!
        if ( fireCallbacks ) {

          // Since there are callbacks, stop the submission event
          event.preventDefault()

          fireCallbacks( event, {
            fieldset: currentStep(),  // Valid fieldset element
            form:     form,           // Parent form element
            forward:  forward,        // Call forward() to move to the next fieldset
            dismiss:  dismiss,        // Hide and disable current step
            revisit:  revisit,        // Revisit current disabled step
            showStep: showStep,       // Show a specific step by index (0 based)
            complete: !nextStep(),    // is this is the final form step?
            formData: toolbox.formData( currentStep() ) // pass FormData for current fieldset
          })
        }

        // No callbacks? If there's a next step, stop submission and proceed
        else if ( nextStep() ) {
          event.preventDefault() 
          forward()
        }
      }
    }
  })
}

function fire ( event, type ) {
  registeredForms.forEach( function( fn ) { fn( event, type ) })
}


// Returns a function which triggers callbacks
function getCallbacks ( form, type ) {

  type = type || 'next'
  var callbacks = [], cb;

  formCallbacks[ type ].forEach( function( test ) {
     if ( cb = test( form ) ) {
       callbacks.push( cb )
     }
  })

  // Return a function which can trigger all callbacks
  // or returns fallse if none are called

  if ( callbacks.length )
    return function() {
      var args = toolbox.slice( arguments )

      callbacks.forEach( function( callback ) {
        callback.apply( callback, args ) }) }

  else return false
}

function next ( el, callback ) {
  on( el, 'next', callback )
}

function on ( el, event, callback ) {

  // Accept events list as an object e.g. { next: callback }
  if ( typeof event === 'object' ) {
    for ( type in event ) {
      on( el, type, event[ type ] )
    }
  }

  else if ( formCallbacks[ event ] ) {

    // Only allow access to a callback if the form matches
    var filter = function( form ) {
      if ( form == el ) return callback
    }

    // Add the test wrapper function to the callback list
    formCallbacks[ event ].push( filter )
  }
}

Event.ready( function(){
  reset()

  // Add bubbling so we can listen for submission
  Event.bubbleFormEvents()

  var nextSelector = formSelector + ' [type=submit], ' + formSelector + ' .next-step'
  var backSelector = formSelector + ' .back-step'
  var navSelector  = '.progressive-form-nav-item[data-step]'

  Event.on( document, 'click', nextSelector , fire, 'next' )
  Event.on( document, 'click', backSelector , fire, 'back' )
  Event.on( document, 'click', navSelector  , fire, 'show-step' )
// insert core styling for hiding disabled and completed form-steps
  document.head.insertAdjacentHTML( 'beforeend', "<style>\
.form-step[disabled], .form-step.completed {\
  position: absolute !important;\
  top:      -9999px  !important;\
  left:     -9999px  !important;\
  left:     0        !important;\
  right:    0        !important; }\
</style>" )

  Event.change( function() {
    reset()

    toolbox.each( document.querySelectorAll( formSelector ), function( el ) {
      newForm( el )
    })
  })
})

module.exports = {
  next: next,
  new: newForm
}

},{"compose-toolbox":21}],3:[function(require,module,exports){
// Dependencies
var toolbox    = require( 'compose-toolbox' ),
    Event      = toolbox.event,
    getClosest = toolbox.getClosest,
    wordCount  = toolbox.wordCount,
    textSelectors = '[required]';

// Does this browser support HTML5 validation?
function supported () {

  return typeof document.createElement( 'input' ).checkValidity === 'function'

}

var invalidHandler = Event.callback.new( function( event ) { 
  event.preventDefault() 
  event.stopPropagation() 
})

// Watch for events ( if validation is suported )
Event.ready( function(){

  if ( supported() ) { 

    Event.bubbleFormEvents()

    document.addEventListener( 'invalid', invalidHandler, true )

    Event.on( document.body, 'click', '[type=submit]', submit )

    Event.on( document, 'validate', 'form', function( event ) { 
      validateForm( event.target )
    })

    // Ensure all required inputs have aria-requrired attributes
    toolbox.slice( document.querySelectorAll( '[required]' ) ).forEach( function( element ) { 
      element.setAttribute( 'aria-required', true )
    })

    // Watch input events
    Event.on( document, 'blur', '[required]', checkValidation )
    Event.on( document, 'keydown', '[required]', Event.debounce( checkValidation, 200 ) )
    Event.on( document, 'input', 'select[required]', Event.debounce( checkValidation, 200 ) )
    Event.on( document, 'change', '[type=checkbox][required]', checkValidation )

  }
})

function validateForm ( form ) {

  // Scoped variables
  var inputs = form.querySelectorAll( '[required]' ),
      invalidInput;

  toolbox.slice( inputs ).some( function( input ) {

    // if invalid
    if ( !getClosest( input, '[disabled]' ) && !checkInput( input ) ) {
      invalidInput = input
      return true
    }
  })

  if ( invalidInput ) { 

    // Show validation message
    focus( invalidInput )
    showMessage( invalidInput )

    return false
  }

  // The form is valid, skip it
  else { 
    return true 
  }

}

// Handler for validation events
var checkValidation = Event.callback.new( function( event ) {

  if ( checkInput( event.target, event.type ) ) {

    // Remove any pre-existing validation message
    hideMessage( event.target )
  }

})


function checkInput ( input, event ) {

  var el       = statusEl( input ),
      valid    = isValid( input ),
      neutral  = event == 'keydown' && !valid;

  // Don't trigger invalid style while typing
  if ( neutral && input == document.activeElement ) {

    el.classList.remove( 'invalid', 'valid' )
    input.setAttribute( 'aria-invalid', false )

  } else {

    el.classList.toggle( 'invalid', !valid )
    el.classList.toggle( 'valid', valid )
    input.setAttribute( 'aria-invalid', valid )

  }

  return valid

}

// Is an input valid?
function isValid ( input ) {

  // If element only contains whitespace, strip value
  if ( !input.value.replace( /\s/g, '' ).length )
    input.value = ''

  // Set a custom validation message for word count
  var message = checkValue( input ) || checkLength( input ) || ''
  input.setCustomValidity( message )

  var valid = input.checkValidity()

  return valid

}


function checkValue( input ) {
  if ( input.dataset.invalidValue ) {

    // Does input value == invalid value? (case insensitive)
    var regexp = escapedRegex( input.dataset.invalidValue, 'i' )

    if ( input.value.match( regexp ) ) {

      // Remove any standard custom message
      input.dataset.cachedMessage = input.dataset.message
      input.dataset.message = ''

      return input.dataset.invalidValueMessage || "Value '"+input.value+"' is not permitted"

    // If not invalid value reset standard validation message
    } else if ( input.dataset.cachedMessage ) {

      input.dataset.message = input.dataset.cachedMessage
      input.dataset.cachedMessage = ''

    }
  }
}

function escapedRegex( input, options ) {
  var str = input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  return new RegExp( "^" + str + '$', options )
}

function checkLength ( input ) {
  return checkCount( input, 'min' )
      || checkCount( input, 'max' )
}

// Test custom validation for maximum or minimum words present
function checkCount ( input, limit ) {

  var goal = input.dataset[ limit + 'Words' ]

  if ( goal ) {

    var lessThanGoal = wordCount( input.value ) < goal
        phrasing     = ( limit == 'min' ) ? 'at least ' : 'no more than ',
        valid        = ( limit == 'min' ) ? !lessThanGoal : lessThanGoal

    // Return a custom error message
    if ( input.value && !valid )
      return 'Please write ' + phrasing + goal + ' words.'
  }


}

// Test custom validation for maximum and minimum time
function checkTime ( input ) {
  var timeValid = false,
      beforeTime = input.dataset.isBefore,
      afterTime = input.dataset.isAfter,
      timeValue = toolbox.time.parse( input.value )

  if ( !timeValue ) { return "Please enter a valid time stamp: YYYY-MM-DD HH:MM:SS" }
  if ( beforeTime && !toolbox.time.isBefore( timeValue, beforeTime )) { return "Time must be before " + beforeTime.toSQL() } 
  if ( afterTime && !toolbox.time.isAfter( timeValue, afterTime )) { return "Time must be after " + afterTime.toSQL() } 
}


// If input is nested in a label, treat the label as the
// target for assigning status (class names and messages).
function statusEl ( input ) {

  return getClosest( input, 'label' ) || input

}

// Focus() if invalid element is not hidden
// or Focus its immediate sibling (mostly used for upload buttons)
function focus ( el ) {

  el = ( el.style.display !== 'none' ) ? el : el.nextSibling
  el.focus()

}

// Submission validation handler function
function submit ( event ) {

  var form = ( event.target.tagName == "FORM" ) ? event.target : getClosest( event.target, 'form')

  // Skip validation if no invalid inputs found
  if ( !validateForm( form ) ) {

    // Pause keydown/blur triggers for the next second to avoid neutral empty style
    checkValidation.stop()
    Event.delay( checkValidation.start, 500 )

    // Stop the submission event
    event.preventDefault()
    event.stopImmediatePropagation()

  }

}

function invalidateField ( el, message ) {
  if ( el && el.value ) {
    el.dataset.invalidValue = el.value
    if ( message )
      el.dataset.invalidValueMessage = message
  }
}

function hideMessage ( el ) {

  var form = getClosest( el, 'form' ),
      msg = form.querySelector( '.validation-message' )

  if ( msg ) msg.parentNode.removeChild( msg )

}


// Validation message handler function
function showMessage ( el ) {

  //hideMessage( el )

  var label = getClosest( el, 'label' ),
      message = el.dataset.message || el.validationMessage

  if ( label ) {
    var existingMessage = label.querySelector( '.validation-message-text' )

    if ( !existingMessage ) {
      label.insertAdjacentHTML( 'beforeend',  '<span class="validation-message"><span class="validation-message-text" role="alert">' + message + '</span></span>' )

    } else if ( existingMessage.textContent != message ) {
      existingMessage.innerHTML = message
    }
  }

}

// Public API
module.exports = {
  validate: validateForm,
  invalidateField: invalidateField
}

},{"compose-toolbox":21}],4:[function(require,module,exports){
/*!
  * Bean - copyright (c) Jacob Thornton 2011-2012
  * https://github.com/fat/bean
  * MIT license
  */
(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition()
})('bean', this, function (name, context) {
  name    = name    || 'bean'
  context = context || this

  var win            = window
    , old            = context[name]
    , namespaceRegex = /[^\.]*(?=\..*)\.|.*/
    , nameRegex      = /\..*/
    , addEvent       = 'addEventListener'
    , removeEvent    = 'removeEventListener'
    , doc            = document || {}
    , root           = doc.documentElement || {}
    , W3C_MODEL      = root[addEvent]
    , eventSupport   = W3C_MODEL ? addEvent : 'attachEvent'
    , ONE            = {} // singleton for quick matching making add() do one()

    , slice          = Array.prototype.slice
    , str2arr        = function (s, d) { return s.split(d || ' ') }
    , isString       = function (o) { return typeof o == 'string' }
    , isFunction     = function (o) { return typeof o == 'function' }
    , isObject       = function (o) { return typeof o == 'object' }

    // Try to build an options object. If any key in `maybeOptions`
    // matches a key in `defaults`, it will be copied into a clone
    // of `defaults`, thus overriding the default.
    , buildOptions = function (originalDefaults, maybeOptions) {
        var defaults = {}

        for (var key in originalDefaults) {
          if (originalDefaults.hasOwnProperty(key)) {
            defaults[key] = originalDefaults[key];
          }
        }

        if (!isObject(maybeOptions)) {
          return defaults;
        }

        for (key in defaults) {
          if (defaults.hasOwnProperty(key) && maybeOptions.hasOwnProperty(key)) {
            defaults[key] = maybeOptions[key]
          }
        }

        return defaults
      }

      // events that we consider to be 'native', anything not in this list will
      // be treated as a custom event
    , standardNativeEvents =
        'click dblclick mouseup mousedown contextmenu '                  + // mouse buttons
        'mousewheel mousemultiwheel DOMMouseScroll '                     + // mouse wheel
        'mouseover mouseout mousemove selectstart selectend '            + // mouse movement
        'keydown keypress keyup '                                        + // keyboard
        'orientationchange '                                             + // mobile
        'focus blur change reset select submit '                         + // form elements
        'load unload beforeunload resize move DOMContentLoaded '         + // window
        'readystatechange message '                                      + // window
        'error abort scroll '                                              // misc
      // element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
      // that doesn't actually exist, so make sure we only do these on newer browsers
    , w3cNativeEvents =
        'show '                                                          + // mouse buttons
        'input invalid '                                                 + // form elements
        'touchstart touchmove touchend touchcancel '                     + // touch
        'gesturestart gesturechange gestureend '                         + // gesture
        'textinput '                                                     + // TextEvent
        'readystatechange pageshow pagehide popstate '                   + // window
        'hashchange offline online '                                     + // window
        'afterprint beforeprint '                                        + // printing
        'dragstart dragenter dragover dragleave drag drop dragend '      + // dnd
        'loadstart progress suspend emptied stalled loadmetadata '       + // media
        'loadeddata canplay canplaythrough playing waiting seeking '     + // media
        'seeked ended durationchange timeupdate play pause ratechange '  + // media
        'volumechange cuechange '                                        + // media
        'checking noupdate downloading cached updateready obsolete '       // appcache

      // convert to a hash for quick lookups
    , nativeEvents = (function (hash, events, i) {
        for (i = 0; i < events.length; i++) events[i] && (hash[events[i]] = 1)
        return hash
      }({}, str2arr(standardNativeEvents + (W3C_MODEL ? w3cNativeEvents : ''))))

      // custom events are events that we *fake*, they are not provided natively but
      // we can use native events to generate them
    , customEvents = (function () {
        var isAncestor = 'compareDocumentPosition' in root
              ? function (element, container) {
                  return container.compareDocumentPosition && (container.compareDocumentPosition(element) & 16) === 16
                }
              : 'contains' in root
                ? function (element, container) {
                    container = container.nodeType === 9 || container === window ? root : container
                    return container !== element && container.contains(element)
                  }
                : function (element, container) {
                    while (element = element.parentNode) if (element === container) return 1
                    return 0
                  }
          , check = function (event) {
              var related = event.relatedTarget
              return !related
                ? related == null
                : (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString())
                    && !isAncestor(related, this))
            }

        return {
            mouseenter: { base: 'mouseover', condition: check }
          , mouseleave: { base: 'mouseout', condition: check }
          , mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
        }
      }())

      // we provide a consistent Event object across browsers by taking the actual DOM
      // event object and generating a new one from its properties.
    , Event = (function () {
            // a whitelist of properties (for different event types) tells us what to check for and copy
        var commonProps  = str2arr('altKey attrChange attrName bubbles cancelable ctrlKey currentTarget ' +
              'detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey '  +
              'srcElement target timeStamp type view which propertyName path')
          , mouseProps   = commonProps.concat(str2arr('button buttons clientX clientY dataTransfer '      +
              'fromElement offsetX offsetY pageX pageY screenX screenY toElement movementX movementY region'))
          , mouseWheelProps = mouseProps.concat(str2arr('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ ' +
              'axis')) // 'axis' is FF specific
          , keyProps     = commonProps.concat(str2arr('char charCode key keyCode keyIdentifier '          +
              'keyLocation location isComposing code'))
          , textProps    = commonProps.concat(str2arr('data'))
          , touchProps   = commonProps.concat(str2arr('touches targetTouches changedTouches scale rotation'))
          , messageProps = commonProps.concat(str2arr('data origin source'))
          , stateProps   = commonProps.concat(str2arr('state'))
          , overOutRegex = /over|out/
            // some event types need special handling and some need special properties, do that all here
          , typeFixers   = [
                { // key events
                    reg: /key/i
                  , fix: function (event, newEvent) {
                      newEvent.keyCode = event.keyCode || event.which
                      return keyProps
                    }
                }
              , { // mouse events
                    reg: /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i
                  , fix: function (event, newEvent, type) {
                      newEvent.rightClick = event.which === 3 || event.button === 2
                      newEvent.pos = { x: 0, y: 0 }
                      if (event.pageX || event.pageY) {
                        newEvent.clientX = event.pageX
                        newEvent.clientY = event.pageY
                      } else if (event.clientX || event.clientY) {
                        newEvent.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
                        newEvent.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
                      }
                      if (overOutRegex.test(type)) {
                        newEvent.relatedTarget = event.relatedTarget
                          || event[(type == 'mouseover' ? 'from' : 'to') + 'Element']
                      }
                      return mouseProps
                    }
                }
              , { // mouse wheel events
                    reg: /mouse.*(wheel|scroll)/i
                  , fix: function () { return mouseWheelProps }
                }
              , { // TextEvent
                    reg: /^text/i
                  , fix: function () { return textProps }
                }
              , { // touch and gesture events
                    reg: /^touch|^gesture/i
                  , fix: function () { return touchProps }
                }
              , { // message events
                    reg: /^message$/i
                  , fix: function () { return messageProps }
                }
              , { // popstate events
                    reg: /^popstate$/i
                  , fix: function () { return stateProps }
                }
              , { // everything else
                    reg: /.*/
                  , fix: function () { return commonProps }
                }
            ]
          , typeFixerMap = {} // used to map event types to fixer functions (above), a basic cache mechanism

          , Event = function (event, element, isNative) {
              if (!arguments.length) return
              event = event || ((element.ownerDocument || element.document || element).parentWindow || win).event
              this.originalEvent = event
              this.isNative       = isNative
              this.isBean         = true

              if (!event) return

              var type   = event.type
                , target = event.target || event.srcElement
                , i, l, p, props, fixer

              this.target = target && target.nodeType === 3 ? target.parentNode : target

              if (isNative) { // we only need basic augmentation on custom events, the rest expensive & pointless
                fixer = typeFixerMap[type]
                if (!fixer) { // haven't encountered this event type before, map a fixer function for it
                  for (i = 0, l = typeFixers.length; i < l; i++) {
                    if (typeFixers[i].reg.test(type)) { // guaranteed to match at least one, last is .*
                      typeFixerMap[type] = fixer = typeFixers[i].fix
                      break
                    }
                  }
                }

                props = fixer(event, this, type)
                for (i = props.length; i--;) {
                  if (!((p = props[i]) in this) && p in event) this[p] = event[p]
                }
              }
            }

        // preventDefault() and stopPropagation() are a consistent interface to those functions
        // on the DOM, stop() is an alias for both of them together
        Event.prototype.preventDefault = function () {
          if (this.originalEvent.preventDefault) this.originalEvent.preventDefault()
          else this.originalEvent.returnValue = false
        }
        Event.prototype.stopPropagation = function () {
          if (this.originalEvent.stopPropagation) this.originalEvent.stopPropagation()
          else this.originalEvent.cancelBubble = true
        }
        Event.prototype.stop = function () {
          this.preventDefault()
          this.stopPropagation()
          this.stopped = true
        }
        // stopImmediatePropagation() has to be handled internally because we manage the event list for
        // each element
        // note that originalElement may be a Bean#Event object in some situations
        Event.prototype.stopImmediatePropagation = function () {
          if (this.originalEvent.stopImmediatePropagation) this.originalEvent.stopImmediatePropagation()
          this.isImmediatePropagationStopped = function () { return true }
        }
        Event.prototype.isImmediatePropagationStopped = function () {
          return this.originalEvent.isImmediatePropagationStopped && this.originalEvent.isImmediatePropagationStopped()
        }
        Event.prototype.clone = function (currentTarget) {
          //TODO: this is ripe for optimisation, new events are *expensive*
          // improving this will speed up delegated events
          var ne = new Event(this, this.element, this.isNative)
          ne.currentTarget = currentTarget
          return ne
        }

        return Event
      }())

      // if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
    , targetElement = function (element, isNative) {
        return !W3C_MODEL && !isNative && (element === doc || element === win) ? root : element
      }

      /**
        * Bean maintains an internal registry for event listeners. We don't touch elements, objects
        * or functions to identify them, instead we store everything in the registry.
        * Each event listener has a RegEntry object, we have one 'registry' for the whole instance.
        */
    , RegEntry = (function () {
        // each handler is wrapped so we can handle delegation and custom events
        var wrappedHandler = function (element, fn, condition, args) {
            var call = function (event, eargs) {
                  return fn.apply(element, args ? slice.call(eargs, event ? 0 : 1).concat(args) : eargs)
                }
              , findTarget = function (event, eventElement) {
                  return fn.__beanDel ? fn.__beanDel.ft(event.target, element) : eventElement
                }
              , handler = condition
                  ? function (event) {
                      var target = findTarget(event, this) // deleated event
                      if (condition.apply(target, arguments)) {
                        if (event) event.currentTarget = target
                        return call(event, arguments)
                      }
                    }
                  : function (event) {
                      if (fn.__beanDel) event = event.clone(findTarget(event)) // delegated event, fix the fix
                      return call(event, arguments)
                    }
            handler.__beanDel = fn.__beanDel
            return handler
          }

        , RegEntry = function (element, type, handler, original, namespaces, args, root) {
            var customType     = customEvents[type]
              , isNative

            if (type == 'unload') {
              // self clean-up
              handler = once(removeListener, element, type, handler, original)
            }

            if (customType) {
              if (customType.condition) {
                handler = wrappedHandler(element, handler, customType.condition, args)
              }
              type = customType.base || type
            }

            this.isNative      = isNative = nativeEvents[type] && !!element[eventSupport]
            this.customType    = !W3C_MODEL && !isNative && type
            this.element       = element
            this.type          = type
            this.original      = original
            this.namespaces    = namespaces
            this.eventType     = W3C_MODEL || isNative ? type : 'propertychange'
            this.target        = targetElement(element, isNative)
            this[eventSupport] = !!this.target[eventSupport]
            this.root          = root
            this.handler       = wrappedHandler(element, handler, null, args)
          }

        // given a list of namespaces, is our entry in any of them?
        RegEntry.prototype.inNamespaces = function (checkNamespaces) {
          var i, j, c = 0
          if (!checkNamespaces) return true
          if (!this.namespaces) return false
          for (i = checkNamespaces.length; i--;) {
            for (j = this.namespaces.length; j--;) {
              if (checkNamespaces[i] == this.namespaces[j]) c++
            }
          }
          return checkNamespaces.length === c
        }

        // match by element, original fn (opt), handler fn (opt)
        RegEntry.prototype.matches = function (checkElement, checkOriginal, checkHandler) {
          return this.element === checkElement &&
            (!checkOriginal || this.original === checkOriginal) &&
            (!checkHandler || this.handler === checkHandler)
        }

        return RegEntry
      }())

    , registry = (function () {
        // our map stores arrays by event type, just because it's better than storing
        // everything in a single array.
        // uses '$' as a prefix for the keys for safety and 'r' as a special prefix for
        // rootListeners so we can look them up fast
        var map = {}

          // generic functional search of our registry for matching listeners,
          // `fn` returns false to break out of the loop
          , forAll = function (element, type, original, handler, root, fn) {
              var pfx = root ? 'r' : '$'
              if (!type || type == '*') {
                // search the whole registry
                for (var t in map) {
                  if (t.charAt(0) == pfx) {
                    forAll(element, t.substr(1), original, handler, root, fn)
                  }
                }
              } else {
                var i = 0, l, list = map[pfx + type], all = element == '*'
                if (!list) return
                for (l = list.length; i < l; i++) {
                  if ((all || list[i].matches(element, original, handler)) && !fn(list[i], list, i, type)) return
                }
              }
            }

          , has = function (element, type, original, root) {
              // we're not using forAll here simply because it's a bit slower and this
              // needs to be fast
              var i, list = map[(root ? 'r' : '$') + type]
              if (list) {
                for (i = list.length; i--;) {
                  if (!list[i].root && list[i].matches(element, original, null)) return true
                }
              }
              return false
            }

          , get = function (element, type, original, root) {
              var entries = []
              forAll(element, type, original, null, root, function (entry) {
                return entries.push(entry)
              })
              return entries
            }

          , put = function (entry) {
              var has = !entry.root && !this.has(entry.element, entry.type, null, false)
                , key = (entry.root ? 'r' : '$') + entry.type
              ;(map[key] || (map[key] = [])).push(entry)
              return has
            }

          , del = function (entry) {
              forAll(entry.element, entry.type, null, entry.handler, entry.root, function (entry, list, i) {
                list.splice(i, 1)
                entry.removed = true
                if (list.length === 0) delete map[(entry.root ? 'r' : '$') + entry.type]
                return false
              })
            }

            // dump all entries, used for onunload
          , entries = function () {
              var t, entries = []
              for (t in map) {
                if (t.charAt(0) == '$') entries = entries.concat(map[t])
              }
              return entries
            }

        return { has: has, get: get, put: put, del: del, entries: entries }
      }())

      // we need a selector engine for delegated events, use querySelectorAll if it exists
      // but for older browsers we need Qwery, Sizzle or similar
    , selectorEngine
    , setSelectorEngine = function (e) {
        if (!arguments.length) {
          selectorEngine = doc.querySelectorAll
            ? function (s, r) {
                return r.querySelectorAll(s)
              }
            : function () {
                throw new Error('Bean: No selector engine installed') // eeek
              }
        } else {
          selectorEngine = e
        }
      }

      // we attach this listener to each DOM event that we need to listen to, only once
      // per event type per DOM element
    , rootListener = function (event, type) {
        if (!W3C_MODEL && type && event && event.propertyName != '_on' + type) return

        var listeners = registry.get(this, type || event.type, null, false)
          , l = listeners.length
          , i = 0

        event = new Event(event, this, true)
        if (type) event.type = type

        // iterate through all handlers registered for this type, calling them unless they have
        // been removed by a previous handler or stopImmediatePropagation() has been called
        for (; i < l && !event.isImmediatePropagationStopped(); i++) {
          if (!listeners[i].removed) listeners[i].handler.call(this, event)
        }
      }

      // add and remove listeners to DOM elements
    , listener = W3C_MODEL
        ? function (element, type, add, custom, useCapture) {
            // new browsers
            element[add ? addEvent : removeEvent](type, rootListener, useCapture)
          }
        : function (element, type, add, custom /*, useCapture */) {
            // IE8 and below, use attachEvent/detachEvent and we have to piggy-back propertychange events
            // to simulate event bubbling etc.
            var entry
            if (add) {
              registry.put(entry = new RegEntry(
                  element
                , custom || type
                , function (event) { // handler
                    rootListener.call(element, event, custom)
                  }
                , rootListener
                , null
                , null
                , true // is root
              ))
              if (custom && element['_on' + custom] == null) element['_on' + custom] = 0
              entry.target.attachEvent('on' + entry.eventType, entry.handler)
            } else {
              entry = registry.get(element, custom || type, rootListener, true)[0]
              if (entry) {
                entry.target.detachEvent('on' + entry.eventType, entry.handler)
                registry.del(entry)
              }
            }
          }

    , once = function (rm, element, type, fn, originalFn) {
        // wrap the handler in a handler that does a remove as well
        return function () {
          fn.apply(this, arguments)
          rm(element, type, originalFn)
        }
      }

    , removeListener = function (element, orgType, handler, namespaces, useCapture) {
        var type     = orgType && orgType.replace(nameRegex, '')
          , handlers = registry.get(element, type, null, false)
          , removed  = {}
          , i, l

        for (i = 0, l = handlers.length; i < l; i++) {
          if ((!handler || handlers[i].original === handler) && handlers[i].inNamespaces(namespaces)) {
            // TODO: this is problematic, we have a registry.get() and registry.del() that
            // both do registry searches so we waste cycles doing this. Needs to be rolled into
            // a single registry.forAll(fn) that removes while finding, but the catch is that
            // we'll be splicing the arrays that we're iterating over. Needs extra tests to
            // make sure we don't screw it up. @rvagg
            registry.del(handlers[i])
            if (!removed[handlers[i].eventType] && handlers[i][eventSupport])
              removed[handlers[i].eventType] = { t: handlers[i].eventType, c: handlers[i].type }
          }
        }
        // check each type/element for removed listeners and remove the rootListener where it's no longer needed
        for (i in removed) {
          if (!registry.has(element, removed[i].t, null, false)) {
            // last listener of this type, remove the rootListener
            listener(element, removed[i].t, false, removed[i].c, useCapture)
          }
        }
      }

      // set up a delegate helper using the given selector, wrap the handler function
    , delegate = function (selector, fn) {
        //TODO: findTarget (therefore $) is called twice, once for match and once for
        // setting e.currentTarget, fix this so it's only needed once
        var findTarget = function (target, root) {
              var i, array = isString(selector) ? selectorEngine(selector, root) : selector
              for (; target && target !== root; target = target.parentNode) {
                for (i = array.length; i--;) {
                  if (array[i] === target) return target
                }
              }
            }
          , handler = function (e) {
              var match = findTarget(e.target, this)
              if (match) fn.apply(match, arguments)
            }

        // __beanDel isn't pleasant but it's a private function, not exposed outside of Bean
        handler.__beanDel = {
            ft       : findTarget // attach it here for customEvents to use too
          , selector : selector
        }
        return handler
      }

    , fireListener = W3C_MODEL ? function (isNative, type, element) {
        // modern browsers, do a proper dispatchEvent()
        var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents')
        evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1)
        element.dispatchEvent(evt)
      } : function (isNative, type, element) {
        // old browser use onpropertychange, just increment a custom property to trigger the event
        element = targetElement(element, isNative)
        isNative ? element.fireEvent('on' + type, doc.createEventObject()) : element['_on' + type]++
      }

      /**
        * Public API: off(), on(), add(), (remove()), one(), fire(), clone()
        */

      /**
        * off(element[, eventType(s)[, handler ], options])
        */
    , off = function (element, typeSpec, fn) {
        var isTypeStr = isString(typeSpec),
          defaultOpts = {
            useCapture: false
          }
          , opts = buildOptions(defaultOpts, arguments[arguments.length - 1])
          , k, type, namespaces, i

        if (isTypeStr && typeSpec.indexOf(' ') > 0) {
          // off(el, 't1 t2 t3', fn) or off(el, 't1 t2 t3')
          typeSpec = str2arr(typeSpec)
          for (i = typeSpec.length; i--;)
            off(element, typeSpec[i], fn)
          return element
        }

        type = isTypeStr && typeSpec.replace(nameRegex, '')
        if (type && customEvents[type]) type = customEvents[type].base

        if (!typeSpec || isTypeStr) {
          // off(el) or off(el, t1.ns) or off(el, .ns) or off(el, .ns1.ns2.ns3)
          if (namespaces = isTypeStr && typeSpec.replace(namespaceRegex, '')) namespaces = str2arr(namespaces, '.')
          removeListener(element, type, fn, namespaces, opts.useCapture)
        } else if (isFunction(typeSpec)) {
          // off(el, fn)
          removeListener(element, null, typeSpec, null, opts.useCapture)
        } else {
          // off(el, { t1: fn1, t2, fn2 })
          for (k in typeSpec) {
            if (typeSpec.hasOwnProperty(k)) off(element, k, typeSpec[k])
          }
        }

        return element
      }

      /**
        * on(element, eventType(s)[, selector], handler[, args ], [options])
        */
    , on = function(element, events, selector, fn) {
        var defaultOpts = {
            useCapture: false
          },
          originalFn, type, types, i, args, entry, first, opts

        //TODO: the undefined check means you can't pass an 'args' argument, fix this perhaps?
        if (selector === undefined && typeof events == 'object') {
          //TODO: this can't handle delegated events
          for (type in events) {
            if (events.hasOwnProperty(type)) {
              on.call(this, element, type, events[type])
            }
          }
          return
        }

        if (!isFunction(selector)) {
          // delegated event
          originalFn = fn
          args       = slice.call(arguments, 4)
          fn         = delegate(selector, originalFn, selectorEngine)
        } else {
          args       = slice.call(arguments, 3)
          fn         = originalFn = selector
        }

        opts = buildOptions(defaultOpts, args[args.length - 1])
        types = str2arr(events)

        // special case for one(), wrap in a self-removing handler
        if (this === ONE) {
          fn = once(off, element, events, fn, originalFn)
        }

        for (i = types.length; i--;) {
          // add new handler to the registry and check if it's the first for this element/type
          first = registry.put(entry = new RegEntry(
              element
            , types[i].replace(nameRegex, '') // event type
            , fn
            , originalFn
            , str2arr(types[i].replace(namespaceRegex, ''), '.') // namespaces
            , args
            , false // not root
          ))
          if (entry[eventSupport] && first) {
            // first event of this type on this element, add root listener
            listener(element, entry.eventType, true, entry.customType, opts.useCapture)
          }
        }

        return element
      }

      /**
        * add(element[, selector], eventType(s), handler[, args ])
        *
        * Deprecated: kept (for now) for backward-compatibility
        */
    , add = function (element, events, fn, delfn, options) {
        return on.apply(
            null
          , !isString(fn)
              ? slice.call(arguments)
              : [ element, fn, events, delfn ].concat(arguments.length > 3 ? slice.call(arguments, 4) : [])
        )
      }

      /**
        * one(element, eventType(s)[, selector], handler[, args ])
        */
    , one = function () {
        return on.apply(ONE, arguments)
      }

      /**
        * fire(element, eventType(s)[, args ])
        *
        * The optional 'args' argument must be an array, if no 'args' argument is provided
        * then we can use the browser's DOM event system, otherwise we trigger handlers manually
        */
    , fire = function (element, type, args) {
        var types = str2arr(type)
          , i, j, l, names, handlers

        for (i = types.length; i--;) {
          type = types[i].replace(nameRegex, '')
          if (names = types[i].replace(namespaceRegex, '')) names = str2arr(names, '.')
          if (!names && !args && element[eventSupport]) {
            fireListener(nativeEvents[type], type, element)
          } else {
            // non-native event, either because of a namespace, arguments or a non DOM element
            // iterate over all listeners and manually 'fire'
            handlers = registry.get(element, type, null, false)
            args = [false].concat(args)
            for (j = 0, l = handlers.length; j < l; j++) {
              if (handlers[j].inNamespaces(names)) {
                handlers[j].handler.apply(element, args)
              }
            }
          }
        }
        return element
      }

      /**
        * clone(dstElement, srcElement[, eventType ])
        *
        * TODO: perhaps for consistency we should allow the same flexibility in type specifiers?
        */
    , clone = function (element, from, type) {
        var handlers = registry.get(from, type, null, false)
          , l = handlers.length
          , i = 0
          , args, beanDel

        for (; i < l; i++) {
          if (handlers[i].original) {
            args = [ element, handlers[i].type ]
            if (beanDel = handlers[i].handler.__beanDel) args.push(beanDel.selector)
            args.push(handlers[i].original)
            on.apply(null, args)
          }
        }
        return element
      }

    , bean = {
          'on'                : on
        , 'add'               : add
        , 'one'               : one
        , 'off'               : off
        , 'remove'            : off
        , 'clone'             : clone
        , 'fire'              : fire
        , 'Event'             : Event
        , 'setSelectorEngine' : setSelectorEngine
        , 'noConflict'        : function () {
            context[name] = old
            return this
          }
      }

  // for IE, clean up on unload to avoid leaks
  if (win.attachEvent) {
    var cleanup = function () {
      var i, entries = registry.entries()
      for (i in entries) {
        if (entries[i].type && entries[i].type !== 'unload') off(entries[i].element, entries[i].type)
      }
      win.detachEvent('onunload', cleanup)
      win.CollectGarbage && win.CollectGarbage()
    }
    win.attachEvent('onunload', cleanup)
  }

  // initialize selector engine to internal default (qSA or throw Error)
  setSelectorEngine()

  return bean
});

},{}],5:[function(require,module,exports){
require( './lib/shims/custom-event' )

var bean = require( 'bean' )
var key  = require( 'keymaster' ) 
var animationEvent    = require( './lib/animation-events' )
var page              = require( './lib/page' )
var tap               = require( './lib/tap-events' )
var debounce          = require( './lib/debounce' )
var throttle          = require( './lib/throttle' )
var delay             = require( './lib/delay' )
var repeat            = require( './lib/repeat' )
var bubbleFormEvents  = require( './lib/bubble-form-events' )
var submit            = require( './lib/submit' )
var scroll            = require( './lib/scroll' )
var resize            = require( './lib/resize' )
var callbackManager   = require( './lib/callback-manager' )
var media             = require( './lib/media' )

var slice             = Array.prototype.slice
var formBubbling      = false

module.exports = {

  // DOM events
  on: on,
  off: off,
  one: one,
  fire: fire,
  clone: bean.clone,
  ready: page.ready,
  change: page.change,
  afterAnimation: afterAnimation,

  // Media query events
  media: media,

  // Keyboard events
  key: key,
  keyOn: key,
  keyOff: key.unbind,
  keyOne: keyOne,

  // Timing utilities
  debounce: debounce,
  throttle: throttle,
  delay:    delay,
  repeat:   repeat,

  // Optimized Event Managers
  scroll:      scroll,
  resize:      resize,

  callbackManager: callbackManager,
  callback: callbackManager.callback,

  // Bubbling fix
  bubbleFormEvents: bubbleFormEvents,

  submit: submit
}

// Bean doesn't account for cross-browser support on animation events
// So rather than pass through events to bean, we process them to add
// vendor prefixes or remove events if browsers do not suppor them
//
function on () {
  setEvent( 'on', slice.call( arguments ) )
}

function off () {
  setEvent( 'off', slice.call( arguments ) )
}

function one () {
  setEvent( 'one', slice.call( arguments ) )
}

function fire () {

  args = slice.call( arguments )
  var el = args[0]
  var events = []

  args[1].split(' ').forEach( function( event ) {

    var event = animationEvent.transform( event )
    if ( !isEmpty( event ) ) events.push( event )

  })

  if ( !isEmpty( events ) ) {

    args[1] = events.join( ' ' )
    bean.fire.apply( this, args )

  }
}

function setEvent( registerType, args ) {

  transformArgs( args ).forEach( function( arg ) {
    bean[ registerType ].apply( null, arg )
  })

}

// Add support for unbinding a key event after it is called
//
function keyOne ( keys, scope, fn ) {

  if ( typeof scope == 'function' ) {
    fn = scope
    scope = 'all'
  }

  key( keys, scope, function( event ) {
    key.unbind( keys, scope )
    fn( event )
  })
}

function afterAnimation( el, callback, checkStart ) {
  var hasAnimation = !!window.getComputedStyle( el ).getPropertyValue( 'animation-duration' )

  if ( hasAnimation ) {
    
    // If element is not animating after delay, fire callback
    if ( checkStart ) {

      var time = ((typeof checkStart == "number") ? checkStart : 20),
          delayedEvent = delay( callback, time )

      // Delay with requestAnimationFrame to fire callback only after 
      // at least one animation frame has passed

      one( el, 'animationstart', function(event) {
        // cancel delayed fire
        delayedEvent.stop()

        // watch for animation to finish
        one( el, 'animationend', callback )
      })


    } else {
      one( el, 'animationend', callback )
    }
  } else {
    callback()
  }
}

// Transform event arguments to handle tap event and cross-browser animation events
// Returns an array of events to be registered individually
//
function transformArgs( args ) {

  var transformedArgs = []
  var newEvents = {}
  var element = args.shift() // retrieve element
  var events = args.shift()

  // detect event delegate selector
  if ( typeof args[0] != 'function' ) {
    var delegate = args.shift()
  }

  // convert event strings to object based events for code simplification
  // example: arguments ('hover focus', function) would become ({ 'hover focus': function })
  if ( typeof events == 'string' ) {
    var objEvents = {}
    objEvents[events] = args.shift()
    events = objEvents
  }

  // Walk through each key in the events object and add vendor prefixes to 'animation' events
  // and wrap callback in the tap function for all 'tap' events.
  //
  for ( event in events ) {

    if ( events.hasOwnProperty( event ) ) {
      var callback = events[event]

      // Events can be registered as space separated groups like "hover focus"
      // This handles each event independantly
      //
      event.split(' ').forEach( function( e ){

        // If it is an animation event, vendor prefix it, or fire the callback according to browser support
        e = animationEvent.transform( e )

        if ( isEmpty( e ) ) {
          // If it's empty, it has been removed since animation events are not supported.
          // In that case, trigger the event immediately
          callback()

        } else if ( e.match( /tap/ ) ) {

          // If it's a tap event, wrap the callback and set the event to 'touchstart'
          // Tap isn't a real native event, but this wrapper lets us simulate what a
          // native tap event would be.
          //
          newEvents.touchstart = tap( callback )
        } else {
          newEvents[ e ] = callback
        }
      })
    }
  }

  for ( event in newEvents ) {
    var a = []
    a.push( element, event )

    if ( delegate ) a.push( delegate )

    a.push( newEvents[ event ] )
    transformedArgs.push( a.concat( args ) )
  }

  return transformedArgs
}


function isEmpty( obj ) {

  var hasOwnProperty = Object.prototype.hasOwnProperty

  if ( obj == null || obj.length === 0 ) return true

  if ( 0 < obj.length ) return false

  for (var key in obj) {
    if ( hasOwnProperty.call( obj, key ) ) return false
  }

  return true;
}

},{"./lib/animation-events":6,"./lib/bubble-form-events":7,"./lib/callback-manager":8,"./lib/debounce":9,"./lib/delay":10,"./lib/media":11,"./lib/page":13,"./lib/repeat":14,"./lib/resize":15,"./lib/scroll":16,"./lib/shims/custom-event":17,"./lib/submit":18,"./lib/tap-events":19,"./lib/throttle":20,"bean":4,"keymaster":28}],6:[function(require,module,exports){
var cssAnimEventTypes = getAnimationEventTypes()
var supported = cssAnimEventTypes.animationstart !== undefined

module.exports = {
  transform: transformAnimationEvents
}

function camelCaseEventTypes(prefix) {
  prefix = prefix || '';

  return {
    animationstart: prefix + 'AnimationStart',
    animationend: prefix + 'AnimationEnd',
    animationiteration: prefix + 'AnimationIteration'
  };
}

function lowerCaseEventTypes(prefix) {
  prefix = prefix || '';

  return {
    animationstart: prefix + 'animationstart',
    animationend: prefix + 'animationend',
    animationiteration: prefix + 'animationiteration'
  };
}

/**
 * @return {Object} Animation event types {animationstart, animationend, animationiteration}
 */

function getAnimationEventTypes() {
  var prefixes = ['webkit', 'Moz', 'O', ''];
  var style = document.documentElement.style;

  // browser compliant
  if (undefined !== style.animationName) {
    return lowerCaseEventTypes();
  }

  for (var i = 0, len = prefixes.length, prefix; i < len; i++) {
    prefix = prefixes[i];

    if (undefined !== style[prefix + 'AnimationName']) {
      // Webkit
      if (0 === i) {
        return camelCaseEventTypes(prefix.toLowerCase());
      }
      // Mozilla
      else if (1 === i) {
        return lowerCaseEventTypes();
      }
      // Opera
      else if (2 === i) {
        return lowerCaseEventTypes(prefix.toLowerCase());
      }
    }
  }

  return {};
}


// Adds necessary add vendor prefixes or camelCased event names
//
function transformAnimationEvents (event) {
  if (!event.match(/animation/i)) {
    return event
  } else {
    if (cssAnimEventTypes[event]) {
      return cssAnimEventTypes[event]
    } else {
      if(window.env != 'test') {
        console.error('"' + event + '" is not a supported animation event')
      }
      return ''
    }
  }
}

},{}],7:[function(require,module,exports){
var Event = require( 'bean' ),
    page  = require( './page' ),
    formEls;

var formBubbling = false

var fireBubble = function ( event ) {
  if ( event.detail && event.detail.triggered ) { return false }

  var ev = new CustomEvent( event.type, { bubbles: true, cancelable: true, detail: { triggered: true } } )

  // Stop only 'submit' events. Stopping blur or foucs events seems to break FireFox input interactions.
  if ( event.type == 'submit' ) event.stopImmediatePropagation()

  event.target.dispatchEvent( ev )

  // Prevent default on original event if custom event is prevented
  if ( ev.defaultPrevented ) event.preventDefault() 
}

// Simplify setting the event type based on the element
var eventType = function ( el ) {
  return ( el.tagName == 'FORM' ) ? 'submit' : 'focus blur'
}

// Add event listeners
var bubbleOn = function ( el ) {
  Event.on( el, eventType( el ), fireBubble )
}

// Remove event listeners
var bubbleOff = function ( el ) {
  Event.off( el, eventType( el ), fireBubble )
}

// Add/Remove event listeners
var bubbleFormEvents = function () {
  if ( formBubbling ) { return } 
  page.change( function() {

    // Remove listeners from previous page
    if ( formEls ) Array.prototype.forEach.call( formEls, bubbleOff )

    // Add new listeners to this page
    formEls = document.querySelectorAll( 'form, input' )

    Array.prototype.forEach.call( formEls, bubbleOn )
  })

  var formBubbling = true
}

module.exports = bubbleFormEvents

},{"./page":13,"bean":4}],8:[function(require,module,exports){
var Manager = {
  new: function() {
    var manager = {

      callbacks: [],

      add: function( fn ) {

        var cb = Manager.callback.new( fn )
        manager.callbacks.push( cb )
        
        return cb

      },

      stop: function() {
        manager.callbacks.forEach( function( cb ) { cb.stop() } )
      },

      start: function() {
        manager.callbacks.forEach( function( cb ) { cb.start() } )
      },

      toggle: function( bool ) {
        manager.callbacks.forEach( function( cb ) { cb.toggle( bool ) } )
      },

      remove: function() {
        manager.callbacks = []
      },

      fire: function() {
        var args = Array.prototype.slice.call( arguments )
        manager.callbacks.forEach( function( fn ) { fn.apply( this, args ) } )
      }
    }

    return manager
  },

  callback: {
    new: function( fn ) {
      var cb = function() {
        if ( cb.enabled ) { fn.apply( fn, arguments ) }
      }

      cb.stop   = function() { cb.enabled = false }
      cb.start  = function() { cb.enabled = true }
      cb.toggle = function( bool ) {
        cb.enabled = ( 0 in arguments ) ? bool : !cb.enabled
      }
      cb.enabled = true

      return cb
    }
  }
}

module.exports = Manager

},{}],9:[function(require,module,exports){
var now = function() {
  return Date.now()
}

var pickFunction = function() {
  var found
  Array.prototype.forEach.call( arguments, function( candidate ) {
    if ( typeof( candidate ) == 'function' && !found ) { found = candidate }
  })

  return found
}

var debounce = function( fn, wait, options ) {

  // Allow options passed as the first argument
  if ( typeof( fn ) == 'object' ) { options = fn } 

  // Options won't be null
  else { options = options || {} }

  wait = options.wait || wait || 0

  var max            = options.max || false,
      leading        = ( ( 'leading'  in options ) ? options.leading  : false ),
      trailing       = ( ( 'trailing' in options ) ? options.trailing : true ),
      
      // Grab functions from options or default to first argument
      leadingFn      = pickFunction( options.leading, options.trailing, options.callback, fn ),
      trailingFn     = pickFunction( options.trailing, options.leading, options.callback, fn ),

      // State tracking vars
      args,                    // Track arguments passed to debounced callback
      queued         = false,  // Has a callback been added to the animation loop?
      handle         = {},     // Object for tracking functions and callbacks
      lastCalled     = 0,      // Keep a timer for debouncing
      lastInvoked    = 0,      // Keep a timer for max
      leadingBlocked = false;  // Track leading, throttling subsequent leading calls

  // Queue the function with requestAnimationFrame
  var invoke = function( callType ) {

    lastCalled = now()
    lastInvoked = now()
    queued = false
    leadingBlocked = true

    if ( callType === 'leading' ) {
      leadingFn.apply( leadingFn, args ) }
    else {
      trailingFn.apply( trailingFn, args ) }

  }

  // Load the loop into the animation queue
  var addToQueue = function () {

    if ( !queued ) {
      queued = true
      handle.value = requestAnimationFrame( loop )  // Add to browser's animation queue
    }

  }

  // Remove from animation queue and reset debounce 
  var removeFromQueue = function() {

    if ( "value" in handle ) {
      cancelAnimationFrame( handle.value )
      queued         = false
      lastCalled     = 0
      lastInvoked    = 0
      leadingBlocked = false
    }
    
  }

  // prevent infinite debouncing ( if options.max is set )
  var maxPassed = function() {
    return ( max && now() - lastInvoked >= max )
  }

  var waitReached = function() {
    return ( now() - lastCalled ) >= wait
  }

  // This gets loaded into the animation queue and determines whether to ivoke the debounced function
  var loop = function () {
  
    // Loop was executed so it's no longer in the animation queue
    queued = false
    
    if ( leading && !leadingBlocked ) {
      invoke( 'leading' )
    }

    // If function has been called to frequently to execute
    else if ( maxPassed() ) {

      if ( leading ) { invoke( 'leading' )  }
      else           { invoke( 'trailing' ) }

    } 
    
    // If function hasn't been called since last wait
    else if ( waitReached() ) {

      // If trailing it's safe to invoke
      if ( trailing ) { invoke( 'trailing' ) }

      // If leading, it's safe to remove block
      if ( leading )  { leadingBlocked = false }
     
    } else {
      addToQueue()
    }

  }

  // A wrapper function for queueing up function calls
  //
  var debounced = function() {
    lastCalled = now()
    args = arguments
    addToQueue()
  }

  debounced.stop = removeFromQueue

  return debounced
}

module.exports = debounce

},{}],10:[function(require,module,exports){
var now = function() {
  return Date.now()
}

var delay = function ( fn, wait ) {

  var argsStart = ( wait != null ) ? 2 : 1;
  var handle = {}

  handle.args  = Array.prototype.slice.call( arguments, argsStart )
  handle.wait  = wait || 0
  handle.start = now()

  handle.stop  = function () {
    if ( "value" in handle ) {
      cancelAnimationFrame( handle.value );
    }
  }

  handle.loop  = function () {

    // If wait limit has been reached
    if ( now() - handle.start >= handle.wait ) {
      fn.apply( fn, handle.args )

      // If repeat is set and is not 0
      if ( !!handle.repeat ) {
        handle.repeat = handle.repeat - 1
        handle.start = now()
        queueDelay( handle )
      } else if ( handle.repeat === 0 && handle.complete ) {
        handle.complete()
      }

    } else {
      queueDelay( handle )
    }

  }


  return queueDelay( handle )
}

var queueDelay = function ( handle ) {
  handle.value = requestAnimationFrame( handle.loop )
  return handle
}

module.exports = delay

},{}],11:[function(require,module,exports){
// This simplifies common uses for window.matchMedia 
// namely, adding listeners for width and height queries

function parseQuery( query, dimension ) {
  var result = {}

  if ( typeof( query ) === 'string' ) { return query }

  result.min = size( query.min, 'min-' + dimension )
  result.max = size( query.max, 'max-' + dimension )

  if ( result.min && result.max )
    result.query = result.min + ' and ' + result.max

  return result.query || result.min || result.max
}

function size( num, limit ) {
  return ( num ) ? '('+limit+': ' + toPx( num ) + ')' : null
}

function toPx( width ) {
  if ( typeof( width ) === 'number' ) { return width + 'px'}
  return width
}

var media = {

  width: function( query, fn ) {
    return media.listen( parseQuery( query, 'width' ), fn )
  },

  minWidth: function( size, fn ) { return media.width( { min: size }, fn ) },
  maxWidth: function( size, fn ) { return media.width( { max: size }, fn ) },

  height: function( query, fn ) {
    return media.listen( parseQuery( query, 'height' ), fn )
  },

  minHeight: function( size, fn ) { return media.height( { min: size }, fn ) },
  maxHeight: function( size, fn ) { return media.height( { max: size }, fn ) },

  listen: function( query, fn ) {
    var match = window.matchMedia( query )

    if ( fn ) {
      fn( match )
      match.addListener( fn )
    }

    return match
  }

}


module.exports = media

},{}],12:[function(require,module,exports){
var Event           = require( 'bean' )
var callbackManager = require( './callback-manager' )
var throttle        = require( './throttle' )
var debounce        = require( './debounce' )

var optimizedEventManager = {
  new: function( name ) {

    // Create a new callback manager
    var manager = {
      run: callbackManager.new(),
      start: callbackManager.new(),
      stop: callbackManager.new()
    }

    // run callbacks when event happens (at paint-ready frames)
    var running = throttle( manager.run.fire )

    // fire callbacks when event starts (at paint-ready frames)
    var started = debounce({
      leading: manager.start.fire,
      trailing: false,
      wait: 150
    })

    // fire callbacks when event starts (at paint-ready frames)
    var stopped = debounce( manager.stop.fire, 150 )

    Event.on( window, name, function() {
      running()
      started()
      stopped()
    })

    // Public API
    var run   = function ( fn ) { return manager.run.add( fn ) }
    run.start = function ( fn ) { return manager.start.add( fn ) }
    run.stop  = function ( fn ) { return manager.stop.add( fn ) }

    // Add custom events for to run optimized listeners. ( name -> Name )
    run( function() { Event.fire( window, 'optimized' +  name[0].toUpperCase() + name.substring(1) ) } )
    run.start( function() { Event.fire( window, name + 'Start' ) } )
    run.stop( function() { Event.fire( window, name + 'Stop' ) } )

    return run
  }
}

module.exports = optimizedEventManager

},{"./callback-manager":8,"./debounce":9,"./throttle":20,"bean":4}],13:[function(require,module,exports){
var Event           = require( 'bean' )
var callbackManager = require( './callback-manager' )

// Create a new page event manager
var manager = {
  ready: callbackManager.new(),
  change: callbackManager.new(),
  readyAlready: false,
  changed: false,
}

manager.ready.add( function(){
  manager.readyAlready = true 
})

manager.ready.add( function(){ 
  if ( !window.Turbolinks && !manager.changed ) { 
    manager.changed = true 
    manager.change.fire()
  }
})

var ready = function ( fn ) {
  if ( manager.readyAlready ) { fn() }
  return manager.ready.add( fn ) }

var change = function( fn ) {
  if ( manager.changed ) { fn() }
  return manager.change.add( fn ) }

// Make it easy to trigger ready callbacks
ready.fire = function () {
  manager.ready.fire()
  // Be sure ready can only be fired once
  manager.ready.stop() }

// Make it easy to trigger change callbacks
change.fire = function () {
  manager.change.fire() }

Event.on( document, 'DOMContentLoaded', ready.fire )
Event.on( document, 'page:change turbolinks:load', change.fire ) // Support custom and rails turbolinks page load events

module.exports = {
  ready: ready,
  change: change
}

},{"./callback-manager":8,"bean":4}],14:[function(require,module,exports){
var delay = require( './delay' )

var repeat = function( fn, wait, limit ) {

  var argsStart = 1,
      handle = delay ( fn, wait );

  if      ( limit != null ) { argsStart = 3 }
  else if ( wait  != null ) { argsStart = 2 }

  // Enable repeat ( -1 will repeat forever )
  handle.repeat = limit || -1
  handle.args   = Array.prototype.slice.call( arguments, argsStart )
  handle.stop   = handle.cancel

  return handle
}

module.exports = repeat

},{"./delay":10}],15:[function(require,module,exports){
var manager = require( './optimized-event-manager' )
var resize  = manager.new( 'resize' )

// Pause animations during resizing for better performance
resize.disableAnimation = function() {
  var style = '<style id="fullstop">.no-animation *, .no-animation *:after, .no-animation *:before {\
    transition: none !important; animation: none !important\
  }</style>'

  // Inject style for easy classname manipulation
  if ( !document.querySelector('style#fullstop') ) { 
    document.head.insertAdjacentHTML('beforeend', style)
  }

  resize.start( function() { document.body.classList.add( 'no-animation' ) } )
  resize.stop( function() {  document.body.classList.remove( 'no-animation' ) } )
}

module.exports = resize

},{"./optimized-event-manager":12}],16:[function(require,module,exports){
var manager = require( './optimized-event-manager' )
var scroll  = manager.new( 'scroll' )

scroll.disablePointer = function() {

  // Disable pointer interaction
  scroll.start( function() {
    document.documentElement.style.pointerEvents = 'none'
  })

  // Enable pointer interaction
  scroll.stop( function() {
    document.documentElement.style.pointerEvents = ''
  })
}

module.exports = scroll

},{"./optimized-event-manager":12}],17:[function(require,module,exports){
// Custom Event Polyfill
(function () {

  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})()

},{}],18:[function(require,module,exports){
// Manually trigger a cancelable form submit event.
function submit( form ) {
  if ( !form.tagName || form.tagName != 'FORM' ) {
    return console.error( 'Trigger this event on a form element' )
  }

  var ev = new CustomEvent( 'submit', { bubbles: true, cancelable: true, detail: { triggered: true } } )
  form.dispatchEvent( ev )

  // Submit form unless event default is prevented
  if ( !ev.defaultPrevented ) form.submit()
}

module.exports = submit

},{}],19:[function(require,module,exports){
var endEvents = [
  'touchend'
]

module.exports = Tap

// default tap timeout in ms
Tap.timeout = 200

function Tap(callback, options) {
  options = options || {}
  // if the user holds his/her finger down for more than 200ms,
  // then it's not really considered a tap.
  // however, you can make this configurable.
  var timeout = options.timeout || Tap.timeout

  // to keep track of the original listener
  listener.handler = callback

  return listener

  // el.addEventListener('touchstart', listener)
  function listener(e1) {
    // tap should only happen with a single finger
    if (!e1.touches || e1.touches.length > 1) return

    var el = e1.target
    var context = this
    var args = arguments;

    var timeout_id = setTimeout(cleanup, timeout)

    el.addEventListener('touchmove', cleanup)

    endEvents.forEach(function (event) {
      el.addEventListener(event, done)
    })

    function done(e2) {
      // since touchstart is added on the same tick
      // and because of bubbling,
      // it'll execute this on the same touchstart.
      // this filters out the same touchstart event.
      if (e1 === e2) return

      cleanup()

      // already handled
      if (e2.defaultPrevented) return

      // overwrite these functions so that they all to both start and events.
      var preventDefault = e1.preventDefault
      var stopPropagation = e1.stopPropagation

      e1.stopPropagation = function () {
        stopPropagation.call(e1)
        stopPropagation.call(e2)
      }

      e1.preventDefault = function () {
        preventDefault.call(e1)
        preventDefault.call(e2)
      }

      // calls the handler with the `end` event,
      // but i don't think it matters.
      callback.apply(context, args)
    }

    // cleanup end events
    // to cancel the tap, just run this early
    function cleanup(e2) {
      // if it's the same event as the origin,
      // then don't actually cleanup.
      // hit issues with this - don't remember
      if (e1 === e2) return

      clearTimeout(timeout_id)

      el.removeEventListener('touchmove', cleanup)

      endEvents.forEach(function (event) {
        el.removeEventListener(event, done)
      })
    }
  }
}

},{}],20:[function(require,module,exports){
var debounce = require( './debounce' )

var throttle = function( fn, wait, options ) {

  if ( typeof( fn ) == 'object' ) { options = fn; fn = undefined } 
  else { options = options || {} }

  options.wait = options.wait || wait || 0
  options.max  = options.max || options.wait
  options.callback = options.callback || fn
  options.leading  = true
  options.trailing = true

  return debounce(options)
}


module.exports = throttle

},{"./debounce":9}],21:[function(require,module,exports){
// Shims
require( './lib/shims/_classlist' )
var merge    = require( './lib/shims/_object.assign' ),
    event    = require( 'compose-event' ),
    luxon    = require( 'luxon' ),
    time     = merge(require( './lib/time' ), luxon),
    scrollTo = require( './lib/scrollto' ),
    fromTop  = require( './lib/fromtop' ),
    ease     = require( './lib/ease' )

var toolbox = {

  event: event,
  scrollTo: scrollTo,
  fromTop: fromTop,
  merge: merge,
  ease: ease,
  time: time,

  // Get closest DOM element up the tree that matches a given selector
  getClosest: function ( el, selector ) {
    for ( ; el && el !== document; el = el.parentNode ) {
      if ( toolbox.matches( el, selector ) ) return el
    }
    return false
  },

  childOf: function ( el, parent ) {
    for ( ; el && el !== document; el = el.parentNode ) {
      if ( el == parent ) return true;
    }
    return false
  },

  // Get next DOM element that matches a given selector
  getNext: function( el, selector ) {
    for ( ; el && el !== document; el = el.parentNode ) {
      if ( el.querySelector( selector ) ) return el.querySelector( selector );
    }
    return false;
  },

  // Matches selector function
  // @reference https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
  matches: function ( el, selector ) {
    return ( el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector ).call( el, selector );
  },

  wordCount: function( str ) {
    var matches = str.match( /\S+/g );
    return matches ? matches.length : 0;
  },

  // Easy access to slice for converting objects into arrays of values.
  slice: function( obj, count ) {
    return Array.prototype.slice.call( obj, count )
  },

  each: function( collection, callback ) {
    return Array.prototype.forEach.call( collection, callback )
  },

  formData: function( rootEl ) {
    var formData  = new FormData(),
        fields = rootEl.querySelectorAll( 'input[name]' )

    // Loop over fields
    toolbox.each( fields, function( field ) {
      // Append current field’s name/value to new formData object
      formData.append( field.name, field.value );
    })

    // Then return said formData object
    return formData;
  }

}


module.exports = toolbox

},{"./lib/ease":22,"./lib/fromtop":23,"./lib/scrollto":24,"./lib/shims/_classlist":25,"./lib/shims/_object.assign":26,"./lib/time":27,"compose-event":5,"luxon":29}],22:[function(require,module,exports){
// easing functions http://gizma.com/easing/
var ease = {

  inOutQuad: function (t, b, c, d) {
    t /= d/2
    if (t < 1) { return c/2*t*t + b }
    t--
    return -c/2 * (t*(t-2) - 1) + b
  },

  inOutCubic: function (t, b, c, d) {
	t /= d/2;
	if (t < 1) return c/2*t*t*t + b;
	t -= 2;
	return c/2*(t*t*t + 2) + b;
  },

  inOutQuint: function(t, b, c, d) {
    var ts = (t/=d)*t,
    tc = ts*t;
    return b+c*(6*tc*ts + -15*ts*ts + 10*tc);
  },

  inOutCirc: function (t, b, c, d) {
    t /= d/2;
    if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
    t -= 2;
    return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
  }

}

ease.default = ease.inOutQuad

module.exports = ease

},{}],23:[function(require,module,exports){
module.exports = function( el ) {
  return Math.round( el.getBoundingClientRect().top + window.pageYOffset );
}

},{}],24:[function(require,module,exports){
var ease    = require( './ease' )
var fromTop = require( './fromtop' )

function move(amount) {

  // Scroll all because document.scrollingElement is still expiremental
  document.documentElement.scrollTop = amount;
  document.body.parentNode.scrollTop = amount;
  document.body.scrollTop = amount;

}

function position() {
  return document.documentElement.scrollTop || document.body.parentNode.scrollTop || document.body.scrollTop;
}

function scrollTo(to, callback, duration) {

  // Making args flexible
  //
  // Allow for element or y-coordinates
  if( typeof( to ) === 'object' ) { to = fromTop( to ) }

  // Accept duration as the second argument
  if( typeof( callback ) === 'number' ) { duration = callback; callback = null }

  // Default duration = 500
  duration = ( typeof( duration ) === 'undefined' ) ? 500 : duration

  var start = position(),
    change = to - start,
    currentTime = 0,
    increment = 20;


  var animateScroll = function() {

    // increment the time
    currentTime += increment

    // find the value with the quadratic in-out easing function
    var val = ease.default(currentTime, start, change, duration)

    // move the document.body
    move(val);

    // do the animation unless its over
    if ( currentTime < duration ) {
      requestAnimationFrame( animateScroll )
    } else {
      if ( callback && typeof( callback ) === 'function') {
        callback()
      }
    }
  }

  animateScroll()
}

module.exports = scrollTo

},{"./ease":22,"./fromtop":23}],25:[function(require,module,exports){
/**
 * ClassList polyfill
 * Cross-browser full element.classList implementation
 * @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js
 * @author Eli Grey - http://eligrey.com
 * @license MIT
 **/

if ( 'document' in self ) {

  // Full polyfill for browsers with no classList support
  if ( !( 'classList' in document.createElement( '_' ) ) ) {

    ( function( view ) {

    'use strict';

    if ( !( 'Element' in view ) ) return;

    var
      classListProp = 'classList',
      protoProp     = 'prototype',
      elemCtrProto  = view.Element[ protoProp ],
      objCtr        = Object,

      strTrim = String[ protoProp ].trim || function() {
        return this.replace( /^\s+|\s+$/g, '' );
      },

      arrIndexOf = Array[ protoProp ].indexOf || function( item ) {
        for ( var i = 0; i < this.length; i++ ) {
          if ( i in this && this[ i ] === item ) {
            return i;
          }
        }
        return -1;
      },

      DOMEx = function( type, message ) {
        this.name    = type;
        this.code    = DOMException[ type ];
        this.message = message;
      },

      checkTokenAndGetIndex = function( classList, token ) {
        if ( token === '' ) {
          throw new DOMEx(
            'SYNTAX_ERR',
            'An invalid or illegal string was specified'
          );
        }
        if ( /\s/.test( token ) ) {
          throw new DOMEx(
            'INVALID_CHARACTER_ERR',
            'String contains an invalid character'
          );
        }
        return arrIndexOf.call( classList, token );
      },

      ClassList = function( elem ) {
        var trimmedClasses = strTrim.call( elem.getAttribute( 'class' ) || '' ),
            classes = trimmedClasses ? trimmedClasses.split( /\s+/ ) : [];

        for ( var i = 0; i < classes.length; i++ ) {
          this.push( classes[ i ] );
        }

        this._updateClassName = function() {
          elem.setAttribute( 'class', this.toString() );
        };
      },

      classListProto = ClassList[ protoProp ] = [],

      classListGetter = function() {
        return new ClassList( this );
      };

    DOMEx[ protoProp ] = Error[ protoProp ];

    classListProto.item = function( i ) {
      return this[ i ] || null;
    };

    classListProto.contains = function( token ) {
      token += '';
      return checkTokenAndGetIndex( this, token ) !== -1;
    };

    classListProto.add = function() {
      var
        tokens  = arguments,
        iter    = 0,
        len     = tokens.length,
        updated = false,
        token;

      do {
        token = tokens[ iter ] + '';
        if ( checkTokenAndGetIndex( this, token ) === -1 ) {
          this.push( token );
          updated = true;
        }
      }

      while ( ++iter < len );

      if ( updated ) {
        this._updateClassName();
      }
    };

    classListProto.remove = function() {
      var
        tokens  = arguments,
        iter    = 0,
        len     = tokens.length,
        updated = false,
        token,
        index;

      do {
        token = tokens[ iter ] + '';
        index = checkTokenAndGetIndex( this, token );

        while ( index !== -1 ) {
          this.splice( index, 1 );
          updated = true;
          index = checkTokenAndGetIndex( this, token );
        }
      }

      while ( ++iter < len );

      if ( updated ) {
        this._updateClassName();
      }
    };

    classListProto.toggle = function( token, force ) {
      token += '';

      var
        result = this.contains( token ),
        method = result ? force !== true && 'remove' : force !== false && 'add';

      if ( method ) {
        this[ method ]( token );
      }

      if ( force === true || force === false ) {
        return force;
      } else {
        return !result;
      }
    };

    classListProto.toString = function() {
      return this.join( ' ' );
    };

    if ( objCtr.defineProperty ) {
      var classListPropDesc = {
          get          : classListGetter,
          enumerable   : true,
          configurable : true
      };

      try {
        objCtr.defineProperty( elemCtrProto, classListProp, classListPropDesc );
      }

      catch ( ex ) {
        if ( ex.number === -0x7FF5EC54 ) {
          classListPropDesc.enumerable = false;
          objCtr.defineProperty( elemCtrProto, classListProp, classListPropDesc );
        }
      }

    } else if ( objCtr[ protoProp ].__defineGetter__ ) {
      elemCtrProto.__defineGetter__( classListProp, classListGetter );
    }

    }( self ));

  } else {

    ( function() {

      'use strict';

      var testElement = document.createElement( '_' );

      testElement.classList.add( 'c1', 'c2' );

      if ( !testElement.classList.contains( 'c2' ) ) {
        var createMethod = function( method ) {
          var original = DOMTokenList.prototype[ method ];

          DOMTokenList.prototype[ method ] = function( token ) {
            var i, len = arguments.length;

            for ( i = 0; i < len; i++ ) {
              token = arguments[ i ];
              original.call( this, token );
            }
          };
        };
        createMethod( 'add' );
        createMethod( 'remove' );
      }

      testElement.classList.toggle( 'c3', false );

      if ( testElement.classList.contains( 'c3' ) ) {
        var _toggle = DOMTokenList.prototype.toggle;

        DOMTokenList.prototype.toggle = function( token, force ) {
          if ( 1 in arguments && !this.contains( token ) === !force ) {
            return force;
          } else {
            return _toggle.call( this, token );
          }
        };

      }

      testElement = null;

    }());

  }
}

},{}],26:[function(require,module,exports){
/**
 * Object.assign polyfill
 * Cross-browser full Object.assign implementation
 * @source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
 * @license MIT
 **/

if ( typeof Object.assign != 'function' ) {
  ( function() {
    Object.assign = function( target ) {
      'use strict';
      if ( target === undefined || target === null ) {
        throw new TypeError( 'Cannot convert undefined or null to object' );
      }

      var output = Object( target );
      for ( var index = 1; index < arguments.length; index++ ) {
        var source = arguments[ index ];
        if ( source !== undefined && source !== null ) {
          for ( var nextKey in source ) {
            if ( Object.prototype.hasOwnProperty.call( source, nextKey ) ) {
              output[ nextKey ] = source[ nextKey ];
            }
          }
        }
      }
      return output;
    };
  })();
}

// Make it easy to merge objects without overwriting the original objects
var merge = function() {
  var args = [{}].concat( Array.prototype.slice.call( arguments ) )
  return Object.assign.apply( this, args )
}

module.exports = merge

},{}],27:[function(require,module,exports){
var DateTime = require( 'luxon' ).DateTime

function isBefore( date, end ) {
  end = parse( end )
  date = parse( date )
  return date == DateTime.min( end, date )
}

function isAfter( date, start ) {
  start = parse( start )
  date = parse( date )
  return date == DateTime.max( start, date )
}

function isBetween( date, start, end ) {
  start = parse( start )
  end  = parse( end )
  date = parse( date )
  return DateTime.max( start, date ) == DateTime.min( date, end )
}

function parse( date ) {
  var formats = [ "fromISO", "fromSQL", "fromHTTP", "fromRFC2822", "fromMillis" ],
      parsedDate

  if ( typeof date == 'object' ) {
    if ( date.toISO ) return date
    parsedDate = DateTime.fromObject( date )

  } else {
    date = String( date )
    formats.forEach( function( format ) {
      if ( !parsedDate || parsedDate.invalid ) {
        parsedDate = DateTime[format]( date, { locale: 'en-us' } )
      }
    })
  }

  if ( !parsedDate.invalid )
    return parsedDate
  else
    return false
}

module.exports = {
  isBefore: isBefore,
  isAfter: isAfter,
  isBetween: isBetween,
  parse: parse
}

},{"luxon":29}],28:[function(require,module,exports){
//     keymaster.js
//     (c) 2011-2013 Thomas Fuchs
//     keymaster.js may be freely distributed under the MIT license.

;(function(global){
  var k,
    _handlers = {},
    _mods = { 16: false, 18: false, 17: false, 91: false },
    _scope = 'all',
    // modifier keys
    _MODIFIERS = {
      '⇧': 16, shift: 16,
      '⌥': 18, alt: 18, option: 18,
      '⌃': 17, ctrl: 17, control: 17,
      '⌘': 91, command: 91
    },
    // special keys
    _MAP = {
      backspace: 8, tab: 9, clear: 12,
      enter: 13, 'return': 13,
      esc: 27, escape: 27, space: 32,
      left: 37, up: 38,
      right: 39, down: 40,
      del: 46, 'delete': 46,
      home: 36, end: 35,
      pageup: 33, pagedown: 34,
      ',': 188, '.': 190, '/': 191,
      '`': 192, '-': 189, '=': 187,
      ';': 186, '\'': 222,
      '[': 219, ']': 221, '\\': 220
    },
    code = function(x){
      return _MAP[x] || x.toUpperCase().charCodeAt(0);
    },
    _downKeys = [];

  for(k=1;k<20;k++) _MAP['f'+k] = 111+k;

  // IE doesn't support Array#indexOf, so have a simple replacement
  function index(array, item){
    var i = array.length;
    while(i--) if(array[i]===item) return i;
    return -1;
  }

  // for comparing mods before unassignment
  function compareArray(a1, a2) {
    if (a1.length != a2.length) return false;
    for (var i = 0; i < a1.length; i++) {
        if (a1[i] !== a2[i]) return false;
    }
    return true;
  }

  var modifierMap = {
      16:'shiftKey',
      18:'altKey',
      17:'ctrlKey',
      91:'metaKey'
  };
  function updateModifierKey(event) {
      for(k in _mods) _mods[k] = event[modifierMap[k]];
  };

  // handle keydown event
  function dispatch(event) {
    var key, handler, k, i, modifiersMatch, scope;
    key = event.keyCode;

    if (index(_downKeys, key) == -1) {
        _downKeys.push(key);
    }

    // if a modifier key, set the key.<modifierkeyname> property to true and return
    if(key == 93 || key == 224) key = 91; // right command on webkit, command on Gecko
    if(key in _mods) {
      _mods[key] = true;
      // 'assignKey' from inside this closure is exported to window.key
      for(k in _MODIFIERS) if(_MODIFIERS[k] == key) assignKey[k] = true;
      return;
    }
    updateModifierKey(event);

    // see if we need to ignore the keypress (filter() can can be overridden)
    // by default ignore key presses if a select, textarea, or input is focused
    if(!assignKey.filter.call(this, event)) return;

    // abort if no potentially matching shortcuts found
    if (!(key in _handlers)) return;

    scope = getScope();

    // for each potential shortcut
    for (i = 0; i < _handlers[key].length; i++) {
      handler = _handlers[key][i];

      // see if it's in the current scope
      if(handler.scope == scope || handler.scope == 'all'){
        // check if modifiers match if any
        modifiersMatch = handler.mods.length > 0;
        for(k in _mods)
          if((!_mods[k] && index(handler.mods, +k) > -1) ||
            (_mods[k] && index(handler.mods, +k) == -1)) modifiersMatch = false;
        // call the handler and stop the event if neccessary
        if((handler.mods.length == 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91]) || modifiersMatch){
          if(handler.method(event, handler)===false){
            if(event.preventDefault) event.preventDefault();
              else event.returnValue = false;
            if(event.stopPropagation) event.stopPropagation();
            if(event.cancelBubble) event.cancelBubble = true;
          }
        }
      }
    }
  };

  // unset modifier keys on keyup
  function clearModifier(event){
    var key = event.keyCode, k,
        i = index(_downKeys, key);

    // remove key from _downKeys
    if (i >= 0) {
        _downKeys.splice(i, 1);
    }

    if(key == 93 || key == 224) key = 91;
    if(key in _mods) {
      _mods[key] = false;
      for(k in _MODIFIERS) if(_MODIFIERS[k] == key) assignKey[k] = false;
    }
  };

  function resetModifiers() {
    for(k in _mods) _mods[k] = false;
    for(k in _MODIFIERS) assignKey[k] = false;
  };

  // parse and assign shortcut
  function assignKey(key, scope, method){
    var keys, mods;
    keys = getKeys(key);
    if (method === undefined) {
      method = scope;
      scope = 'all';
    }

    // for each shortcut
    for (var i = 0; i < keys.length; i++) {
      // set modifier keys if any
      mods = [];
      key = keys[i].split('+');
      if (key.length > 1){
        mods = getMods(key);
        key = [key[key.length-1]];
      }
      // convert to keycode and...
      key = key[0]
      key = code(key);
      // ...store handler
      if (!(key in _handlers)) _handlers[key] = [];
      _handlers[key].push({ shortcut: keys[i], scope: scope, method: method, key: keys[i], mods: mods });
    }
  };

  // unbind all handlers for given key in current scope
  function unbindKey(key, scope) {
    var multipleKeys, keys,
      mods = [],
      i, j, obj;

    multipleKeys = getKeys(key);

    for (j = 0; j < multipleKeys.length; j++) {
      keys = multipleKeys[j].split('+');

      if (keys.length > 1) {
        mods = getMods(keys);
        key = keys[keys.length - 1];
      }

      key = code(key);

      if (scope === undefined) {
        scope = getScope();
      }
      if (!_handlers[key]) {
        return;
      }
      for (i = 0; i < _handlers[key].length; i++) {
        obj = _handlers[key][i];
        // only clear handlers if correct scope and mods match
        if (obj.scope === scope && compareArray(obj.mods, mods)) {
          _handlers[key][i] = {};
        }
      }
    }
  };

  // Returns true if the key with code 'keyCode' is currently down
  // Converts strings into key codes.
  function isPressed(keyCode) {
      if (typeof(keyCode)=='string') {
        keyCode = code(keyCode);
      }
      return index(_downKeys, keyCode) != -1;
  }

  function getPressedKeyCodes() {
      return _downKeys.slice(0);
  }

  function filter(event){
    var tagName = (event.target || event.srcElement).tagName;
    // ignore keypressed in any elements that support keyboard data input
    return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
  }

  // initialize key.<modifier> to false
  for(k in _MODIFIERS) assignKey[k] = false;

  // set current scope (default 'all')
  function setScope(scope){ _scope = scope || 'all' };
  function getScope(){ return _scope || 'all' };

  // delete all handlers for a given scope
  function deleteScope(scope){
    var key, handlers, i;

    for (key in _handlers) {
      handlers = _handlers[key];
      for (i = 0; i < handlers.length; ) {
        if (handlers[i].scope === scope) handlers.splice(i, 1);
        else i++;
      }
    }
  };

  // abstract key logic for assign and unassign
  function getKeys(key) {
    var keys;
    key = key.replace(/\s/g, '');
    keys = key.split(',');
    if ((keys[keys.length - 1]) == '') {
      keys[keys.length - 2] += ',';
    }
    return keys;
  }

  // abstract mods logic for assign and unassign
  function getMods(key) {
    var mods = key.slice(0, key.length - 1);
    for (var mi = 0; mi < mods.length; mi++)
    mods[mi] = _MODIFIERS[mods[mi]];
    return mods;
  }

  // cross-browser events
  function addEvent(object, event, method) {
    if (object.addEventListener)
      object.addEventListener(event, method, false);
    else if(object.attachEvent)
      object.attachEvent('on'+event, function(){ method(window.event) });
  };

  // set the handlers globally on document
  addEvent(document, 'keydown', function(event) { dispatch(event) }); // Passing _scope to a callback to ensure it remains the same by execution. Fixes #48
  addEvent(document, 'keyup', clearModifier);

  // reset modifiers to false whenever the window is (re)focused.
  addEvent(window, 'focus', resetModifiers);

  // store previously defined key
  var previousKey = global.key;

  // restore previously defined key and return reference to our key object
  function noConflict() {
    var k = global.key;
    global.key = previousKey;
    return k;
  }

  // set window.key and window.key.set/get/deleteScope, and the default filter
  global.key = assignKey;
  global.key.setScope = setScope;
  global.key.getScope = getScope;
  global.key.deleteScope = deleteScope;
  global.key.filter = filter;
  global.key.isPressed = isPressed;
  global.key.getPressedKeyCodes = getPressedKeyCodes;
  global.key.noConflict = noConflict;
  global.key.unbind = unbindKey;

  if(typeof module !== 'undefined') module.exports = assignKey;

})(this);

},{}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*
  This is just a junk drawer, containing anything used across multiple classes.
  Because Luxon is small(ish), this should stay small and we won't worry about splitting
  it up into, say, parsingUtil.js and basicUtil.js and so on. But they are divided up by feature area.
*/

/**
 * @private
 */

// TYPES

function isUndefined(o) {
  return typeof o === 'undefined';
}

function isNumber(o) {
  return typeof o === 'number';
}

function isString(o) {
  return typeof o === 'string';
}

function isDate(o) {
  return Object.prototype.toString.call(o) === '[object Date]';
}

// CAPABILITIES

function hasIntl() {
  return typeof Intl !== 'undefined' && Intl.DateTimeFormat;
}

function hasFormatToParts() {
  return !isUndefined(Intl.DateTimeFormat.prototype.formatToParts);
}

// OBJECTS AND ARRAYS

function maybeArray(thing) {
  return Array.isArray(thing) ? thing : [thing];
}

function bestBy(arr, by, compare) {
  if (arr.length === 0) {
    return undefined;
  }
  return arr.reduce(function (best, next) {
    var pair = [by(next), next];
    if (!best) {
      return pair;
    } else if (compare.apply(null, [best[0], pair[0]]) === best[0]) {
      return best;
    } else {
      return pair;
    }
  }, null)[1];
}

function pick(obj, keys) {
  return keys.reduce(function (a, k) {
    a[k] = obj[k];
    return a;
  }, {});
}

// NUMBERS AND STRINGS

function numberBetween(thing, bottom, top) {
  return isNumber(thing) && thing >= bottom && thing <= top;
}

// x % n but takes the sign of n instead of x
function floorMod(x, n) {
  return x - n * Math.floor(x / n);
}

function padStart(input) {
  var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;

  if (input.toString().length < n) {
    return ('0'.repeat(n) + input).slice(-n);
  } else {
    return input.toString();
  }
}

function parseMillis(fraction) {
  if (isUndefined(fraction)) {
    return NaN;
  } else {
    var f = parseFloat('0.' + fraction) * 1000;
    return Math.floor(f);
  }
}

function roundTo(number, digits) {
  var factor = Math.pow(10, digits);
  return Math.round(number * factor) / factor;
}

// DATE BASICS

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}

function daysInMonth(year, month) {
  var modMonth = floorMod(month - 1, 12) + 1,
      modYear = year + (month - modMonth) / 12;

  if (modMonth === 2) {
    return isLeapYear(modYear) ? 29 : 28;
  } else {
    return [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][modMonth - 1];
  }
}

function untruncateYear(year) {
  if (year > 99) {
    return year;
  } else return year > 60 ? 1900 + year : 2000 + year;
}

// PARSING

function parseZoneInfo(ts, offsetFormat, locale) {
  var timeZone = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  var date = new Date(ts),
      intlOpts = {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };

  if (timeZone) {
    intlOpts.timeZone = timeZone;
  }

  var modified = Object.assign({ timeZoneName: offsetFormat }, intlOpts),
      intl = hasIntl();

  if (intl && hasFormatToParts()) {
    var parsed = new Intl.DateTimeFormat(locale, modified).formatToParts(date).find(function (m) {
      return m.type.toLowerCase() === 'timezonename';
    });
    return parsed ? parsed.value : null;
  } else if (intl) {
    // this probably doesn't work for all locales
    var without = new Intl.DateTimeFormat(locale, intlOpts).format(date),
        included = new Intl.DateTimeFormat(locale, modified).format(date),
        diffed = included.substring(without.length),
        trimmed = diffed.replace(/^[, ]+/, '');
    return trimmed;
  } else {
    return null;
  }
}

// signedOffset('-5', '30') -> -330
function signedOffset(offHourStr, offMinuteStr) {
  var offHour = parseInt(offHourStr, 10) || 0,
      offMin = parseInt(offMinuteStr, 10) || 0,
      offMinSigned = offHour < 0 ? -offMin : offMin;
  return offHour * 60 + offMinSigned;
}

// COERCION

function normalizeObject(obj, normalizer) {
  var ignoreUnknown = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var normalized = {};
  for (var u in obj) {
    if (obj.hasOwnProperty(u)) {
      var v = obj[u];
      if (v !== null && !isUndefined(v) && !Number.isNaN(v)) {
        var mapped = normalizer(u, ignoreUnknown);
        if (mapped) {
          normalized[mapped] = v;
        }
      }
    }
  }
  return normalized;
}

function timeObject(obj) {
  return pick(obj, ['hour', 'minute', 'second', 'millisecond']);
}

/**
 * @private
 */

var n = 'numeric',
    s = 'short',
    l = 'long',
    d2 = '2-digit';

var DATE_SHORT = {
  year: n,
  month: n,
  day: n
};

var DATE_MED = {
  year: n,
  month: s,
  day: n
};

var DATE_FULL = {
  year: n,
  month: l,
  day: n
};

var DATE_HUGE = {
  year: n,
  month: l,
  day: n,
  weekday: l
};

var TIME_SIMPLE = {
  hour: n,
  minute: d2
};

var TIME_WITH_SECONDS = {
  hour: n,
  minute: d2,
  second: d2
};

var TIME_WITH_SHORT_OFFSET = {
  hour: n,
  minute: d2,
  second: d2,
  timeZoneName: s
};

var TIME_WITH_LONG_OFFSET = {
  hour: n,
  minute: d2,
  second: d2,
  timeZoneName: l
};

var TIME_24_SIMPLE = {
  hour: n,
  minute: d2,
  hour12: false
};

/**
 * {@link toLocaleString}; format like '09:30:23', always 24-hour.
 */
var TIME_24_WITH_SECONDS = {
  hour: n,
  minute: d2,
  second: d2,
  hour12: false
};

/**
 * {@link toLocaleString}; format like '09:30:23 EDT', always 24-hour.
 */
var TIME_24_WITH_SHORT_OFFSET = {
  hour: n,
  minute: d2,
  second: d2,
  hour12: false,
  timeZoneName: s
};

/**
 * {@link toLocaleString}; format like '09:30:23 Eastern Daylight Time', always 24-hour.
 */
var TIME_24_WITH_LONG_OFFSET = {
  hour: n,
  minute: d2,
  second: d2,
  hour12: false,
  timeZoneName: l
};

/**
 * {@link toLocaleString}; format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
 */
var DATETIME_SHORT = {
  year: n,
  month: n,
  day: n,
  hour: n,
  minute: d2
};

/**
 * {@link toLocaleString}; format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
 */
var DATETIME_SHORT_WITH_SECONDS = {
  year: n,
  month: n,
  day: n,
  hour: n,
  minute: d2,
  second: d2
};

var DATETIME_MED = {
  year: n,
  month: s,
  day: n,
  hour: n,
  minute: d2
};

var DATETIME_MED_WITH_SECONDS = {
  year: n,
  month: s,
  day: n,
  hour: n,
  minute: d2,
  second: d2
};

var DATETIME_FULL = {
  year: n,
  month: l,
  day: n,
  hour: n,
  minute: d2,
  timeZoneName: s
};

var DATETIME_FULL_WITH_SECONDS = {
  year: n,
  month: l,
  day: n,
  hour: n,
  minute: d2,
  second: d2,
  timeZoneName: s
};

var DATETIME_HUGE = {
  year: n,
  month: l,
  day: n,
  weekday: l,
  hour: n,
  minute: d2,
  timeZoneName: l
};

var DATETIME_HUGE_WITH_SECONDS = {
  year: n,
  month: l,
  day: n,
  weekday: l,
  hour: n,
  minute: d2,
  second: d2,
  timeZoneName: l
};

function stringify(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/**
 * @private
 */

var monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

var monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var monthsNarrow = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function months(length) {
  switch (length) {
    case 'narrow':
      return monthsNarrow;
    case 'short':
      return monthsShort;
    case 'long':
      return monthsLong;
    case 'numeric':
      return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    case '2-digit':
      return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    default:
      return null;
  }
}

var weekdaysLong = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

var weekdaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

var weekdaysNarrow = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function weekdays(length) {
  switch (length) {
    case 'narrow':
      return weekdaysNarrow;
    case 'short':
      return weekdaysShort;
    case 'long':
      return weekdaysLong;
    case 'numeric':
      return ['1', '2', '3', '4', '5', '6', '7'];
    default:
      return null;
  }
}

var meridiems = ['AM', 'PM'];

var erasLong = ['Before Christ', 'Anno Domini'];

var erasShort = ['BC', 'AD'];

var erasNarrow = ['B', 'A'];

function eras(length) {
  switch (length) {
    case 'narrow':
      return erasNarrow;
    case 'short':
      return erasShort;
    case 'long':
      return erasLong;
    default:
      return null;
  }
}

function meridiemForDateTime(dt) {
  return meridiems[dt.hour < 12 ? 0 : 1];
}

function weekdayForDateTime(dt, length) {
  return weekdays(length)[dt.weekday - 1];
}

function monthForDateTime(dt, length) {
  return months(length)[dt.month - 1];
}

function eraForDateTime(dt, length) {
  return eras(length)[dt.year < 0 ? 0 : 1];
}

function formatString(knownFormat) {
  // these all have the offsets removed because we don't have access to them
  // without all the intl stuff this is backfilling
  var filtered = pick(knownFormat, ['weekday', 'era', 'year', 'month', 'day', 'hour', 'minute', 'second', 'timeZoneName', 'hour12']),
      key = stringify(filtered),
      dateTimeHuge = 'EEEE, LLLL d, yyyy, h:mm a';
  switch (key) {
    case stringify(DATE_SHORT):
      return 'M/d/yyyy';
    case stringify(DATE_MED):
      return 'LLL d, yyyy';
    case stringify(DATE_FULL):
      return 'LLLL d, yyyy';
    case stringify(DATE_HUGE):
      return 'EEEE, LLLL d, yyyy';
    case stringify(TIME_SIMPLE):
      return 'h:mm a';
    case stringify(TIME_WITH_SECONDS):
      return 'h:mm:ss a';
    case stringify(TIME_WITH_SHORT_OFFSET):
      return 'h:mm a';
    case stringify(TIME_WITH_LONG_OFFSET):
      return 'h:mm a';
    case stringify(TIME_24_SIMPLE):
      return 'HH:mm';
    case stringify(TIME_24_WITH_SECONDS):
      return 'HH:mm:ss';
    case stringify(TIME_24_WITH_SHORT_OFFSET):
      return 'HH:mm';
    case stringify(TIME_24_WITH_LONG_OFFSET):
      return 'HH:mm';
    case stringify(DATETIME_SHORT):
      return 'M/d/yyyy, h:mm a';
    case stringify(DATETIME_MED):
      return 'LLL d, yyyy, h:mm a';
    case stringify(DATETIME_FULL):
      return 'LLLL d, yyyy, h:mm a';
    case stringify(DATETIME_HUGE):
      return dateTimeHuge;
    case stringify(DATETIME_SHORT_WITH_SECONDS):
      return 'M/d/yyyy, h:mm:ss a';
    case stringify(DATETIME_MED_WITH_SECONDS):
      return 'LLL d, yyyy, h:mm:ss a';
    case stringify(DATETIME_FULL_WITH_SECONDS):
      return 'LLLL d, yyyy, h:mm:ss a';
    case stringify(DATETIME_HUGE_WITH_SECONDS):
      return 'EEEE, LLLL d, yyyy, h:mm:ss a';
    default:
      return dateTimeHuge;
  }
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

// these aren't really private, but nor are they really useful to document

/**
 * @private
 */
var LuxonError = function (_Error) {
  inherits(LuxonError, _Error);

  function LuxonError() {
    classCallCheck(this, LuxonError);
    return possibleConstructorReturn(this, _Error.apply(this, arguments));
  }

  return LuxonError;
}(Error);

/**
 * @private
 */


var InvalidDateTimeError = function (_LuxonError) {
  inherits(InvalidDateTimeError, _LuxonError);

  function InvalidDateTimeError(reason) {
    classCallCheck(this, InvalidDateTimeError);
    return possibleConstructorReturn(this, _LuxonError.call(this, 'Invalid DateTime: ' + reason));
  }

  return InvalidDateTimeError;
}(LuxonError);

/**
 * @private
 */
var InvalidIntervalError = function (_LuxonError2) {
  inherits(InvalidIntervalError, _LuxonError2);

  function InvalidIntervalError(reason) {
    classCallCheck(this, InvalidIntervalError);
    return possibleConstructorReturn(this, _LuxonError2.call(this, 'Invalid Interval: ' + reason));
  }

  return InvalidIntervalError;
}(LuxonError);

/**
 * @private
 */
var InvalidDurationError = function (_LuxonError3) {
  inherits(InvalidDurationError, _LuxonError3);

  function InvalidDurationError(reason) {
    classCallCheck(this, InvalidDurationError);
    return possibleConstructorReturn(this, _LuxonError3.call(this, 'Invalid Duration: ' + reason));
  }

  return InvalidDurationError;
}(LuxonError);

/**
 * @private
 */
var ConflictingSpecificationError = function (_LuxonError4) {
  inherits(ConflictingSpecificationError, _LuxonError4);

  function ConflictingSpecificationError() {
    classCallCheck(this, ConflictingSpecificationError);
    return possibleConstructorReturn(this, _LuxonError4.apply(this, arguments));
  }

  return ConflictingSpecificationError;
}(LuxonError);

/**
 * @private
 */
var InvalidUnitError = function (_LuxonError5) {
  inherits(InvalidUnitError, _LuxonError5);

  function InvalidUnitError(unit) {
    classCallCheck(this, InvalidUnitError);
    return possibleConstructorReturn(this, _LuxonError5.call(this, 'Invalid unit ' + unit));
  }

  return InvalidUnitError;
}(LuxonError);

/**
 * @private
 */
var InvalidArgumentError = function (_LuxonError6) {
  inherits(InvalidArgumentError, _LuxonError6);

  function InvalidArgumentError() {
    classCallCheck(this, InvalidArgumentError);
    return possibleConstructorReturn(this, _LuxonError6.apply(this, arguments));
  }

  return InvalidArgumentError;
}(LuxonError);

/**
 * @private
 */
var ZoneIsAbstractError = function (_LuxonError7) {
  inherits(ZoneIsAbstractError, _LuxonError7);

  function ZoneIsAbstractError() {
    classCallCheck(this, ZoneIsAbstractError);
    return possibleConstructorReturn(this, _LuxonError7.call(this, 'Zone is an abstract class'));
  }

  return ZoneIsAbstractError;
}(LuxonError);

/* eslint no-unused-vars: "off" */

/**
 * @interface
*/

var Zone = function () {
  function Zone() {
    classCallCheck(this, Zone);
  }

  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.localeCode - What locale to return the offset name in. Defaults to us-en
   * @return {string}
   */
  Zone.offsetName = function offsetName(ts, opts) {
    throw new ZoneIsAbstractError();
  };

  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */


  Zone.prototype.offset = function offset(ts) {
    throw new ZoneIsAbstractError();
  };

  /**
   * Return whether this Zone is equal to another zoner
   * @abstract
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */


  Zone.prototype.equals = function equals(otherZone) {
    throw new ZoneIsAbstractError();
  };

  /**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */


  createClass(Zone, [{
    key: 'type',

    /**
     * The type of zone
     * @abstract
     * @type {string}
     */
    get: function get$$1() {
      throw new ZoneIsAbstractError();
    }

    /**
     * The name of this zone.
     * @abstract
     * @type {string}
     */

  }, {
    key: 'name',
    get: function get$$1() {
      throw new ZoneIsAbstractError();
    }

    /**
     * Returns whether the offset is known to be fixed for the whole year.
     * @abstract
     * @type {boolean}
     */

  }, {
    key: 'universal',
    get: function get$$1() {
      throw new ZoneIsAbstractError();
    }
  }, {
    key: 'isValid',
    get: function get$$1() {
      throw new ZoneIsAbstractError();
    }
  }]);
  return Zone;
}();

var singleton = null;

/**
 * @private
 */

var LocalZone = function (_Zone) {
  inherits(LocalZone, _Zone);

  function LocalZone() {
    classCallCheck(this, LocalZone);
    return possibleConstructorReturn(this, _Zone.apply(this, arguments));
  }

  LocalZone.prototype.offsetName = function offsetName(ts, _ref) {
    var format = _ref.format,
        locale = _ref.locale;

    return parseZoneInfo(ts, format, locale);
  };

  LocalZone.prototype.offset = function offset(ts) {
    return -new Date(ts).getTimezoneOffset();
  };

  LocalZone.prototype.equals = function equals(otherZone) {
    return otherZone.type === 'local';
  };

  createClass(LocalZone, [{
    key: 'type',
    get: function get$$1() {
      return 'local';
    }
  }, {
    key: 'name',
    get: function get$$1() {
      if (hasIntl()) {
        return new Intl.DateTimeFormat().resolvedOptions().timeZone;
      } else return 'local';
    }
  }, {
    key: 'universal',
    get: function get$$1() {
      return false;
    }
  }, {
    key: 'isValid',
    get: function get$$1() {
      return true;
    }
  }], [{
    key: 'instance',
    get: function get$$1() {
      if (singleton === null) {
        singleton = new LocalZone();
      }
      return singleton;
    }
  }]);
  return LocalZone;
}(Zone);

var dtfCache = {};
function makeDTF(zone) {
  if (!dtfCache[zone]) {
    dtfCache[zone] = new Intl.DateTimeFormat('en-US', {
      hour12: false,
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  return dtfCache[zone];
}

var typeToPos = {
  year: 0,
  month: 1,
  day: 2,
  hour: 3,
  minute: 4,
  second: 5
};

function hackyOffset(dtf, date) {
  var formatted = dtf.format(date).replace(/\u200E/g, ''),
      parsed = /(\d+)\/(\d+)\/(\d+),? (\d+):(\d+):(\d+)/.exec(formatted),
      fMonth = parsed[1],
      fDay = parsed[2],
      fYear = parsed[3],
      fHour = parsed[4],
      fMinute = parsed[5],
      fSecond = parsed[6];

  return [fYear, fMonth, fDay, fHour, fMinute, fSecond];
}

function partsOffset(dtf, date) {
  var formatted = dtf.formatToParts(date),
      filled = [];
  for (var i = 0; i < formatted.length; i++) {
    var _formatted$i = formatted[i],
        type = _formatted$i.type,
        value = _formatted$i.value,
        pos = typeToPos[type];


    if (!isUndefined(pos)) {
      filled[pos] = parseInt(value, 10);
    }
  }
  return filled;
}

/**
 * @private
 */

var IANAZone = function (_Zone) {
  inherits(IANAZone, _Zone);

  IANAZone.isValidSpecifier = function isValidSpecifier(s) {
    return s && s.match(/^[a-z_+-]{1,256}\/[a-z_+-]{1,256}$/i);
  };

  IANAZone.isValidZone = function isValidZone(zone) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: zone }).format();
      return true;
    } catch (e) {
      return false;
    }
  };

  // Etc/GMT+8 -> 480


  IANAZone.parseGMTOffset = function parseGMTOffset(specifier) {
    if (specifier) {
      var match = specifier.match(/^Etc\/GMT([+-]\d{1,2})$/i);
      if (match) {
        return 60 * parseInt(match[1]);
      }
    }
    return null;
  };

  function IANAZone(name) {
    classCallCheck(this, IANAZone);

    var _this = possibleConstructorReturn(this, _Zone.call(this));

    _this.zoneName = name;
    _this.valid = IANAZone.isValidZone(name);
    return _this;
  }

  IANAZone.prototype.offsetName = function offsetName(ts, _ref) {
    var format = _ref.format,
        locale = _ref.locale;

    return parseZoneInfo(ts, format, locale, this.zoneName);
  };

  IANAZone.prototype.offset = function offset(ts) {
    var date = new Date(ts),
        dtf = makeDTF(this.zoneName),
        _ref2 = dtf.formatToParts ? partsOffset(dtf, date) : hackyOffset(dtf, date),
        fYear = _ref2[0],
        fMonth = _ref2[1],
        fDay = _ref2[2],
        fHour = _ref2[3],
        fMinute = _ref2[4],
        fSecond = _ref2[5],
        asUTC = Date.UTC(fYear, fMonth - 1, fDay, fHour, fMinute, fSecond);

    var asTS = date.valueOf();
    asTS -= asTS % 1000;
    return (asUTC - asTS) / (60 * 1000);
  };

  IANAZone.prototype.equals = function equals(otherZone) {
    return otherZone.type === 'iana' && otherZone.zoneName === this.zoneName;
  };

  createClass(IANAZone, [{
    key: 'type',
    get: function get$$1() {
      return 'iana';
    }
  }, {
    key: 'name',
    get: function get$$1() {
      return this.zoneName;
    }
  }, {
    key: 'universal',
    get: function get$$1() {
      return false;
    }
  }, {
    key: 'isValid',
    get: function get$$1() {
      return this.valid;
    }
  }]);
  return IANAZone;
}(Zone);

var singleton$1 = null;

function hoursMinutesOffset(z) {
  var hours = Math.trunc(z.fixed / 60),
      minutes = Math.abs(z.fixed % 60),
      sign = hours > 0 ? '+' : '-',
      base = sign + Math.abs(hours);
  return minutes > 0 ? base + ':' + padStart(minutes, 2) : base;
}

/**
 * @private
 */

var FixedOffsetZone = function (_Zone) {
  inherits(FixedOffsetZone, _Zone);

  FixedOffsetZone.instance = function instance(offset) {
    return offset === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset);
  };

  FixedOffsetZone.parseSpecifier = function parseSpecifier(s) {
    if (s) {
      var r = s.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
      if (r) {
        return new FixedOffsetZone(signedOffset(r[1], r[2]));
      }
    }
    return null;
  };

  createClass(FixedOffsetZone, null, [{
    key: 'utcInstance',
    get: function get$$1() {
      if (singleton$1 === null) {
        singleton$1 = new FixedOffsetZone(0);
      }
      return singleton$1;
    }
  }]);

  function FixedOffsetZone(offset) {
    classCallCheck(this, FixedOffsetZone);

    var _this = possibleConstructorReturn(this, _Zone.call(this));

    _this.fixed = offset;
    return _this;
  }

  FixedOffsetZone.prototype.offsetName = function offsetName() {
    return this.name;
  };

  FixedOffsetZone.prototype.offset = function offset() {
    return this.fixed;
  };

  FixedOffsetZone.prototype.equals = function equals(otherZone) {
    return otherZone.type === 'fixed' && otherZone.fixed === this.fixed;
  };

  createClass(FixedOffsetZone, [{
    key: 'type',
    get: function get$$1() {
      return 'fixed';
    }
  }, {
    key: 'name',
    get: function get$$1() {
      return this.fixed === 0 ? 'UTC' : 'UTC' + hoursMinutesOffset(this);
    }
  }, {
    key: 'universal',
    get: function get$$1() {
      return true;
    }
  }, {
    key: 'isValid',
    get: function get$$1() {
      return true;
    }
  }]);
  return FixedOffsetZone;
}(Zone);

var singleton$2 = null;

var InvalidZone = function (_Zone) {
  inherits(InvalidZone, _Zone);

  function InvalidZone() {
    classCallCheck(this, InvalidZone);
    return possibleConstructorReturn(this, _Zone.apply(this, arguments));
  }

  InvalidZone.prototype.offsetName = function offsetName() {
    return null;
  };

  InvalidZone.prototype.offset = function offset() {
    return NaN;
  };

  InvalidZone.prototype.equals = function equals() {
    return false;
  };

  createClass(InvalidZone, [{
    key: 'type',
    get: function get$$1() {
      return 'invalid';
    }
  }, {
    key: 'name',
    get: function get$$1() {
      return null;
    }
  }, {
    key: 'universal',
    get: function get$$1() {
      return false;
    }
  }, {
    key: 'isValid',
    get: function get$$1() {
      return false;
    }
  }], [{
    key: 'instance',
    get: function get$$1() {
      if (singleton$2 === null) {
        singleton$2 = new InvalidZone();
      }
      return singleton$2;
    }
  }]);
  return InvalidZone;
}(Zone);

/**
 * @private
 */

function normalizeZone(input, defaultZone) {
  var offset = void 0;
  if (isUndefined(input) || input === null) {
    return defaultZone;
  } else if (input instanceof Zone) {
    return input;
  } else if (isString(input)) {
    var lowered = input.toLowerCase();
    if (lowered === 'local') return LocalZone.instance;else if (lowered === 'utc') return FixedOffsetZone.utcInstance;else if ((offset = IANAZone.parseGMTOffset(input)) != null) {
      // handle Etc/GMT-4, which V8 chokes on
      return FixedOffsetZone.instance(offset);
    } else if (IANAZone.isValidSpecifier(lowered)) return new IANAZone(input);else return FixedOffsetZone.parseSpecifier(lowered) || InvalidZone.instance;
  } else if (isNumber(input)) {
    return FixedOffsetZone.instance(input);
  } else if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' && input.offset) {
    // This is dumb, but the instanceof check above doesn't seem to really work
    // so we're duck checking it
    return input;
  } else {
    return InvalidZone.instance;
  }
}

var now = function now() {
  return new Date().valueOf();
},
    defaultZone = null,
    // not setting this directly to LocalZone.instance bc loading order issues
defaultLocale = null,
    defaultNumberingSystem = null,
    defaultOutputCalendar = null,
    throwOnInvalid = false;

/**
 * Settings contains static getters and setters that control Luxon's overall behavior. Luxon is a simple library with few options, but the ones it does have live here.
 */

var Settings = function () {
  function Settings() {
    classCallCheck(this, Settings);
  }

  /**
   * Reset Luxon's global caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  Settings.resetCaches = function resetCaches() {
    Locale.resetCache();
  };

  createClass(Settings, null, [{
    key: 'now',

    /**
     * Get the callback for returning the current timestamp.
     * @type {function}
     */
    get: function get$$1() {
      return now;
    }

    /**
     * Set the callback for returning the current timestamp.
     * @type {function}
     */
    ,
    set: function set$$1(n) {
      now = n;
    }

    /**
     * Get the default time zone to create DateTimes in.
     * @type {string}
     */

  }, {
    key: 'defaultZoneName',
    get: function get$$1() {
      return (defaultZone || LocalZone.instance).name;
    }

    /**
     * Set the default time zone to create DateTimes in. Does not affect existing instances.
     * @type {string}
     */
    ,
    set: function set$$1(z) {
      if (!z) {
        defaultZone = null;
      } else {
        defaultZone = normalizeZone(z);
      }
    }

    /**
     * Get the default time zone object to create DateTimes in. Does not affect existing instances.
     * @type {Zone}
     */

  }, {
    key: 'defaultZone',
    get: function get$$1() {
      return defaultZone || LocalZone.instance;
    }

    /**
     * Get the default locale to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */

  }, {
    key: 'defaultLocale',
    get: function get$$1() {
      return defaultLocale;
    }

    /**
     * Set the default locale to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */
    ,
    set: function set$$1(locale) {
      defaultLocale = locale;
    }

    /**
     * Get the default numbering system to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */

  }, {
    key: 'defaultNumberingSystem',
    get: function get$$1() {
      return defaultNumberingSystem;
    }

    /**
     * Set the default numbering system to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */
    ,
    set: function set$$1(numberingSystem) {
      defaultNumberingSystem = numberingSystem;
    }

    /**
     * Get the default output calendar to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */

  }, {
    key: 'defaultOutputCalendar',
    get: function get$$1() {
      return defaultOutputCalendar;
    }

    /**
     * Set the default output calendar to create DateTimes with. Does not affect existing instances.
     * @type {string}
     */
    ,
    set: function set$$1(outputCalendar) {
      defaultOutputCalendar = outputCalendar;
    }

    /**
     * Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
     * @type {boolean}
     */

  }, {
    key: 'throwOnInvalid',
    get: function get$$1() {
      return throwOnInvalid;
    }

    /**
     * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
     * @type {boolean}
     */
    ,
    set: function set$$1(t) {
      throwOnInvalid = t;
    }
  }]);
  return Settings;
}();

function stringifyTokens(splits, tokenToString) {
  var s = '';
  for (var _iterator = splits, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var token = _ref;

    if (token.literal) {
      s += token.val;
    } else {
      s += tokenToString(token.val);
    }
  }
  return s;
}

var tokenToObject = {
  D: DATE_SHORT,
  DD: DATE_MED,
  DDD: DATE_FULL,
  DDDD: DATE_HUGE,
  t: TIME_SIMPLE,
  tt: TIME_WITH_SECONDS,
  ttt: TIME_WITH_SHORT_OFFSET,
  tttt: TIME_WITH_LONG_OFFSET,
  T: TIME_24_SIMPLE,
  TT: TIME_24_WITH_SECONDS,
  TTT: TIME_24_WITH_SHORT_OFFSET,
  TTTT: TIME_24_WITH_LONG_OFFSET,
  f: DATETIME_SHORT,
  ff: DATETIME_MED,
  fff: DATETIME_FULL,
  ffff: DATETIME_HUGE,
  F: DATETIME_SHORT_WITH_SECONDS,
  FF: DATETIME_MED_WITH_SECONDS,
  FFF: DATETIME_FULL_WITH_SECONDS,
  FFFF: DATETIME_HUGE_WITH_SECONDS
};

/**
 * @private
 */

var Formatter = function () {
  Formatter.create = function create(locale) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var formatOpts = Object.assign({}, { round: true }, opts);
    return new Formatter(locale, formatOpts);
  };

  Formatter.parseFormat = function parseFormat(fmt) {
    var current = null,
        currentFull = '',
        bracketed = false;
    var splits = [];
    for (var i = 0; i < fmt.length; i++) {
      var c = fmt.charAt(i);
      if (c === "'") {
        if (currentFull.length > 0) {
          splits.push({ literal: bracketed, val: currentFull });
        }
        current = null;
        currentFull = '';
        bracketed = !bracketed;
      } else if (bracketed) {
        currentFull += c;
      } else if (c === current) {
        currentFull += c;
      } else {
        if (currentFull.length > 0) {
          splits.push({ literal: false, val: currentFull });
        }
        currentFull = c;
        current = c;
      }
    }

    if (currentFull.length > 0) {
      splits.push({ literal: bracketed, val: currentFull });
    }

    return splits;
  };

  function Formatter(locale, formatOpts) {
    classCallCheck(this, Formatter);

    this.opts = formatOpts;
    this.loc = locale;
    this.systemLoc = null;
  }

  Formatter.prototype.formatWithSystemDefault = function formatWithSystemDefault(dt, opts) {
    if (this.systemLoc === null) {
      this.systemLoc = this.loc.redefaultToSystem();
    }
    var df = this.systemLoc.dtFormatter(dt, Object.assign({}, this.opts, opts));
    return df.format();
  };

  Formatter.prototype.formatDateTime = function formatDateTime(dt) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var df = this.loc.dtFormatter(dt, Object.assign({}, this.opts, opts));
    return df.format();
  };

  Formatter.prototype.formatDateTimeParts = function formatDateTimeParts(dt) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var df = this.loc.dtFormatter(dt, Object.assign({}, this.opts, opts));
    return df.formatToParts();
  };

  Formatter.prototype.resolvedOptions = function resolvedOptions(dt) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var df = this.loc.dtFormatter(dt, Object.assign({}, this.opts, opts));
    return df.resolvedOptions();
  };

  Formatter.prototype.num = function num(n) {
    var p = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    // we get some perf out of doing this here, annoyingly
    if (this.opts.forceSimple) {
      return padStart(n, p);
    }

    var opts = Object.assign({}, this.opts);

    if (p > 0) {
      opts.padTo = p;
    }

    return this.loc.numberFormatter(opts).format(n);
  };

  Formatter.prototype.formatDateTimeFromString = function formatDateTimeFromString(dt, fmt) {
    var _this = this;

    var knownEnglish = this.loc.listingMode() === 'en';
    var string = function string(opts, extract) {
      return _this.loc.extract(dt, opts, extract);
    },
        formatOffset = function formatOffset(opts) {
      if (dt.isOffsetFixed && dt.offset === 0 && opts.allowZ) {
        return 'Z';
      }

      var hours = Math.trunc(dt.offset / 60),
          minutes = Math.abs(dt.offset % 60),
          sign = hours >= 0 ? '+' : '-',
          base = '' + sign + Math.abs(hours);

      switch (opts.format) {
        case 'short':
          return '' + sign + _this.num(Math.abs(hours), 2) + ':' + _this.num(minutes, 2);
        case 'narrow':
          return minutes > 0 ? base + ':' + minutes : base;
        case 'techie':
          return '' + sign + _this.num(Math.abs(hours), 2) + _this.num(minutes, 2);
        default:
          throw new RangeError('Value format ' + opts.format + ' is out of range for property format');
      }
    },
        meridiem = function meridiem() {
      return knownEnglish ? meridiemForDateTime(dt) : string({ hour: 'numeric', hour12: true }, 'dayperiod');
    },
        month = function month(length, standalone) {
      return knownEnglish ? monthForDateTime(dt, length) : string(standalone ? { month: length } : { month: length, day: 'numeric' }, 'month');
    },
        weekday = function weekday(length, standalone) {
      return knownEnglish ? weekdayForDateTime(dt, length) : string(standalone ? { weekday: length } : { weekday: length, month: 'long', day: 'numeric' }, 'weekday');
    },
        maybeMacro = function maybeMacro(token) {
      var macro = tokenToObject[token];
      if (macro) {
        return _this.formatWithSystemDefault(dt, macro);
      } else {
        return token;
      }
    },
        era = function era(length) {
      return knownEnglish ? eraForDateTime(dt, length) : string({ era: length }, 'era');
    },
        tokenToString = function tokenToString(token) {
      var outputCal = _this.loc.outputCalendar;

      // Where possible: http://cldr.unicode.org/translation/date-time#TOC-Stand-Alone-vs.-Format-Styles
      switch (token) {
        // ms
        case 'S':
          return _this.num(dt.millisecond);
        case 'u':
        // falls through
        case 'SSS':
          return _this.num(dt.millisecond, 3);
        // seconds
        case 's':
          return _this.num(dt.second);
        case 'ss':
          return _this.num(dt.second, 2);
        // minutes
        case 'm':
          return _this.num(dt.minute);
        case 'mm':
          return _this.num(dt.minute, 2);
        // hours
        case 'h':
          return _this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12);
        case 'hh':
          return _this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12, 2);
        case 'H':
          return _this.num(dt.hour);
        case 'HH':
          return _this.num(dt.hour, 2);
        // offset
        case 'Z':
          // like +6
          return formatOffset({ format: 'narrow', allowZ: true });
        case 'ZZ':
          // like +06:00
          return formatOffset({ format: 'short', allowZ: true });
        case 'ZZZ':
          // like +0600
          return formatOffset({ format: 'techie', allowZ: false });
        case 'ZZZZ':
          // like EST
          return dt.offsetNameShort;
        case 'ZZZZZ':
          // like Eastern Standard Time
          return dt.offsetNameLong;
        // zone
        case 'z':
          // like America/New_York
          return dt.zoneName;
        // meridiems
        case 'a':
          return meridiem();
        // dates
        case 'd':
          return outputCal ? string({ day: 'numeric' }, 'day') : _this.num(dt.day);
        case 'dd':
          return outputCal ? string({ day: '2-digit' }, 'day') : _this.num(dt.day, 2);
        // weekdays - standalone
        case 'c':
          // like 1
          return _this.num(dt.weekday);
        case 'ccc':
          // like 'Tues'
          return weekday('short', true);
        case 'cccc':
          // like 'Tuesday'
          return weekday('long', true);
        case 'ccccc':
          // like 'T'
          return weekday('narrow', true);
        // weekdays - format
        case 'E':
          // like 1
          return _this.num(dt.weekday);
        case 'EEE':
          // like 'Tues'
          return weekday('short', false);
        case 'EEEE':
          // like 'Tuesday'
          return weekday('long', false);
        case 'EEEEE':
          // like 'T'
          return weekday('narrow', false);
        // months - standalone
        case 'L':
          // like 1
          return outputCal ? string({ month: 'numeric', day: 'numeric' }, 'month') : _this.num(dt.month);
        case 'LL':
          // like 01, doesn't seem to work
          return outputCal ? string({ month: '2-digit', day: 'numeric' }, 'month') : _this.num(dt.month, 2);
        case 'LLL':
          // like Jan
          return month('short', true);
        case 'LLLL':
          // like January
          return month('long', true);
        case 'LLLLL':
          // like J
          return month('narrow', true);
        // months - format
        case 'M':
          // like 1
          return outputCal ? string({ month: 'numeric' }, 'month') : _this.num(dt.month);
        case 'MM':
          // like 01
          return outputCal ? string({ month: '2-digit' }, 'month') : _this.num(dt.month, 2);
        case 'MMM':
          // like Jan
          return month('short', false);
        case 'MMMM':
          // like January
          return month('long', false);
        case 'MMMMM':
          // like J
          return month('narrow', false);
        // years
        case 'y':
          // like 2014
          return outputCal ? string({ year: 'numeric' }, 'year') : _this.num(dt.year);
        case 'yy':
          // like 14
          return outputCal ? string({ year: '2-digit' }, 'year') : _this.num(dt.year.toString().slice(-2), 2);
        case 'yyyy':
          // like 0012
          return outputCal ? string({ year: 'numeric' }, 'year') : _this.num(dt.year, 4);
        case 'yyyyyy':
          // like 000012
          return outputCal ? string({ year: 'numeric' }, 'year') : _this.num(dt.year, 6);
        // eras
        case 'G':
          // like AD
          return era('short');
        case 'GG':
          // like Anno Domini
          return era('long');
        case 'GGGGG':
          return era('narrow');
        case 'kk':
          return _this.num(dt.weekYear.toString().slice(-2), 2);
        case 'kkkk':
          return _this.num(dt.weekYear, 4);
        case 'W':
          return _this.num(dt.weekNumber);
        case 'WW':
          return _this.num(dt.weekNumber, 2);
        case 'o':
          return _this.num(dt.ordinal);
        case 'ooo':
          return _this.num(dt.ordinal, 3);
        case 'q':
          // like 1
          return _this.num(dt.quarter);
        case 'qq':
          // like 01
          return _this.num(dt.quarter, 2);
        default:
          return maybeMacro(token);
      }
    };

    return stringifyTokens(Formatter.parseFormat(fmt), tokenToString);
  };

  Formatter.prototype.formatDurationFromString = function formatDurationFromString(dur, fmt) {
    var _this2 = this;

    var tokenToField = function tokenToField(token) {
      switch (token[0]) {
        case 'S':
          return 'millisecond';
        case 's':
          return 'second';
        case 'm':
          return 'minute';
        case 'h':
          return 'hour';
        case 'd':
          return 'day';
        case 'M':
          return 'month';
        case 'y':
          return 'year';
        default:
          return null;
      }
    },
        tokenToString = function tokenToString(lildur) {
      return function (token) {
        var mapped = tokenToField(token);
        if (mapped) {
          return _this2.num(lildur.get(mapped), token.length);
        } else {
          return token;
        }
      };
    },
        tokens = Formatter.parseFormat(fmt),
        realTokens = tokens.reduce(function (found, _ref2) {
      var literal = _ref2.literal,
          val = _ref2.val;
      return literal ? found : found.concat(val);
    }, []),
        collapsed = dur.shiftTo.apply(dur, realTokens.map(tokenToField).filter(function (t) {
      return t;
    }));
    return stringifyTokens(tokens, tokenToString(collapsed));
  };

  return Formatter;
}();

var sysLocaleCache = null;
function systemLocale() {
  if (sysLocaleCache) {
    return sysLocaleCache;
  } else if (hasIntl()) {
    var computedSys = new Intl.DateTimeFormat().resolvedOptions().locale;
    // node sometimes defaults to "und". Override that because that is dumb
    sysLocaleCache = computedSys === 'und' ? 'en-US' : computedSys;
    return sysLocaleCache;
  } else {
    sysLocaleCache = 'en-US';
    return sysLocaleCache;
  }
}

function intlConfigString(locale, numberingSystem, outputCalendar) {
  if (hasIntl()) {
    locale = Array.isArray(locale) ? locale : [locale];

    if (outputCalendar || numberingSystem) {
      locale = locale.map(function (l) {
        l += '-u';

        if (outputCalendar) {
          l += '-ca-' + outputCalendar;
        }

        if (numberingSystem) {
          l += '-nu-' + numberingSystem;
        }
        return l;
      });
    }
    return locale;
  } else {
    return [];
  }
}

function mapMonths(f) {
  var ms = [];
  for (var i = 1; i <= 12; i++) {
    var dt = DateTime.utc(2016, i, 1);
    ms.push(f(dt));
  }
  return ms;
}

function mapWeekdays(f) {
  var ms = [];
  for (var i = 1; i <= 7; i++) {
    var dt = DateTime.utc(2016, 11, 13 + i);
    ms.push(f(dt));
  }
  return ms;
}

function listStuff(loc, length, defaultOK, englishFn, intlFn) {
  var mode = loc.listingMode(defaultOK);

  if (mode === 'error') {
    return null;
  } else if (mode === 'en') {
    return englishFn(length);
  } else {
    return intlFn(length);
  }
}

function supportsFastNumbers(loc) {
  if (loc.numberingSystem && loc.numberingSystem !== 'latn') {
    return false;
  } else {
    return loc.numberingSystem === 'latn' || !loc.locale || loc.locale.startsWith('en') || hasIntl() && Intl.DateTimeFormat(loc.intl).resolvedOptions().numberingSystem === 'latn';
  }
}

/**
 * @private
 */

var SimpleNumberFormatter = function () {
  function SimpleNumberFormatter(opts) {
    classCallCheck(this, SimpleNumberFormatter);

    this.padTo = opts.padTo || 0;
    this.round = opts.round || false;
  }

  SimpleNumberFormatter.prototype.format = function format(i) {
    // to match the browser's numberformatter defaults
    var digits = this.round ? 0 : 3,
        rounded = roundTo(i, digits);
    return padStart(rounded, this.padTo);
  };

  return SimpleNumberFormatter;
}();

/**
 * @private
 */

var PolyDateFormatter = function () {
  function PolyDateFormatter(dt, intl, opts) {
    classCallCheck(this, PolyDateFormatter);

    this.opts = opts;
    this.hasIntl = hasIntl();

    var z = void 0;
    if (dt.zone.universal && this.hasIntl) {
      // Chromium doesn't support fixed-offset zones like Etc/GMT+8 in its formatter,
      // See https://bugs.chromium.org/p/chromium/issues/detail?id=364374.
      // So we have to make do. Two cases:
      // 1. The format options tell us to show the zone. We can't do that, so the best
      // we can do is format the date in UTC.
      // 2. The format options don't tell us to show the zone. Then we can adjust them
      // the time and tell the formatter to show it to us in UTC, so that the time is right
      // and the bad zone doesn't show up.
      // We can clean all this up when Chrome fixes this.
      z = 'UTC';
      if (opts.timeZoneName) {
        this.dt = dt;
      } else {
        this.dt = dt.offset === 0 ? dt : DateTime.fromMillis(dt.ts + dt.offset * 60 * 1000);
      }
    } else if (dt.zone.type === 'local') {
      this.dt = dt;
    } else {
      this.dt = dt;
      z = dt.zone.name;
    }

    if (this.hasIntl) {
      var realIntlOpts = Object.assign({}, this.opts);
      if (z) {
        realIntlOpts.timeZone = z;
      }
      this.dtf = new Intl.DateTimeFormat(intl, realIntlOpts);
    }
  }

  PolyDateFormatter.prototype.format = function format() {
    if (this.hasIntl) {
      return this.dtf.format(this.dt.toJSDate());
    } else {
      var tokenFormat = formatString(this.opts),
          loc = Locale.create('en-US');
      return Formatter.create(loc).formatDateTimeFromString(this.dt, tokenFormat);
    }
  };

  PolyDateFormatter.prototype.formatToParts = function formatToParts() {
    if (this.hasIntl && hasFormatToParts()) {
      return this.dtf.formatToParts(this.dt.toJSDate());
    } else {
      // This is kind of a cop out. We actually could do this for English. However, we couldn't do it for intl strings
      // and IMO it's too weird to have an uncanny valley like that
      return [];
    }
  };

  PolyDateFormatter.prototype.resolvedOptions = function resolvedOptions() {
    if (this.hasIntl) {
      return this.dtf.resolvedOptions();
    } else {
      return {
        locale: 'en-US',
        numberingSystem: 'latn',
        outputCalendar: 'gregory'
      };
    }
  };

  return PolyDateFormatter;
}();

/**
 * @private
 */

var Locale = function () {
  Locale.fromOpts = function fromOpts(opts) {
    return Locale.create(opts.locale, opts.numberingSystem, opts.outputCalendar, opts.defaultToEN);
  };

  Locale.create = function create(locale, numberingSystem, outputCalendar) {
    var defaultToEN = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var specifiedLocale = locale || Settings.defaultLocale,

    // the system locale is useful for human readable strings but annoying for parsing/formatting known formats
    localeR = specifiedLocale || (defaultToEN ? 'en-US' : systemLocale()),
        numberingSystemR = numberingSystem || Settings.defaultNumberingSystem,
        outputCalendarR = outputCalendar || Settings.defaultOutputCalendar;
    return new Locale(localeR, numberingSystemR, outputCalendarR, specifiedLocale);
  };

  Locale.resetCache = function resetCache() {
    sysLocaleCache = null;
  };

  Locale.fromObject = function fromObject() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        locale = _ref.locale,
        numberingSystem = _ref.numberingSystem,
        outputCalendar = _ref.outputCalendar;

    return Locale.create(locale, numberingSystem, outputCalendar);
  };

  function Locale(locale, numbering, outputCalendar, specifiedLocale) {
    classCallCheck(this, Locale);

    this.locale = locale;
    this.numberingSystem = numbering;
    this.outputCalendar = outputCalendar;
    this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);

    this.weekdaysCache = { format: {}, standalone: {} };
    this.monthsCache = { format: {}, standalone: {} };
    this.meridiemCache = null;
    this.eraCache = {};

    this.specifiedLocale = specifiedLocale;
    this.fastNumbers = supportsFastNumbers(this);
  }

  // todo: cache me


  Locale.prototype.listingMode = function listingMode() {
    var defaultOk = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    var intl = hasIntl(),
        hasFTP = intl && hasFormatToParts(),
        isActuallyEn = this.locale === 'en' || this.locale.toLowerCase() === 'en-us' || intl && Intl.DateTimeFormat(this.intl).resolvedOptions().locale.startsWith('en-us'),
        hasNoWeirdness = (this.numberingSystem === null || this.numberingSystem === 'latn') && (this.outputCalendar === null || this.outputCalendar === 'gregory');

    if (!hasFTP && !(isActuallyEn && hasNoWeirdness) && !defaultOk) {
      return 'error';
    } else if (!hasFTP || isActuallyEn && hasNoWeirdness) {
      return 'en';
    } else {
      return 'intl';
    }
  };

  Locale.prototype.clone = function clone(alts) {
    if (!alts || Object.getOwnPropertyNames(alts).length === 0) {
      return this;
    } else {
      return Locale.create(alts.locale || this.specifiedLocale, alts.numberingSystem || this.numberingSystem, alts.outputCalendar || this.outputCalendar, alts.defaultToEN || false);
    }
  };

  Locale.prototype.redefaultToEN = function redefaultToEN() {
    var alts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this.clone(Object.assign({}, alts, { defaultToEN: true }));
  };

  Locale.prototype.redefaultToSystem = function redefaultToSystem() {
    var alts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this.clone(Object.assign({}, alts, { defaultToEN: false }));
  };

  Locale.prototype.months = function months$$1(length) {
    var _this = this;

    var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var defaultOK = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    return listStuff(this, length, defaultOK, months, function () {
      var intl = format ? { month: length, day: 'numeric' } : { month: length },
          formatStr = format ? 'format' : 'standalone';
      if (!_this.monthsCache[formatStr][length]) {
        _this.monthsCache[formatStr][length] = mapMonths(function (dt) {
          return _this.extract(dt, intl, 'month');
        });
      }
      return _this.monthsCache[formatStr][length];
    });
  };

  Locale.prototype.weekdays = function weekdays$$1(length) {
    var _this2 = this;

    var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var defaultOK = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    return listStuff(this, length, defaultOK, weekdays, function () {
      var intl = format ? { weekday: length, year: 'numeric', month: 'long', day: 'numeric' } : { weekday: length },
          formatStr = format ? 'format' : 'standalone';
      if (!_this2.weekdaysCache[formatStr][length]) {
        _this2.weekdaysCache[formatStr][length] = mapWeekdays(function (dt) {
          return _this2.extract(dt, intl, 'weekday');
        });
      }
      return _this2.weekdaysCache[formatStr][length];
    });
  };

  Locale.prototype.meridiems = function meridiems$$1() {
    var _this3 = this;

    var defaultOK = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    return listStuff(this, undefined, defaultOK, function () {
      return meridiems;
    }, function () {
      // In theory there could be aribitrary day periods. We're gonna assume there are exactly two
      // for AM and PM. This is probably wrong, but it's makes parsing way easier.
      if (!_this3.meridiemCache) {
        var intl = { hour: 'numeric', hour12: true };
        _this3.meridiemCache = [DateTime.utc(2016, 11, 13, 9), DateTime.utc(2016, 11, 13, 19)].map(function (dt) {
          return _this3.extract(dt, intl, 'dayperiod');
        });
      }

      return _this3.meridiemCache;
    });
  };

  Locale.prototype.eras = function eras$$1(length) {
    var _this4 = this;

    var defaultOK = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    return listStuff(this, length, defaultOK, eras, function () {
      var intl = { era: length };

      // This is utter bullshit. Different calendars are going to define eras totally differently. What I need is the minimum set of dates
      // to definitely enumerate them.
      if (!_this4.eraCache[length]) {
        _this4.eraCache[length] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map(function (dt) {
          return _this4.extract(dt, intl, 'era');
        });
      }

      return _this4.eraCache[length];
    });
  };

  Locale.prototype.extract = function extract(dt, intlOpts, field) {
    var df = this.dtFormatter(dt, intlOpts),
        results = df.formatToParts(),
        matching = results.find(function (m) {
      return m.type.toLowerCase() === field;
    });

    return matching ? matching.value : null;
  };

  Locale.prototype.numberFormatter = function numberFormatter() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // this option is never used (the only caller short-circuits on it, but it seems safer to leave)
    // (in contrast, the || is used heavily)
    if (opts.forceSimple || this.fastNumbers) {
      return new SimpleNumberFormatter(opts);
    } else if (hasIntl()) {
      var intlOpts = { useGrouping: false };

      if (opts.padTo > 0) {
        intlOpts.minimumIntegerDigits = opts.padTo;
      }

      if (opts.round) {
        intlOpts.maximumFractionDigits = 0;
      }

      return new Intl.NumberFormat(this.intl, intlOpts);
    } else {
      return new SimpleNumberFormatter(opts);
    }
  };

  Locale.prototype.dtFormatter = function dtFormatter(dt) {
    var intlOpts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return new PolyDateFormatter(dt, this.intl, intlOpts);
  };

  Locale.prototype.equals = function equals(other) {
    return this.locale === other.locale && this.numberingSystem === other.numberingSystem && this.outputCalendar === other.outputCalendar;
  };

  return Locale;
}();

/*
 * This file handles parsing for well-specified formats. Here's how it works:
 * Two things go into parsing: a regex to match with and an extractor to take apart the groups in the match.
 * An extractor is just a function that takes a regex match array and returns a { year: ..., month: ... } object
 * parse() does the work of executing the regex and applying the extractor. It takes multiple regex/extractor pairs to try in sequence.
 * Extractors can take a "cursor" representing the offset in the match to look at. This makes it easy to combine extractors.
 * combineExtractors() does the work of combining them, keeping track of the cursor through multiple extractions.
 * Some extractions are super dumb and simpleParse and fromStrings help DRY them.
 */

function combineRegexes() {
  for (var _len = arguments.length, regexes = Array(_len), _key = 0; _key < _len; _key++) {
    regexes[_key] = arguments[_key];
  }

  var full = regexes.reduce(function (f, r) {
    return f + r.source;
  }, '');
  return RegExp('^' + full + '$');
}

function combineExtractors() {
  for (var _len2 = arguments.length, extractors = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    extractors[_key2] = arguments[_key2];
  }

  return function (m) {
    return extractors.reduce(function (_ref, ex) {
      var mergedVals = _ref[0],
          mergedZone = _ref[1],
          cursor = _ref[2];

      var _ex = ex(m, cursor),
          val = _ex[0],
          zone = _ex[1],
          next = _ex[2];

      return [Object.assign(mergedVals, val), mergedZone || zone, next];
    }, [{}, null, 1]).slice(0, 2);
  };
}

function parse(s) {
  if (s == null) {
    return [null, null];
  }

  for (var _len3 = arguments.length, patterns = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    patterns[_key3 - 1] = arguments[_key3];
  }

  for (var _iterator = patterns, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref3;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref3 = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref3 = _i.value;
    }

    var _ref2 = _ref3;
    var regex = _ref2[0];
    var extractor = _ref2[1];

    var m = regex.exec(s);
    if (m) {
      return extractor(m);
    }
  }
  return [null, null];
}

function simpleParse() {
  for (var _len4 = arguments.length, keys = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    keys[_key4] = arguments[_key4];
  }

  return function (match, cursor) {
    var ret = {};
    var i = void 0;

    for (i = 0; i < keys.length; i++) {
      ret[keys[i]] = parseInt(match[cursor + i]);
    }
    return [ret, null, cursor + i];
  };
}

// ISO and SQL parsing
var offsetRegex = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/,
    isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,9}))?)?)?/,
    isoTimeRegex = RegExp('' + isoTimeBaseRegex.source + offsetRegex.source + '?'),
    isoTimeExtensionRegex = RegExp('(?:T' + isoTimeRegex.source + ')?'),
    isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/,
    isoWeekRegex = /(\d{4})-?W(\d\d)-?(\d)/,
    isoOrdinalRegex = /(\d{4})-?(\d{3})/,
    extractISOWeekData = simpleParse('weekYear', 'weekNumber', 'weekDay'),
    extractISOOrdinalData = simpleParse('year', 'ordinal'),
    sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/,
    // dumbed-down version of the ISO one
sqlTimeRegex = RegExp(isoTimeBaseRegex.source + ' ?(?:' + offsetRegex.source + '|([a-zA-Z_]{1,256}/[a-zA-Z_]{1,256}))?'),
    sqlTimeExtensionRegex = RegExp('(?: ' + sqlTimeRegex.source + ')?');

function extractISOYmd(match, cursor) {
  var item = {
    year: parseInt(match[cursor]),
    month: parseInt(match[cursor + 1]) || 1,
    day: parseInt(match[cursor + 2]) || 1
  };

  return [item, null, cursor + 3];
}

function extractISOTime(match, cursor) {
  var item = {
    hour: parseInt(match[cursor]) || 0,
    minute: parseInt(match[cursor + 1]) || 0,
    second: parseInt(match[cursor + 2]) || 0,
    millisecond: parseMillis(match[cursor + 3])
  };

  return [item, null, cursor + 4];
}

function extractISOOffset(match, cursor) {
  var local = !match[cursor] && !match[cursor + 1],
      fullOffset = signedOffset(match[cursor + 1], match[cursor + 2]),
      zone = local ? null : FixedOffsetZone.instance(fullOffset);
  return [{}, zone, cursor + 3];
}

function extractIANAZone(match, cursor) {
  var zone = match[cursor] ? new IANAZone(match[cursor]) : null;
  return [{}, zone, cursor + 1];
}

// ISO duration parsing

var isoDuration = /^P(?:(?:(\d{1,9})Y)?(?:(\d{1,9})M)?(?:(\d{1,9})D)?(?:T(?:(\d{1,9})H)?(?:(\d{1,9})M)?(?:(\d{1,9})(?:[.,](\d{1,9}))?S)?)?|(\d{1,9})W)$/;

function extractISODuration(match) {
  var yearStr = match[1],
      monthStr = match[2],
      dayStr = match[3],
      hourStr = match[4],
      minuteStr = match[5],
      secondStr = match[6],
      millisecondsStr = match[7],
      weekStr = match[8];


  return [{
    years: parseInt(yearStr),
    months: parseInt(monthStr),
    weeks: parseInt(weekStr),
    days: parseInt(dayStr),
    hours: parseInt(hourStr),
    minutes: parseInt(minuteStr),
    seconds: parseInt(secondStr),
    milliseconds: parseMillis(millisecondsStr)
  }];
}

// These are a little braindead. EDT *should* tell us that we're in, say, America/New_York
// and not just that we're in -240 *right now*. But since I don't think these are used that often
// I'm just going to ignore that
var obsOffsets = {
  GMT: 0,
  EDT: -4 * 60,
  EST: -5 * 60,
  CDT: -5 * 60,
  CST: -6 * 60,
  MDT: -6 * 60,
  MST: -7 * 60,
  PDT: -7 * 60,
  PST: -8 * 60
};

function fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
  var result = {
    year: yearStr.length === 2 ? untruncateYear(parseInt(yearStr)) : parseInt(yearStr),
    month: monthStr.length === 2 ? parseInt(monthStr, 10) : monthsShort.indexOf(monthStr) + 1,
    day: parseInt(dayStr),
    hour: parseInt(hourStr),
    minute: parseInt(minuteStr)
  };

  if (secondStr) result.second = parseInt(secondStr);
  if (weekdayStr) {
    result.weekday = weekdayStr.length > 3 ? weekdaysLong.indexOf(weekdayStr) + 1 : weekdaysShort.indexOf(weekdayStr) + 1;
  }

  return result;
}

// RFC 2822/5322
var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;

function extractRFC2822(match) {
  var weekdayStr = match[1],
      dayStr = match[2],
      monthStr = match[3],
      yearStr = match[4],
      hourStr = match[5],
      minuteStr = match[6],
      secondStr = match[7],
      obsOffset = match[8],
      milOffset = match[9],
      offHourStr = match[10],
      offMinuteStr = match[11],
      result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);


  var offset = void 0;
  if (obsOffset) {
    offset = obsOffsets[obsOffset];
  } else if (milOffset) {
    offset = 0;
  } else {
    offset = signedOffset(offHourStr, offMinuteStr);
  }

  return [result, new FixedOffsetZone(offset)];
}

function preprocessRFC2822(s) {
  // Remove comments and folding whitespace and replace multiple-spaces with a single space
  return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').trim();
}

// http date

var rfc1123 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/,
    rfc850 = /^(Monday|Tuesday|Wedsday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/,
    ascii = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;

function extractRFC1123Or850(match) {
  var weekdayStr = match[1],
      dayStr = match[2],
      monthStr = match[3],
      yearStr = match[4],
      hourStr = match[5],
      minuteStr = match[6],
      secondStr = match[7],
      result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);

  return [result, FixedOffsetZone.utcInstance];
}

function extractASCII(match) {
  var weekdayStr = match[1],
      monthStr = match[2],
      dayStr = match[3],
      hourStr = match[4],
      minuteStr = match[5],
      secondStr = match[6],
      yearStr = match[7],
      result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);

  return [result, FixedOffsetZone.utcInstance];
}

/**
 * @private
 */

function parseISODate(s) {
  return parse(s, [combineRegexes(isoYmdRegex, isoTimeExtensionRegex), combineExtractors(extractISOYmd, extractISOTime, extractISOOffset)], [combineRegexes(isoWeekRegex, isoTimeExtensionRegex), combineExtractors(extractISOWeekData, extractISOTime, extractISOOffset)], [combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex), combineExtractors(extractISOOrdinalData, extractISOTime)], [combineRegexes(isoTimeRegex), combineExtractors(extractISOTime, extractISOOffset)]);
}

function parseRFC2822Date(s) {
  return parse(preprocessRFC2822(s), [rfc2822, extractRFC2822]);
}

function parseHTTPDate(s) {
  return parse(s, [rfc1123, extractRFC1123Or850], [rfc850, extractRFC1123Or850], [ascii, extractASCII]);
}

function parseISODuration(s) {
  return parse(s, [isoDuration, extractISODuration]);
}

function parseSQL(s) {
  return parse(s, [combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex), combineExtractors(extractISOYmd, extractISOTime, extractISOOffset, extractIANAZone)], [combineRegexes(sqlTimeRegex), combineExtractors(extractISOTime, extractISOOffset, extractIANAZone)]);
}

var INVALID = 'Invalid Duration',
    UNPARSABLE = 'unparsable';

// unit conversion constants
var lowOrderMatrix = {
  weeks: {
    days: 7,
    hours: 7 * 24,
    minutes: 7 * 24 * 60,
    seconds: 7 * 24 * 60 * 60,
    milliseconds: 7 * 24 * 60 * 60 * 1000
  },
  days: {
    hours: 24,
    minutes: 24 * 60,
    seconds: 24 * 60 * 60,
    milliseconds: 24 * 60 * 60 * 1000
  },
  hours: { minutes: 60, seconds: 60 * 60, milliseconds: 60 * 60 * 1000 },
  minutes: { seconds: 60, milliseconds: 60 * 1000 },
  seconds: { milliseconds: 1000 }
},
    casualMatrix = Object.assign({
  years: {
    months: 12,
    weeks: 52,
    days: 365,
    hours: 365 * 24,
    minutes: 365 * 24 * 60,
    seconds: 365 * 24 * 60 * 60,
    milliseconds: 365 * 24 * 60 * 60 * 1000
  },
  quarters: {
    months: 3,
    weeks: 13,
    days: 91,
    hours: 91 * 24,
    minutes: 91 * 24 * 60,
    milliseconds: 91 * 24 * 60 * 60 * 1000
  },
  months: {
    weeks: 4,
    days: 30,
    hours: 30 * 24,
    minutes: 30 * 24 * 60,
    seconds: 30 * 24 * 60 * 60,
    milliseconds: 30 * 24 * 60 * 60 * 1000
  }
}, lowOrderMatrix),
    daysInYearAccurate = 146097.0 / 400,
    daysInMonthAccurate = 146097.0 / 4800,
    accurateMatrix = Object.assign({
  years: {
    months: 12,
    weeks: daysInYearAccurate / 7,
    days: daysInYearAccurate,
    hours: daysInYearAccurate * 24,
    minutes: daysInYearAccurate * 24 * 60,
    seconds: daysInYearAccurate * 24 * 60 * 60,
    milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1000
  },
  quarters: {
    months: 3,
    weeks: daysInYearAccurate / 28,
    days: daysInYearAccurate / 4,
    hours: daysInYearAccurate * 24 / 4,
    minutes: daysInYearAccurate * 24 * 60 / 4,
    seconds: daysInYearAccurate * 24 * 60 * 60 / 4,
    milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1000 / 4
  },
  months: {
    weeks: daysInMonthAccurate / 7,
    days: daysInMonthAccurate,
    hours: daysInYearAccurate * 24,
    minutes: daysInYearAccurate * 24 * 60,
    seconds: daysInYearAccurate * 24 * 60 * 60,
    milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1000
  }
}, lowOrderMatrix);

// units ordered by size
var orderedUnits = ['years', 'quarters', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'];

var reverseUnits = orderedUnits.slice(0).reverse();

// clone really means "create another instance just like this one, but with these changes"
function clone(dur, alts) {
  var clear = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  // deep merge for vals
  var conf = {
    values: clear ? alts.values : Object.assign({}, dur.values, alts.values || {}),
    loc: dur.loc.clone(alts.loc),
    conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy
  };
  return new Duration(conf);
}

// some functions really care about the absolute value of a duration, so combined with
// normalize() this tells us whether this duration is positive or negative
function isHighOrderNegative(obj) {
  // only rule is that the highest-order part must be non-negative
  for (var _iterator = orderedUnits, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var k = _ref;

    if (obj[k]) return obj[k] < 0;
  }
  return false;
}

// NB: mutates parameters
function convert(matrix, fromMap, fromUnit, toMap, toUnit) {
  var conv = matrix[toUnit][fromUnit],
      added = Math.floor(fromMap[fromUnit] / conv);
  toMap[toUnit] += added;
  fromMap[fromUnit] -= added * conv;
}

// NB: mutates parameters
function normalizeValues(matrix, vals) {
  reverseUnits.reduce(function (previous, current) {
    if (!isUndefined(vals[current])) {
      if (previous) {
        convert(matrix, vals, previous, vals, current);
      }
      return current;
    } else {
      return previous;
    }
  }, null);
}

/**
 * @private
 */
function friendlyDuration(duration) {
  if (isNumber(duration)) {
    return Duration.fromMillis(duration);
  } else if (duration instanceof Duration) {
    return duration;
  } else if (duration instanceof Object) {
    return Duration.fromObject(duration);
  } else {
    throw new InvalidArgumentError('Unknown duration argument');
  }
}

/**
 * A Duration object represents a period of time, like "2 months" or "1 day, 1 hour". Conceptually, it's just a map of units to their quantities, accompanied by some additional configuration and methods for creating, parsing, interrogating, transforming, and formatting them. They can be used on their own or in conjunction with other Luxon types; for example, you can use {@link DateTime.plus} to add a Duration object to a DateTime, producing another DateTime.
 *
 * Here is a brief overview of commonly used methods and getters in Duration:
 *
 * * **Creation** To create a Duration, use {@link Duration.fromMillis}, {@link Duration.fromObject}, or {@link Duration.fromISO}.
 * * **Unit values** See the {@link years}, {@link months}, {@link weeks}, {@link days}, {@link hours}, {@link minutes}, {@link seconds}, {@link milliseconds} accessors.
 * * **Configuration** See  {@link locale} and {@link numberingSystem} accessors.
 * * **Transformation** To create new Durations out of old ones use {@link plus}, {@link minus}, {@link normalize}, {@link set}, {@link reconfigure}, {@link shiftTo}, and {@link negate}.
 * * **Output** To convert the Duration into other representations, see {@link as}, {@link toISO}, {@link toFormat}, and {@link toJSON}
 *
 * There's are more methods documented below. In addition, for more information on subtler topics like internationalization and validity, see the external documentation.
 */

var Duration = function () {
  /**
   * @private
   */
  function Duration(config) {
    classCallCheck(this, Duration);

    var accurate = config.conversionAccuracy === 'longterm' || false;
    /**
     * @access private
     */
    this.values = config.values;
    /**
     * @access private
     */
    this.loc = config.loc || Locale.create();
    /**
     * @access private
     */
    this.conversionAccuracy = accurate ? 'longterm' : 'casual';
    /**
     * @access private
     */
    this.invalid = config.invalidReason || null;
    /**
     * @access private
     */
    this.matrix = accurate ? accurateMatrix : casualMatrix;
  }

  /**
   * Create Duration from a number of milliseconds.
   * @param {number} count of milliseconds
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */


  Duration.fromMillis = function fromMillis(count, opts) {
    return Duration.fromObject(Object.assign({ milliseconds: count }, opts));
  };

  /**
   * Create an Duration from a Javascript object with keys like 'years' and 'hours'.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.years
   * @param {number} obj.quarters
   * @param {number} obj.months
   * @param {number} obj.weeks
   * @param {number} obj.days
   * @param {number} obj.hours
   * @param {number} obj.minutes
   * @param {number} obj.seconds
   * @param {number} obj.milliseconds
   * @param {string} [obj.locale='en-US'] - the locale to use
   * @param {string} obj.numberingSystem - the numbering system to use
   * @param {string} [obj.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */


  Duration.fromObject = function fromObject(obj) {
    return new Duration({
      values: normalizeObject(obj, Duration.normalizeUnit, true),
      loc: Locale.fromObject(obj),
      conversionAccuracy: obj.conversionAccuracy
    });
  };

  /**
   * Create a Duration from an ISO 8601 duration string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromISO('P3Y6M4DT12H30M5S').toObject() //=> { years: 3, months: 6, day: 4, hours: 12, minutes: 30, seconds: 5 }
   * @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
   * @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
   * @return {Duration}
   */


  Duration.fromISO = function fromISO(text, opts) {
    var _parseISODuration = parseISODuration(text),
        parsed = _parseISODuration[0];

    if (parsed) {
      var obj = Object.assign(parsed, opts);
      return Duration.fromObject(obj);
    } else {
      return Duration.invalid(UNPARSABLE);
    }
  };

  /**
   * Create an invalid Duration.
   * @param {string} reason - reason this is invalid
   * @return {Duration}
   */


  Duration.invalid = function invalid(reason) {
    if (!reason) {
      throw new InvalidArgumentError('need to specify a reason the Duration is invalid');
    }
    if (Settings.throwOnInvalid) {
      throw new InvalidDurationError(reason);
    } else {
      return new Duration({ invalidReason: reason });
    }
  };

  /**
   * @private
   */


  Duration.normalizeUnit = function normalizeUnit(unit) {
    var ignoreUnknown = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var normalized = {
      year: 'years',
      years: 'years',
      quarter: 'quarters',
      quarters: 'quarters',
      month: 'months',
      months: 'months',
      week: 'weeks',
      weeks: 'weeks',
      day: 'days',
      days: 'days',
      hour: 'hours',
      hours: 'hours',
      minute: 'minutes',
      minutes: 'minutes',
      second: 'seconds',
      seconds: 'seconds',
      millisecond: 'milliseconds',
      milliseconds: 'milliseconds'
    }[unit ? unit.toLowerCase() : unit];

    if (!ignoreUnknown && !normalized) throw new InvalidUnitError(unit);

    return normalized;
  };

  /**
   * Get  the locale of a Duration, such 'en-GB'
   * @type {string}
   */


  /**
   * Returns a string representation of this Duration formatted according to the specified format string.
   * @param {string} fmt - the format string
   * @param {Object} opts - options
   * @param {boolean} opts.round - round numerical values
   * @return {string}
   */
  Duration.prototype.toFormat = function toFormat(fmt) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return this.isValid ? Formatter.create(this.loc, opts).formatDurationFromString(this, fmt) : INVALID;
  };

  /**
   * Returns a Javascript object with this Duration's values.
   * @param opts - options for generating the object
   * @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
   * @return {Object}
   */


  Duration.prototype.toObject = function toObject() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!this.isValid) return {};

    var base = Object.assign({}, this.values);

    if (opts.includeConfig) {
      base.conversionAccuracy = this.conversionAccuracy;
      base.numberingSystem = this.loc.numberingSystem;
      base.locale = this.loc.locale;
    }
    return base;
  };

  /**
   * Returns an ISO 8601-compliant string representation of this Duration.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromObject({ years: 3, seconds: 45 }).toISO() //=> 'P3YT45S'
   * @example Duration.fromObject({ months: 4, seconds: 45 }).toISO() //=> 'P4MT45S'
   * @example Duration.fromObject({ months: 5 }).toISO() //=> 'P5M'
   * @example Duration.fromObject({ minutes: 5 }).toISO() //=> 'PT5M'
   * @return {string}
   */


  Duration.prototype.toISO = function toISO() {
    // we could use the formatter, but this is an easier way to get the minimum string
    if (!this.isValid) return null;

    var s = 'P',
        norm = this.normalize();

    // ISO durations are always positive, so take the absolute value
    norm = isHighOrderNegative(norm.values) ? norm.negate() : norm;

    if (norm.years > 0) s += norm.years + 'Y';
    if (norm.months > 0 || norm.quarters > 0) s += norm.months + norm.quarters * 3 + 'M';
    if (norm.days > 0 || norm.weeks > 0) s += norm.days + norm.weeks * 7 + 'D';
    if (norm.hours > 0 || norm.minutes > 0 || norm.seconds > 0 || norm.milliseconds > 0) s += 'T';
    if (norm.hours > 0) s += norm.hours + 'H';
    if (norm.minutes > 0) s += norm.minutes + 'M';
    if (norm.seconds > 0) s += norm.seconds + 'S';
    return s;
  };

  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
   * @return {string}
   */


  Duration.prototype.toJSON = function toJSON() {
    return this.toISO();
  };

  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
   * @return {string}
   */


  Duration.prototype.toString = function toString() {
    return this.toISO();
  };

  /**
   * Returns a string representation of this Duration appropriate for the REPL.
   * @return {string}
   */


  Duration.prototype.inspect = function inspect() {
    if (this.isValid) {
      var valsInspect = JSON.stringify(this.toObject());
      return 'Duration {\n  values: ' + valsInspect + ',\n  locale: ' + this.locale + ',\n  conversionAccuracy: ' + this.conversionAccuracy + ' }';
    } else {
      return 'Duration { Invalid, reason: ' + this.invalidReason + ' }';
    }
  };

  /**
   * Make this Duration longer by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */


  Duration.prototype.plus = function plus(duration) {
    if (!this.isValid) return this;

    var dur = friendlyDuration(duration),
        result = {};

    for (var _iterator2 = orderedUnits, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var k = _ref2;

      var val = dur.get(k) + this.get(k);
      if (val !== 0) {
        result[k] = val;
      }
    }

    return clone(this, { values: result }, true);
  };

  /**
   * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */


  Duration.prototype.minus = function minus(duration) {
    if (!this.isValid) return this;

    var dur = friendlyDuration(duration);
    return this.plus(dur.negate());
  };

  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example Duration.fromObject({years: 2, days: 3}).years //=> 2
   * @example Duration.fromObject({years: 2, days: 3}).months //=> 0
   * @example Duration.fromObject({years: 2, days: 3}).days //=> 3
   * @return {number}
   */


  Duration.prototype.get = function get$$1(unit) {
    return this[Duration.normalizeUnit(unit)];
  };

  /**
   * "Set" the values of specified units. Return a newly-constructed Duration.
   * @param {Object} values - a mapping of units to numbers
   * @example dur.set({ years: 2017 })
   * @example dur.set({ hours: 8, minutes: 30 })
   * @return {Duration}
   */


  Duration.prototype.set = function set$$1(values) {
    var mixed = Object.assign(this.values, normalizeObject(values, Duration.normalizeUnit));
    return clone(this, { values: mixed });
  };

  /**
   * "Set" the locale and/or numberingSystem.  Returns a newly-constructed Duration.
   * @example dur.reconfigure({ locale: 'en-GB' })
   * @return {Duration}
   */


  Duration.prototype.reconfigure = function reconfigure() {
    var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        locale = _ref3.locale,
        numberingSystem = _ref3.numberingSystem,
        conversionAccuracy = _ref3.conversionAccuracy;

    var loc = this.loc.clone({ locale: locale, numberingSystem: numberingSystem }),
        opts = { loc: loc };

    if (conversionAccuracy) {
      opts.conversionAccuracy = conversionAccuracy;
    }

    return clone(this, opts);
  };

  /**
   * Return the length of the duration in the specified unit.
   * @param {string} unit - a unit such as 'minutes' or 'days'
   * @example Duration.fromObject({years: 1}).as('days') //=> 365
   * @example Duration.fromObject({years: 1}).as('months') //=> 12
   * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
   * @return {number}
   */


  Duration.prototype.as = function as(unit) {
    return this.isValid ? this.shiftTo(unit).get(unit) : NaN;
  };

  /**
   * Reduce this Duration to its canonical representation in its current units.
   * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
   * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
   * @return {Duration}
   */


  Duration.prototype.normalize = function normalize() {
    if (!this.isValid) return this;

    var neg = isHighOrderNegative(this.values),
        vals = (neg ? this.negate() : this).toObject();
    normalizeValues(this.matrix, vals);
    var dur = Duration.fromObject(vals);
    return neg ? dur.negate() : dur;
  };

  /**
   * Convert this Duration into its representation in a different set of units.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
   * @return {Duration}
   */


  Duration.prototype.shiftTo = function shiftTo() {
    for (var _len = arguments.length, units = Array(_len), _key = 0; _key < _len; _key++) {
      units[_key] = arguments[_key];
    }

    if (!this.isValid) return this;

    if (units.length === 0) {
      return this;
    }

    units = units.map(function (u) {
      return Duration.normalizeUnit(u);
    });

    var built = {},
        accumulated = {},
        vals = this.toObject();
    var lastUnit = void 0;

    normalizeValues(this.matrix, vals);

    for (var _iterator3 = orderedUnits, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref4;

      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        _ref4 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        _ref4 = _i3.value;
      }

      var k = _ref4;

      if (units.indexOf(k) >= 0) {
        lastUnit = k;

        var own = 0;

        // anything we haven't boiled down yet should get boiled to this unit
        for (var ak in accumulated) {
          if (accumulated.hasOwnProperty(ak)) {
            own += this.matrix[ak][k] * accumulated[ak];
            accumulated[ak] = 0;
          }
        }

        // plus anything that's already in this unit
        if (isNumber(vals[k])) {
          own += vals[k];
        }

        var i = Math.trunc(own);
        built[k] = i;
        accumulated[k] = own - i;

        // plus anything further down the chain that should be rolled up in to this
        for (var down in vals) {
          if (orderedUnits.indexOf(down) > orderedUnits.indexOf(k)) {
            convert(this.matrix, vals, down, built, k);
          }
        }
        // otherwise, keep it in the wings to boil it later
      } else if (isNumber(vals[k])) {
        accumulated[k] = vals[k];
      }
    }

    // anything leftover becomes the decimal for the last unit
    if (lastUnit) {
      for (var key in accumulated) {
        if (accumulated.hasOwnProperty(key)) {
          if (accumulated[key] > 0) {
            built[lastUnit] += key === lastUnit ? accumulated[key] : accumulated[key] / this.matrix[lastUnit][key];
          }
        }
      }
    }
    return clone(this, { values: built }, true);
  };

  /**
   * Return the negative of this Duration.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
   * @return {Duration}
   */


  Duration.prototype.negate = function negate() {
    if (!this.isValid) return this;
    var negated = {};
    for (var _iterator4 = Object.keys(this.values), _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
      var _ref5;

      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        _ref5 = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        _ref5 = _i4.value;
      }

      var k = _ref5;

      negated[k] = -this.values[k];
    }
    return clone(this, { values: negated }, true);
  };

  /**
   * Get the years.
   * @type {number}
   */


  /**
   * Equality check
   * Two Durations are equal iff they have the same units and the same values for each unit.
   * @param {Duration} other
   * @return {boolean}
   */
  Duration.prototype.equals = function equals(other) {
    if (!this.isValid || !other.isValid) {
      return false;
    }

    if (!this.loc.equals(other.loc)) {
      return false;
    }

    for (var _iterator5 = orderedUnits, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
      var _ref6;

      if (_isArray5) {
        if (_i5 >= _iterator5.length) break;
        _ref6 = _iterator5[_i5++];
      } else {
        _i5 = _iterator5.next();
        if (_i5.done) break;
        _ref6 = _i5.value;
      }

      var u = _ref6;

      if (this.values[u] !== other.values[u]) {
        return false;
      }
    }
    return true;
  };

  createClass(Duration, [{
    key: 'locale',
    get: function get$$1() {
      return this.isValid ? this.loc.locale : null;
    }

    /**
     * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
     *
     * @type {string}
     */

  }, {
    key: 'numberingSystem',
    get: function get$$1() {
      return this.isValid ? this.loc.numberingSystem : null;
    }
  }, {
    key: 'years',
    get: function get$$1() {
      return this.isValid ? this.values.years || 0 : NaN;
    }

    /**
     * Get the quarters.
     * @type {number}
     */

  }, {
    key: 'quarters',
    get: function get$$1() {
      return this.isValid ? this.values.quarters || 0 : NaN;
    }

    /**
     * Get the months.
     * @type {number}
     */

  }, {
    key: 'months',
    get: function get$$1() {
      return this.isValid ? this.values.months || 0 : NaN;
    }

    /**
     * Get the weeks
     * @type {number}
     */

  }, {
    key: 'weeks',
    get: function get$$1() {
      return this.isValid ? this.values.weeks || 0 : NaN;
    }

    /**
     * Get the days.
     * @type {number}
     */

  }, {
    key: 'days',
    get: function get$$1() {
      return this.isValid ? this.values.days || 0 : NaN;
    }

    /**
     * Get the hours.
     * @type {number}
     */

  }, {
    key: 'hours',
    get: function get$$1() {
      return this.isValid ? this.values.hours || 0 : NaN;
    }

    /**
     * Get the minutes.
     * @type {number}
     */

  }, {
    key: 'minutes',
    get: function get$$1() {
      return this.isValid ? this.values.minutes || 0 : NaN;
    }

    /**
     * Get the seconds.
     * @return {number}
     */

  }, {
    key: 'seconds',
    get: function get$$1() {
      return this.isValid ? this.values.seconds || 0 : NaN;
    }

    /**
     * Get the milliseconds.
     * @return {number}
     */

  }, {
    key: 'milliseconds',
    get: function get$$1() {
      return this.isValid ? this.values.milliseconds || 0 : NaN;
    }

    /**
     * Returns whether the Duration is invalid. Invalid durations are returned by diff operations
     * on invalid DateTimes or Intervals.
     * @return {boolean}
     */

  }, {
    key: 'isValid',
    get: function get$$1() {
      return this.invalidReason === null;
    }

    /**
     * Returns an explanation of why this Duration became invalid, or null if the Duration is valid
     * @return {string}
     */

  }, {
    key: 'invalidReason',
    get: function get$$1() {
      return this.invalid;
    }
  }]);
  return Duration;
}();

var INVALID$1 = 'Invalid Interval';

// checks if the start is equal to or before the end
function validateStartEnd(start, end) {
  return !!start && !!end && start.isValid && end.isValid && start <= end;
}

/**
 * An Interval object represents a half-open interval of time, where each endpoint is a {@link DateTime}. Conceptually, it's a container for those two endpoints, accompanied by methods for creating, parsing, interrogating, comparing, transforming, and formatting them.
 *
 * Here is a brief overview of the most commonly used methods and getters in Interval:
 *
 * * **Creation** To create an Interval, use {@link fromDateTimes}, {@link after}, {@link before}, or {@link fromISO}.
 * * **Accessors** Use {@link start} and {@link end} to get the start and end.
 * * **Interrogation** To analyze the Interval, use {@link count}, {@link length}, {@link hasSame}, {@link contains}, {@link isAfter}, or {@link isBefore}.
 * * **Transformation** To create other Intervals out of this one, use {@link set}, {@link splitAt}, {@link splitBy}, {@link divideEqually}, {@link merge}, {@link xor}, {@link union}, {@link intersection}, or {@link difference}.
 * * **Comparison** To compare this Interval to another one, use {@link equals}, {@link overlaps}, {@link abutsStart}, {@link abutsEnd}, {@link engulfs}
 * * **Output*** To convert the Interval into other representations, see {@link toString}, {@link toISO}, {@link toFormat}, and {@link toDuration}.
 */

var Interval = function () {
  /**
   * @private
   */
  function Interval(config) {
    classCallCheck(this, Interval);

    /**
     * @access private
     */
    this.s = config.start;
    /**
     * @access private
     */
    this.e = config.end;
    /**
     * @access private
     */
    this.invalid = config.invalidReason || null;
  }

  /**
   * Create an invalid Interval.
   * @return {Interval}
   */


  Interval.invalid = function invalid(reason) {
    if (!reason) {
      throw new InvalidArgumentError('need to specify a reason the DateTime is invalid');
    }
    if (Settings.throwOnInvalid) {
      throw new InvalidIntervalError(reason);
    } else {
      return new Interval({ invalidReason: reason });
    }
  };

  /**
   * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
   * @param {DateTime|Date|Object} start
   * @param {DateTime|Date|Object} end
   * @return {Interval}
   */


  Interval.fromDateTimes = function fromDateTimes(start, end) {
    var builtStart = friendlyDateTime(start),
        builtEnd = friendlyDateTime(end);

    return new Interval({
      start: builtStart,
      end: builtEnd,
      invalidReason: validateStartEnd(builtStart, builtEnd) ? null : 'invalid endpoints'
    });
  };

  /**
   * Create an Interval from a start DateTime and a Duration to extend to.
   * @param {DateTime|Date|Object} start
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */


  Interval.after = function after(start, duration) {
    var dur = friendlyDuration(duration),
        dt = friendlyDateTime(start);
    return Interval.fromDateTimes(dt, dt.plus(dur));
  };

  /**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime|Date|Object} end
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */


  Interval.before = function before(end, duration) {
    var dur = friendlyDuration(duration),
        dt = friendlyDateTime(end);
    return Interval.fromDateTimes(dt.minus(dur), dt);
  };

  /**
   * Create an Interval from an ISO 8601 string
   * @param {string} string - the ISO string to parse
   * @param {Object} opts - options to pass {@see DateTime.fromISO}
   * @return {Interval}
   */


  Interval.fromISO = function fromISO(string, opts) {
    if (string) {
      var _string$split = string.split(/\//),
          s = _string$split[0],
          e = _string$split[1];

      if (s && e) {
        return Interval.fromDateTimes(DateTime.fromISO(s, opts), DateTime.fromISO(e, opts));
      }
    }
    return Interval.invalid('invalid ISO format');
  };

  /**
   * Returns the start of the Interval
   * @type {DateTime}
   */


  /**
   * Returns the length of the Interval in the specified unit.
   * @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
   * @return {number}
   */
  Interval.prototype.length = function length() {
    var unit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'milliseconds';

    return this.isValid ? this.toDuration.apply(this, [unit]).get(unit) : NaN;
  };

  /**
   * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
   * Unlike {@link length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
   * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
   * @param {string} [unit='milliseconds'] - the unit of time to count.
   * @return {number}
   */


  Interval.prototype.count = function count() {
    var unit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'milliseconds';

    if (!this.isValid) return NaN;
    var start = this.start.startOf(unit),
        end = this.end.startOf(unit);
    return Math.floor(end.diff(start, unit).get(unit)) + 1;
  };

  /**
   * Returns whether this Interval's start and end are both in the same unit of time
   * @param {string} unit - the unit of time to check sameness on
   * @return {boolean}
   */


  Interval.prototype.hasSame = function hasSame(unit) {
    return this.isValid ? this.e.minus(1).hasSame(this.s, unit) : false;
  };

  /**
   * Return whether this Interval has the same start and end DateTimes.
   * @return {boolean}
   */


  Interval.prototype.isEmpty = function isEmpty() {
    return this.s.valueOf() === this.e.valueOf();
  };

  /**
   * Return whether this Interval's start is after the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */


  Interval.prototype.isAfter = function isAfter(dateTime) {
    if (!this.isValid) return false;
    return this.s > dateTime;
  };

  /**
   * Return whether this Interval's end is before the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */


  Interval.prototype.isBefore = function isBefore(dateTime) {
    if (!this.isValid) return false;
    return this.e <= dateTime;
  };

  /**
   * Return whether this Interval contains the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */


  Interval.prototype.contains = function contains(dateTime) {
    if (!this.isValid) return false;
    return this.s <= dateTime && this.e > dateTime;
  };

  /**
   * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
   * @param {Object} values - the values to set
   * @param {DateTime} values.start - the starting DateTime
   * @param {DateTime} values.end - the ending DateTime
   * @return {Interval}
   */


  Interval.prototype.set = function set$$1() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        start = _ref.start,
        end = _ref.end;

    if (!this.isValid) return this;
    return Interval.fromDateTimes(start || this.s, end || this.e);
  };

  /**
   * Split this Interval at each of the specified DateTimes
   * @param {...[DateTime]} dateTimes - the unit of time to count.
   * @return {[Interval]}
   */


  Interval.prototype.splitAt = function splitAt() {
    if (!this.isValid) return [];

    for (var _len = arguments.length, dateTimes = Array(_len), _key = 0; _key < _len; _key++) {
      dateTimes[_key] = arguments[_key];
    }

    var sorted = dateTimes.map(friendlyDateTime).sort(),
        results = [];
    var s = this.s,
        i = 0;


    while (s < this.e) {
      var added = sorted[i] || this.e,
          next = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s, next));
      s = next;
      i += 1;
    }

    return results;
  };

  /**
   * Split this Interval into smaller Intervals, each of the specified length.
   * Left over time is grouped into a smaller interval
   * @param {Duration|Object|number} duration - The length of each resulting interval.
   * @return {[Interval]}
   */


  Interval.prototype.splitBy = function splitBy(duration) {
    if (!this.isValid) return [];
    var dur = friendlyDuration(duration),
        results = [];
    var s = this.s,
        added = void 0,
        next = void 0;


    while (s < this.e) {
      added = s.plus(dur);
      next = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s, next));
      s = next;
    }

    return results;
  };

  /**
   * Split this Interval into the specified number of smaller intervals.
   * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
   * @return {[Interval]}
   */


  Interval.prototype.divideEqually = function divideEqually(numberOfParts) {
    if (!this.isValid) return [];
    return this.splitBy(this.length() / numberOfParts).slice(0, numberOfParts);
  };

  /**
   * Return whether this Interval overlaps with the specified Interval
   * @param {Interval} other
   * @return {boolean}
   */


  Interval.prototype.overlaps = function overlaps(other) {
    return this.e > other.s && this.s < other.e;
  };

  /**
   * Return whether this Interval's end is adjacent to the specified Interval's start.
   * @param {Interval} other
   * @return {boolean}
   */


  Interval.prototype.abutsStart = function abutsStart(other) {
    if (!this.isValid) return false;
    return +this.e === +other.s;
  };

  /**
   * Return whether this Interval's start is adjacent to the specified Interval's end.
   * @param {Interval} other
   * @return {boolean}
   */


  Interval.prototype.abutsEnd = function abutsEnd(other) {
    if (!this.isValid) return false;
    return +other.e === +this.s;
  };

  /**
   * Return whether this Interval engulfs the start and end of the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */


  Interval.prototype.engulfs = function engulfs(other) {
    if (!this.isValid) return false;
    return this.s <= other.s && this.e >= other.e;
  };

  /**
   * Return whether this Interval has the same start and end as the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */


  Interval.prototype.equals = function equals(other) {
    return this.s.equals(other.s) && this.e.equals(other.e);
  };

  /**
   * Return an Interval representing the intersection of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
   * Returns null if the intersection is empty, i.e., the intervals don't intersect.
   * @param {Interval} other
   * @return {Interval}
   */


  Interval.prototype.intersection = function intersection(other) {
    if (!this.isValid) return this;
    var s = this.s > other.s ? this.s : other.s,
        e = this.e < other.e ? this.e : other.e;

    if (s > e) {
      return null;
    } else {
      return Interval.fromDateTimes(s, e);
    }
  };

  /**
   * Return an Interval representing the union of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */


  Interval.prototype.union = function union(other) {
    if (!this.isValid) return this;
    var s = this.s < other.s ? this.s : other.s,
        e = this.e > other.e ? this.e : other.e;
    return Interval.fromDateTimes(s, e);
  };

  /**
   * Merge an array of Intervals into a equivalent minimal set of Intervals.
   * Combines overlapping and adjacent Intervals.
   * @param {[Interval]} intervals
   * @return {[Interval]}
   */


  Interval.merge = function merge(intervals) {
    var _intervals$sort$reduc = intervals.sort(function (a, b) {
      return a.s - b.s;
    }).reduce(function (_ref2, item) {
      var sofar = _ref2[0],
          current = _ref2[1];

      if (!current) {
        return [sofar, item];
      } else if (current.overlaps(item) || current.abutsStart(item)) {
        return [sofar, current.union(item)];
      } else {
        return [sofar.concat([current]), item];
      }
    }, [[], null]),
        found = _intervals$sort$reduc[0],
        final = _intervals$sort$reduc[1];

    if (final) {
      found.push(final);
    }
    return found;
  };

  /**
   * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
   * @param {[Interval]} intervals
   * @return {[Interval]}
   */


  Interval.xor = function xor(intervals) {
    var _Array$prototype;

    var start = null,
        currentCount = 0;
    var results = [],
        ends = intervals.map(function (i) {
      return [{ time: i.s, type: 's' }, { time: i.e, type: 'e' }];
    }),
        flattened = (_Array$prototype = Array.prototype).concat.apply(_Array$prototype, ends),
        arr = flattened.sort(function (a, b) {
      return a.time - b.time;
    });

    for (var _iterator = arr, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref3;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref3 = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref3 = _i.value;
      }

      var i = _ref3;

      currentCount += i.type === 's' ? 1 : -1;

      if (currentCount === 1) {
        start = i.time;
      } else {
        if (start && +start !== +i.time) {
          results.push(Interval.fromDateTimes(start, i.time));
        }

        start = null;
      }
    }

    return Interval.merge(results);
  };

  /**
   * Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
   * @param {...Interval} intervals
   * @return {[Interval]}
   */


  Interval.prototype.difference = function difference() {
    var _this = this;

    for (var _len2 = arguments.length, intervals = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      intervals[_key2] = arguments[_key2];
    }

    return Interval.xor([this].concat(intervals)).map(function (i) {
      return _this.intersection(i);
    }).filter(function (i) {
      return i && !i.isEmpty();
    });
  };

  /**
   * Returns a string representation of this Interval appropriate for debugging.
   * @return {string}
   */


  Interval.prototype.toString = function toString() {
    if (!this.isValid) return INVALID$1;
    return '[' + this.s.toISO() + ' \u2013 ' + this.e.toISO() + ')';
  };

  /**
   * Returns a string representation of this Interval appropriate for the REPL.
   * @return {string}
   */


  Interval.prototype.inspect = function inspect() {
    if (this.isValid) {
      return 'Interval {\n  start: ' + this.start.toISO() + ',\n  end: ' + this.end.toISO() + ',\n  zone:   ' + this.start.zone.name + ',\n  locale:   ' + this.start.locale + ' }';
    } else {
      return 'Interval { Invalid, reason: ' + this.invalidReason + ' }';
    }
  };

  /**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime.toISO}
   * @return {string}
   */


  Interval.prototype.toISO = function toISO(opts) {
    if (!this.isValid) return INVALID$1;
    return this.s.toISO(opts) + '/' + this.e.toISO(opts);
  };

  /**
   * Returns a string representation of this Interval formatted according to the specified format string.
   * @param {string} dateFormat - the format string. This string formats the start and end time. See {@link DateTime.toFormat} for details.
   * @param {Object} opts - options
   * @param {string} [opts.separator =  ' – '] - a separator to place between the start and end representations
   * @return {string}
   */


  Interval.prototype.toFormat = function toFormat(dateFormat) {
    var _ref4 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref4$separator = _ref4.separator,
        separator = _ref4$separator === undefined ? ' – ' : _ref4$separator;

    if (!this.isValid) return INVALID$1;
    return '' + this.s.toFormat(dateFormat) + separator + this.e.toFormat(dateFormat);
  };

  /**
   * Return a Duration representing the time spanned by this interval.
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
   * @return {Duration}
   */


  Interval.prototype.toDuration = function toDuration(unit, opts) {
    if (!this.isValid) {
      return Duration.invalid(this.invalidReason);
    }
    return this.e.diff(this.s, unit, opts);
  };

  createClass(Interval, [{
    key: 'start',
    get: function get$$1() {
      return this.isValid ? this.s : null;
    }

    /**
     * Returns the end of the Interval
     * @type {DateTime}
     */

  }, {
    key: 'end',
    get: function get$$1() {
      return this.isValid ? this.e : null;
    }

    /**
     * Returns whether this Interval's end is at least its start, i.e. that the Interval isn't 'backwards'.
     * @type {boolean}
     */

  }, {
    key: 'isValid',
    get: function get$$1() {
      return this.invalidReason === null;
    }

    /**
     * Returns an explanation of why this Interval became invalid, or null if the Interval is valid
     * @type {string}
     */

  }, {
    key: 'invalidReason',
    get: function get$$1() {
      return this.invalid;
    }
  }]);
  return Interval;
}();

/**
 * The Info class contains static methods for retrieving general time and date related data. For example, it has methods for finding out if a time zone has a DST, for listing the months in any supported locale, and for discovering which of Luxon features are available in the current environment.
 */

var Info = function () {
  function Info() {
    classCallCheck(this, Info);
  }

  /**
   * Return whether the specified zone contains a DST.
   * @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
   * @return {boolean}
   */
  Info.hasDST = function hasDST() {
    var zone = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Settings.defaultZone;

    var proto = DateTime.local().setZone(zone).set({ month: 12 });

    return !zone.universal && proto.offset !== proto.set({ month: 6 }).offset;
  };

  /**
   * Return whether the specified zone is a valid IANA specifier.
   * @param {string} zone - Zone to check
   * @return {boolean}
   */


  Info.isValidIANAZone = function isValidIANAZone(zone) {
    return !!IANAZone.isValidSpecifier(zone) && IANAZone.isValidZone(zone);
  };

  /**
   * Return an array of standalone month names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @example Info.months()[0] //=> 'January'
   * @example Info.months('short')[0] //=> 'Jan'
   * @example Info.months('numeric')[0] //=> '1'
   * @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
   * @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
   * @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
   * @return {[string]}
   */


  Info.months = function months() {
    var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'long';

    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$locale = _ref.locale,
        locale = _ref$locale === undefined ? null : _ref$locale,
        _ref$numberingSystem = _ref.numberingSystem,
        numberingSystem = _ref$numberingSystem === undefined ? null : _ref$numberingSystem,
        _ref$outputCalendar = _ref.outputCalendar,
        outputCalendar = _ref$outputCalendar === undefined ? 'gregory' : _ref$outputCalendar;

    return Locale.create(locale, numberingSystem, outputCalendar).months(length);
  };

  /**
   * Return an array of format month names.
   * Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
   * changes the string.
   * See {@link months}
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @return {[string]}
   */


  Info.monthsFormat = function monthsFormat() {
    var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'long';

    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref2$locale = _ref2.locale,
        locale = _ref2$locale === undefined ? null : _ref2$locale,
        _ref2$numberingSystem = _ref2.numberingSystem,
        numberingSystem = _ref2$numberingSystem === undefined ? null : _ref2$numberingSystem,
        _ref2$outputCalendar = _ref2.outputCalendar,
        outputCalendar = _ref2$outputCalendar === undefined ? 'gregory' : _ref2$outputCalendar;

    return Locale.create(locale, numberingSystem, outputCalendar).months(length, true);
  };

  /**
   * Return an array of standalone week names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the month representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @example Info.weekdays()[0] //=> 'Monday'
   * @example Info.weekdays('short')[0] //=> 'Mon'
   * @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
   * @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
   * @return {[string]}
   */


  Info.weekdays = function weekdays() {
    var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'long';

    var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref3$locale = _ref3.locale,
        locale = _ref3$locale === undefined ? null : _ref3$locale,
        _ref3$numberingSystem = _ref3.numberingSystem,
        numberingSystem = _ref3$numberingSystem === undefined ? null : _ref3$numberingSystem;

    return Locale.create(locale, numberingSystem, null).weekdays(length);
  };

  /**
   * Return an array of format week names.
   * Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
   * changes the string.
   * See {@link weekdays}
   * @param {string} [length='long'] - the length of the month representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale=null] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @return {[string]}
   */


  Info.weekdaysFormat = function weekdaysFormat() {
    var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'long';

    var _ref4 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref4$locale = _ref4.locale,
        locale = _ref4$locale === undefined ? null : _ref4$locale,
        _ref4$numberingSystem = _ref4.numberingSystem,
        numberingSystem = _ref4$numberingSystem === undefined ? null : _ref4$numberingSystem;

    return Locale.create(locale, numberingSystem, null).weekdays(length, true);
  };

  /**
   * Return an array of meridiems.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.meridiems() //=> [ 'AM', 'PM' ]
   * @example Info.meridiems({ locale: 'de' }) //=> [ 'vorm.', 'nachm.' ]
   * @return {[string]}
   */


  Info.meridiems = function meridiems() {
    var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref5$locale = _ref5.locale,
        locale = _ref5$locale === undefined ? null : _ref5$locale;

    return Locale.create(locale).meridiems();
  };

  /**
   * Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
   * @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.eras() //=> [ 'BC', 'AD' ]
   * @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
   * @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
   * @return {[string]}
   */


  Info.eras = function eras() {
    var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'short';

    var _ref6 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref6$locale = _ref6.locale,
        locale = _ref6$locale === undefined ? null : _ref6$locale;

    return Locale.create(locale, null, 'gregory').eras(length);
  };

  /**
   * Return the set of available features in this environment.
   * Some features of Luxon are not available in all environments. For example, on older browsers, timezone support is not available. Use this function to figure out if that's the case.
   * Keys:
   * * `zones`: whether this environment supports IANA timezones
   * * `intlTokens`: whether this environment supports internationalized token-based formatting/parsing
   * * `intl`: whether this environment supports general internationalization
   * @example Info.features() //=> { intl: true, intlTokens: false, zones: true }
   * @return {Object}
   */


  Info.features = function features() {
    var intl = false,
        intlTokens = false,
        zones = false;

    if (hasIntl()) {
      intl = true;
      intlTokens = hasFormatToParts();

      try {
        zones = new Intl.DateTimeFormat('en', { timeZone: 'America/New_York' }).resolvedOptions().timeZone === 'America/New_York';
      } catch (e) {
        zones = false;
      }
    }

    return { intl: intl, intlTokens: intlTokens, zones: zones };
  };

  return Info;
}();

function dayDiff(earlier, later) {
  var utcDayStart = function utcDayStart(dt) {
    return dt.toUTC(0, { keepLocalTime: true }).startOf('day').valueOf();
  },
      ms = utcDayStart(later) - utcDayStart(earlier);
  return Math.floor(Duration.fromMillis(ms).as('days'));
}

function highOrderDiffs(cursor, later, units) {
  var differs = [['years', function (a, b) {
    return b.year - a.year;
  }], ['months', function (a, b) {
    return b.month - a.month + (b.year - a.year) * 12;
  }], ['weeks', function (a, b) {
    var days = dayDiff(a, b);
    return (days - days % 7) / 7;
  }], ['days', dayDiff]];

  var results = {};
  var lowestOrder = void 0,
      highWater = void 0;

  for (var _iterator = differs, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref2;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref2 = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref2 = _i.value;
    }

    var _ref = _ref2;
    var unit = _ref[0];
    var differ = _ref[1];

    if (units.indexOf(unit) >= 0) {
      var _cursor$plus;

      lowestOrder = unit;

      var delta = differ(cursor, later);

      highWater = cursor.plus((_cursor$plus = {}, _cursor$plus[unit] = delta, _cursor$plus));

      if (highWater > later) {
        var _highWater$minus;

        cursor = highWater.minus((_highWater$minus = {}, _highWater$minus[unit] = 1, _highWater$minus));
        delta -= 1;
      } else {
        cursor = highWater;
      }

      if (delta > 0) {
        results[unit] = delta;
      }
    }
  }

  return [cursor, results, highWater, lowestOrder];
}

function _diff (earlier, later, units, opts) {
  var _highOrderDiffs = highOrderDiffs(earlier, later, units),
      cursor = _highOrderDiffs[0],
      results = _highOrderDiffs[1],
      highWater = _highOrderDiffs[2],
      lowestOrder = _highOrderDiffs[3];

  var remainingMillis = later - cursor;

  var lowerOrderUnits = units.filter(function (u) {
    return ['hours', 'minutes', 'seconds', 'milliseconds'].indexOf(u) >= 0;
  });

  if (lowerOrderUnits.length === 0) {
    if (highWater < later) {
      var _cursor$plus2;

      highWater = cursor.plus((_cursor$plus2 = {}, _cursor$plus2[lowestOrder] = 1, _cursor$plus2));
    }

    if (highWater !== cursor) {
      results[lowestOrder] = (results[lowestOrder] || 0) + remainingMillis / (highWater - cursor);
    }
  }

  var duration = Duration.fromObject(Object.assign(results, opts));

  if (lowerOrderUnits.length > 0) {
    var _Duration$fromMillis;

    return (_Duration$fromMillis = Duration.fromMillis(remainingMillis, opts)).shiftTo.apply(_Duration$fromMillis, lowerOrderUnits).plus(duration);
  } else {
    return duration;
  }
}

var MISSING_FTP = 'missing Intl.DateTimeFormat.formatToParts support';

function intUnit(regex) {
  var post = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (i) {
    return i;
  };

  return { regex: regex, deser: function deser(_ref) {
      var s = _ref[0];
      return post(parseInt(s));
    } };
}

function fixListRegex(s) {
  // make dots optional and also make them literal
  return s.replace(/\./, '\\.?');
}

function stripInsensitivities(s) {
  return s.replace(/\./, '').toLowerCase();
}

function oneOf(strings, startIndex) {
  if (strings === null) {
    return null;
  } else {
    return {
      regex: RegExp(strings.map(fixListRegex).join('|')),
      deser: function deser(_ref2) {
        var s = _ref2[0];
        return strings.findIndex(function (i) {
          return stripInsensitivities(s) === stripInsensitivities(i);
        }) + startIndex;
      }
    };
  }
}

function offset(regex, groups) {
  return { regex: regex, deser: function deser(_ref3) {
      var h = _ref3[1],
          m = _ref3[2];
      return signedOffset(h, m);
    }, groups: groups };
}

function simple(regex) {
  return { regex: regex, deser: function deser(_ref4) {
      var s = _ref4[0];
      return s;
    } };
}

function unitForToken(token, loc) {
  var one = /\d/,
      two = /\d{2}/,
      three = /\d{3}/,
      four = /\d{4}/,
      oneOrTwo = /\d{1,2}/,
      oneToThree = /\d{1,3}/,
      twoToFour = /\d{2,4}/,
      literal = function literal(t) {
    return { regex: RegExp(t.val), deser: function deser(_ref5) {
        var s = _ref5[0];
        return s;
      }, literal: true };
  },
      unitate = function unitate(t) {
    if (token.literal) {
      return literal(t);
    }
    switch (t.val) {
      // era
      case 'G':
        return oneOf(loc.eras('short', false), 0);
      case 'GG':
        return oneOf(loc.eras('long', false), 0);
      // years
      case 'y':
        return intUnit(/\d{1,6}/);
      case 'yy':
        return intUnit(twoToFour, untruncateYear);
      case 'yyyy':
        return intUnit(four);
      case 'yyyyy':
        return intUnit(/\d{4,6}/);
      case 'yyyyyy':
        return intUnit(/\d{6}/);
      // months
      case 'M':
        return intUnit(oneOrTwo);
      case 'MM':
        return intUnit(two);
      case 'MMM':
        return oneOf(loc.months('short', false, false), 1);
      case 'MMMM':
        return oneOf(loc.months('long', false, false), 1);
      case 'L':
        return intUnit(oneOrTwo);
      case 'LL':
        return intUnit(two);
      case 'LLL':
        return oneOf(loc.months('short', true, false), 1);
      case 'LLLL':
        return oneOf(loc.months('long', true, false), 1);
      // dates
      case 'd':
        return intUnit(oneOrTwo);
      case 'dd':
        return intUnit(two);
      // ordinals
      case 'o':
        return intUnit(oneToThree);
      case 'ooo':
        return intUnit(three);
      // time
      case 'HH':
        return intUnit(two);
      case 'H':
        return intUnit(oneOrTwo);
      case 'hh':
        return intUnit(two);
      case 'h':
        return intUnit(oneOrTwo);
      case 'mm':
        return intUnit(two);
      case 'm':
        return intUnit(oneOrTwo);
      case 's':
        return intUnit(oneOrTwo);
      case 'ss':
        return intUnit(two);
      case 'S':
        return intUnit(oneToThree);
      case 'SSS':
        return intUnit(three);
      case 'u':
        return simple(/\d{1,9}/);
      // meridiem
      case 'a':
        return oneOf(loc.meridiems(), 0);
      // weekYear (k)
      case 'kkkk':
        return intUnit(four);
      case 'kk':
        return intUnit(twoToFour, untruncateYear);
      // weekNumber (W)
      case 'W':
        return intUnit(oneOrTwo);
      case 'WW':
        return intUnit(two);
      // weekdays
      case 'E':
      case 'c':
        return intUnit(one);
      case 'EEE':
        return oneOf(loc.weekdays('short', false, false), 1);
      case 'EEEE':
        return oneOf(loc.weekdays('long', false, false), 1);
      case 'ccc':
        return oneOf(loc.weekdays('short', true, false), 1);
      case 'cccc':
        return oneOf(loc.weekdays('long', true, false), 1);
      // offset/zone
      case 'Z':
      case 'ZZ':
        return offset(/([+-]\d{1,2})(?::(\d{2}))?/, 2);
      case 'ZZZ':
        return offset(/([+-]\d{1,2})(\d{2})?/, 2);
      // we don't support ZZZZ (PST) or ZZZZZ (Pacific Standard Time) in parsing
      // because we don't have any way to figure out what they are
      case 'z':
        return simple(/[A-Za-z_]{1,256}\/[A-Za-z_]{1,256}/);
      default:
        return literal(t);
    }
  };

  var unit = unitate(token) || {
    invalidReason: MISSING_FTP
  };

  unit.token = token;

  return unit;
}

function buildRegex(units) {
  var re = units.map(function (u) {
    return u.regex;
  }).reduce(function (f, r) {
    return f + '(' + r.source + ')';
  }, '');
  return ['^' + re + '$', units];
}

function match(input, regex, handlers) {
  var matches = input.match(regex);

  if (matches) {
    var all = {};
    var matchIndex = 1;
    for (var i in handlers) {
      if (handlers.hasOwnProperty(i)) {
        var h = handlers[i],
            groups = h.groups ? h.groups + 1 : 1;
        if (!h.literal && h.token) {
          all[h.token.val[0]] = h.deser(matches.slice(matchIndex, matchIndex + groups));
        }
        matchIndex += groups;
      }
    }
    return [matches, all];
  } else {
    return [matches, {}];
  }
}

function dateTimeFromMatches(matches) {
  var toField = function toField(token) {
    switch (token) {
      case 'S':
        return 'millisecond';
      case 's':
        return 'second';
      case 'm':
        return 'minute';
      case 'h':
      case 'H':
        return 'hour';
      case 'd':
        return 'day';
      case 'o':
        return 'ordinal';
      case 'L':
      case 'M':
        return 'month';
      case 'y':
        return 'year';
      case 'E':
      case 'c':
        return 'weekday';
      case 'W':
        return 'weekNumber';
      case 'k':
        return 'weekYear';
      default:
        return null;
    }
  };

  var zone = void 0;
  if (!isUndefined(matches.Z)) {
    zone = new FixedOffsetZone(matches.Z);
  } else if (!isUndefined(matches.z)) {
    zone = new IANAZone(matches.z);
  } else {
    zone = null;
  }

  if (!isUndefined(matches.h)) {
    if (matches.h < 12 && matches.a === 1) {
      matches.h += 12;
    } else if (matches.h === 12 && matches.a === 0) {
      matches.h = 0;
    }
  }

  if (matches.G === 0 && matches.y) {
    matches.y = -matches.y;
  }

  if (!isUndefined(matches.u)) {
    matches.S = parseMillis(matches.u);
  }

  var vals = Object.keys(matches).reduce(function (r, k) {
    var f = toField(k);
    if (f) {
      r[f] = matches[k];
    }

    return r;
  }, {});

  return [vals, zone];
}

/**
 * @private
 */

function explainFromTokens(locale, input, format) {
  var tokens = Formatter.parseFormat(format),
      units = tokens.map(function (t) {
    return unitForToken(t, locale);
  }),
      disqualifyingUnit = units.find(function (t) {
    return t.invalidReason;
  });

  if (disqualifyingUnit) {
    return { input: input, tokens: tokens, invalidReason: disqualifyingUnit.invalidReason };
  } else {
    var _buildRegex = buildRegex(units),
        regexString = _buildRegex[0],
        handlers = _buildRegex[1],
        regex = RegExp(regexString, 'i'),
        _match = match(input, regex, handlers),
        rawMatches = _match[0],
        matches = _match[1],
        _ref6 = matches ? dateTimeFromMatches(matches) : [null, null],
        result = _ref6[0],
        zone = _ref6[1];

    return { input: input, tokens: tokens, regex: regex, rawMatches: rawMatches, matches: matches, result: result, zone: zone };
  }
}

function parseFromTokens(locale, input, format) {
  var _explainFromTokens = explainFromTokens(locale, input, format),
      result = _explainFromTokens.result,
      zone = _explainFromTokens.zone,
      invalidReason = _explainFromTokens.invalidReason;

  return [result, zone, invalidReason];
}

var nonLeapLadder = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
    leapLadder = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

function dayOfWeek(year, month, day) {
  var js = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return js === 0 ? 7 : js;
}

function lastWeekNumber(weekYear) {
  var p1 = (weekYear + Math.floor(weekYear / 4) - Math.floor(weekYear / 100) + Math.floor(weekYear / 400)) % 7,
      last = weekYear - 1,
      p2 = (last + Math.floor(last / 4) - Math.floor(last / 100) + Math.floor(last / 400)) % 7;
  return p1 === 4 || p2 === 3 ? 53 : 52;
}

function computeOrdinal(year, month, day) {
  return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
}

function uncomputeOrdinal(year, ordinal) {
  var table = isLeapYear(year) ? leapLadder : nonLeapLadder,
      month0 = table.findIndex(function (i) {
    return i < ordinal;
  }),
      day = ordinal - table[month0];
  return { month: month0 + 1, day: day };
}

/**
 * @private
 */

function gregorianToWeek(gregObj) {
  var year = gregObj.year,
      month = gregObj.month,
      day = gregObj.day,
      ordinal = computeOrdinal(year, month, day),
      weekday = dayOfWeek(year, month, day);


  var weekNumber = Math.floor((ordinal - weekday + 10) / 7),
      weekYear = void 0;

  if (weekNumber < 1) {
    weekYear = year - 1;
    weekNumber = lastWeekNumber(weekYear);
  } else if (weekNumber > lastWeekNumber(year)) {
    weekYear = year + 1;
    weekNumber = 1;
  } else {
    weekYear = year;
  }

  return Object.assign({ weekYear: weekYear, weekNumber: weekNumber, weekday: weekday }, timeObject(gregObj));
}

function weekToGregorian(weekData) {
  var weekYear = weekData.weekYear,
      weekNumber = weekData.weekNumber,
      weekday = weekData.weekday,
      weekdayOfJan4 = dayOfWeek(weekYear, 1, 4),
      yearInDays = daysInYear(weekYear);

  var ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 3,
      year = void 0;

  if (ordinal < 1) {
    year = weekYear - 1;
    ordinal += daysInYear(year);
  } else if (ordinal > yearInDays) {
    year = weekYear + 1;
    ordinal -= daysInYear(year);
  } else {
    year = weekYear;
  }

  var _uncomputeOrdinal = uncomputeOrdinal(year, ordinal),
      month = _uncomputeOrdinal.month,
      day = _uncomputeOrdinal.day;

  return Object.assign({ year: year, month: month, day: day }, timeObject(weekData));
}

function gregorianToOrdinal(gregData) {
  var year = gregData.year,
      month = gregData.month,
      day = gregData.day,
      ordinal = computeOrdinal(year, month, day);


  return Object.assign({ year: year, ordinal: ordinal }, timeObject(gregData));
}

function ordinalToGregorian(ordinalData) {
  var year = ordinalData.year,
      ordinal = ordinalData.ordinal,
      _uncomputeOrdinal2 = uncomputeOrdinal(year, ordinal),
      month = _uncomputeOrdinal2.month,
      day = _uncomputeOrdinal2.day;

  return Object.assign({ year: year, month: month, day: day }, timeObject(ordinalData));
}

function hasInvalidWeekData(obj) {
  var validYear = isNumber(obj.weekYear),
      validWeek = numberBetween(obj.weekNumber, 1, lastWeekNumber(obj.weekYear)),
      validWeekday = numberBetween(obj.weekday, 1, 7);

  if (!validYear) {
    return 'weekYear out of range';
  } else if (!validWeek) {
    return 'week out of range';
  } else if (!validWeekday) {
    return 'weekday out of range';
  } else return false;
}

function hasInvalidOrdinalData(obj) {
  var validYear = isNumber(obj.year),
      validOrdinal = numberBetween(obj.ordinal, 1, daysInYear(obj.year));

  if (!validYear) {
    return 'year out of range';
  } else if (!validOrdinal) {
    return 'ordinal out of range';
  } else return false;
}

function hasInvalidGregorianData(obj) {
  var validYear = isNumber(obj.year),
      validMonth = numberBetween(obj.month, 1, 12),
      validDay = numberBetween(obj.day, 1, daysInMonth(obj.year, obj.month));

  if (!validYear) {
    return 'year out of range';
  } else if (!validMonth) {
    return 'month out of range';
  } else if (!validDay) {
    return 'day out of range';
  } else return false;
}

function hasInvalidTimeData(obj) {
  var validHour = numberBetween(obj.hour, 0, 23),
      validMinute = numberBetween(obj.minute, 0, 59),
      validSecond = numberBetween(obj.second, 0, 59),
      validMillisecond = numberBetween(obj.millisecond, 0, 999);

  if (!validHour) {
    return 'hour out of range';
  } else if (!validMinute) {
    return 'minute out of range';
  } else if (!validSecond) {
    return 'second out of range';
  } else if (!validMillisecond) {
    return 'millisecond out of range';
  } else return false;
}

var INVALID$2 = 'Invalid DateTime',
    INVALID_INPUT = 'invalid input',
    UNSUPPORTED_ZONE = 'unsupported zone',
    UNPARSABLE$1 = 'unparsable';

// we cache week data on the DT object and this intermediates the cache
function possiblyCachedWeekData(dt) {
  if (dt.weekData === null) {
    dt.weekData = gregorianToWeek(dt.c);
  }
  return dt.weekData;
}

// clone really means, "make a new object with these modifications". all "setters" really use this
// to create a new object while only changing some of the properties
function clone$1(inst, alts) {
  var current = {
    ts: inst.ts,
    zone: inst.zone,
    c: inst.c,
    o: inst.o,
    loc: inst.loc,
    invalidReason: inst.invalidReason
  };
  return new DateTime(Object.assign({}, current, alts, { old: current }));
}

// find the right offset a given local time. The o input is our guess, which determines which
// offset we'll pick in ambiguous cases (e.g. there are two 3 AMs b/c Fallback DST)
function fixOffset(localTS, o, tz) {
  // Our UTC time is just a guess because our offset is just a guess
  var utcGuess = localTS - o * 60 * 1000;

  // Test whether the zone matches the offset for this ts
  var o2 = tz.offset(utcGuess);

  // If so, offset didn't change and we're done
  if (o === o2) {
    return [utcGuess, o];
  }

  // If not, change the ts by the difference in the offset
  utcGuess -= (o2 - o) * 60 * 1000;

  // If that gives us the local time we want, we're done
  var o3 = tz.offset(utcGuess);
  if (o2 === o3) {
    return [utcGuess, o2];
  }

  // If it's different, we're in a hole time. The offset has changed, but the we don't adjust the time
  return [localTS - Math.min(o2, o3) * 60 * 1000, Math.max(o2, o3)];
}

// convert an epoch timestamp into a calendar object with the given offset
function tsToObj(ts, offset) {
  ts += offset * 60 * 1000;

  var d = new Date(ts);

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    millisecond: d.getUTCMilliseconds()
  };
}

// covert a calendar object to a local timestamp (epoch, but with the offset baked in)
function objToLocalTS(obj) {
  var d = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second, obj.millisecond);

  // javascript is stupid and i hate it
  if (obj.year < 100 && obj.year >= 0) {
    d = new Date(d);
    d.setUTCFullYear(obj.year);
  }
  return +d;
}

// convert a calendar object to a epoch timestamp
function objToTS(obj, offset, zone) {
  return fixOffset(objToLocalTS(obj), offset, zone);
}

// create a new DT instance by adding a duration, adjusting for DSTs
function adjustTime(inst, dur) {
  var oPre = inst.o,
      year = inst.c.year + dur.years,
      month = inst.c.month + dur.months + dur.quarters * 3,
      c = Object.assign({}, inst.c, {
    year: year,
    month: month,
    day: Math.min(inst.c.day, daysInMonth(year, month)) + dur.days + dur.weeks * 7
  }),
      millisToAdd = Duration.fromObject({
    hours: dur.hours,
    minutes: dur.minutes,
    seconds: dur.seconds,
    milliseconds: dur.milliseconds
  }).as('milliseconds'),
      localTS = objToLocalTS(c);

  var _fixOffset = fixOffset(localTS, oPre, inst.zone),
      ts = _fixOffset[0],
      o = _fixOffset[1];

  if (millisToAdd !== 0) {
    ts += millisToAdd;
    // that could have changed the offset by going over a DST, but we want to keep the ts the same
    o = inst.zone.offset(ts);
  }

  return { ts: ts, o: o };
}

// helper useful in turning the results of parsing into real dates
// by handling the zone options
function parseDataToDateTime(parsed, parsedZone, opts) {
  var setZone = opts.setZone,
      zone = opts.zone;

  if (parsed && Object.keys(parsed).length !== 0) {
    var interpretationZone = parsedZone || zone,
        inst = DateTime.fromObject(Object.assign(parsed, opts, {
      zone: interpretationZone
    }));
    return setZone ? inst : inst.setZone(zone);
  } else {
    return DateTime.invalid(UNPARSABLE$1);
  }
}

// if you want to output a technical format (e.g. RFC 2822), this helper
// helps handle the details
function toTechFormat(dt, format) {
  return dt.isValid ? Formatter.create(Locale.create('en-US'), { forceSimple: true }).formatDateTimeFromString(dt, format) : null;
}

// technical time formats (e.g. the time part of ISO 8601), take some options
// and this commonizes their handling
function toTechTimeFormat(dt, _ref) {
  var _ref$suppressSeconds = _ref.suppressSeconds,
      suppressSeconds = _ref$suppressSeconds === undefined ? false : _ref$suppressSeconds,
      _ref$suppressMillisec = _ref.suppressMilliseconds,
      suppressMilliseconds = _ref$suppressMillisec === undefined ? false : _ref$suppressMillisec,
      _ref$includeOffset = _ref.includeOffset,
      includeOffset = _ref$includeOffset === undefined ? true : _ref$includeOffset,
      _ref$includeZone = _ref.includeZone,
      includeZone = _ref$includeZone === undefined ? false : _ref$includeZone,
      _ref$spaceZone = _ref.spaceZone,
      spaceZone = _ref$spaceZone === undefined ? false : _ref$spaceZone;

  var fmt = 'HH:mm';

  if (!suppressSeconds || dt.second !== 0 || dt.millisecond !== 0) {
    fmt += ':ss';
    if (!suppressMilliseconds || dt.millisecond !== 0) {
      fmt += '.SSS';
    }
  }

  if ((includeZone || includeOffset) && spaceZone) {
    fmt += ' ';
  }

  if (includeZone) {
    fmt += 'z';
  } else if (includeOffset) {
    fmt += 'ZZ';
  }

  return toTechFormat(dt, fmt);
}

// defaults for unspecified units in the supported calendars
var defaultUnitValues = {
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
},
    defaultWeekUnitValues = {
  weekNumber: 1,
  weekday: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
},
    defaultOrdinalUnitValues = {
  ordinal: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
};

// Units in the supported calendars, sorted by bigness
var orderedUnits$1 = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'],
    orderedWeekUnits = ['weekYear', 'weekNumber', 'weekday', 'hour', 'minute', 'second', 'millisecond'],
    orderedOrdinalUnits = ['year', 'ordinal', 'hour', 'minute', 'second', 'millisecond'];

// standardize case and plurality in units
function normalizeUnit(unit) {
  var ignoreUnknown = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var normalized = {
    year: 'year',
    years: 'year',
    month: 'month',
    months: 'month',
    day: 'day',
    days: 'day',
    hour: 'hour',
    hours: 'hour',
    minute: 'minute',
    minutes: 'minute',
    second: 'second',
    seconds: 'second',
    millisecond: 'millisecond',
    milliseconds: 'millisecond',
    weekday: 'weekday',
    weekdays: 'weekday',
    weeknumber: 'weekNumber',
    weeksnumber: 'weekNumber',
    weeknumbers: 'weekNumber',
    weekyear: 'weekYear',
    weekyears: 'weekYear',
    ordinal: 'ordinal'
  }[unit ? unit.toLowerCase() : unit];

  if (!ignoreUnknown && !normalized) throw new InvalidUnitError(unit);

  return normalized;
}

// this is a dumbed down version of fromObject() that runs about 60% faster
// but doesn't do any validation, makes a bunch of assumptions about what units
// are present, and so on.
function quickDT(obj, zone) {
  // assume we have the higher-order units
  for (var _iterator = orderedUnits$1, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref2;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref2 = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref2 = _i.value;
    }

    var u = _ref2;

    if (isUndefined(obj[u])) {
      obj[u] = defaultUnitValues[u];
    }
  }

  var invalidReason = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
  if (invalidReason) {
    return DateTime.invalid(invalidReason);
  }

  var tsNow = Settings.now(),
      offsetProvis = zone.offset(tsNow),
      _objToTS = objToTS(obj, offsetProvis, zone),
      ts = _objToTS[0],
      o = _objToTS[1];


  return new DateTime({
    ts: ts,
    zone: zone,
    o: o
  });
}

/**
 * A DateTime is an immutable data structure representing a specific date and time and accompanying methods. It contains class and instance methods for creating, parsing, interrogating, transforming, and formatting them.
 *
 * A DateTime comprises of:
 * * A timestamp. Each DateTime instance refers to a specific millisecond of the Unix epoch.
 * * A time zone. Each instance is considered in the context of a specific zone (by default the local system's zone).
 * * Configuration properties that effect how output strings are formatted, such as `locale`, `numberingSystem`, and `outputCalendar`.
 *
 * Here is a brief overview of the most commonly used functionality it provides:
 *
 * * **Creation**: To create a DateTime from its components, use one of its factory class methods: {@link local}, {@link utc}, and (most flexibly) {@link fromObject}. To create one from a standard string format, use {@link fromISO}, {@link fromHTTP}, and {@link fromRFC2822}. To create one from a custom string format, use {@link fromFormat}. To create one from a native JS date, use {@link fromJSDate}.
 * * **Gregorian calendar and time**: To examine the Gregorian properties of a DateTime individually (i.e as opposed to collectively through {@link toObject}), use the {@link year}, {@link month},
 * {@link day}, {@link hour}, {@link minute}, {@link second}, {@link millisecond} accessors.
 * * **Week calendar**: For ISO week calendar attributes, see the {@link weekYear}, {@link weekNumber}, and {@link weekday} accessors.
 * * **Configuration** See the {@link locale} and {@link numberingSystem} accessors.
 * * **Transformation**: To transform the DateTime into other DateTimes, use {@link set}, {@link reconfigure}, {@link setZone}, {@link setLocale}, {@link plus}, {@link minus}, {@link endOf}, {@link startOf}, {@link toUTC}, and {@link toLocal}.
 * * **Output**: To convert the DateTime to other representations, use the {@link toJSON}, {@link toISO}, {@link toHTTP}, {@link toObject}, {@link toRFC2822}, {@link toString}, {@link toLocaleString}, {@link toFormat}, {@link valueOf} and {@link toJSDate}.
 *
 * There's plenty others documented below. In addition, for more information on subtler topics like internationalization, time zones, alternative calendars, validity, and so on, see the external documentation.
 */

var DateTime = function () {
  /**
   * @access private
   */
  function DateTime(config) {
    classCallCheck(this, DateTime);

    var zone = config.zone || Settings.defaultZone,
        invalidReason = config.invalidReason || (Number.isNaN(config.ts) ? INVALID_INPUT : null) || (!zone.isValid ? UNSUPPORTED_ZONE : null);
    /**
     * @access private
     */
    this.ts = isUndefined(config.ts) ? Settings.now() : config.ts;

    var c = null,
        o = null;
    if (!invalidReason) {
      var unchanged = config.old && config.old.ts === this.ts && config.old.zone.equals(zone);
      c = unchanged ? config.old.c : tsToObj(this.ts, zone.offset(this.ts));
      o = unchanged ? config.old.o : zone.offset(this.ts);
    }

    /**
     * @access private
     */
    this.zone = zone;
    /**
     * @access private
     */
    this.loc = config.loc || Locale.create();
    /**
     * @access private
     */
    this.invalid = invalidReason;
    /**
     * @access private
     */
    this.weekData = null;
    /**
     * @access private
     */
    this.c = c;
    /**
     * @access private
     */
    this.o = o;
  }

  // CONSTRUCT

  /**
   * Create a local DateTime
   * @param {number} year - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, i.e. a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, i.e. a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, i.e. a number between 0 and 999
   * @example DateTime.local()                            //~> now
   * @example DateTime.local(2017)                        //~> 2017-01-01T00:00:00
   * @example DateTime.local(2017, 3)                     //~> 2017-03-01T00:00:00
   * @example DateTime.local(2017, 3, 12)                 //~> 2017-03-12T00:00:00
   * @example DateTime.local(2017, 3, 12, 5)              //~> 2017-03-12T05:00:00
   * @example DateTime.local(2017, 3, 12, 5, 45)          //~> 2017-03-12T05:45:00
   * @example DateTime.local(2017, 3, 12, 5, 45, 10)      //~> 2017-03-12T05:45:10
   * @example DateTime.local(2017, 3, 12, 5, 45, 10, 765) //~> 2017-03-12T05:45:10.675
   * @return {DateTime}
   */


  DateTime.local = function local(year, month, day, hour, minute, second, millisecond) {
    if (isUndefined(year)) {
      return new DateTime({ ts: Settings.now() });
    } else {
      return quickDT({
        year: year,
        month: month,
        day: day,
        hour: hour,
        minute: minute,
        second: second,
        millisecond: millisecond
      }, Settings.defaultZone);
    }
  };

  /**
   * Create a DateTime in UTC
   * @param {number} year - The calendar year. If omitted (as in, call `utc()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, i.e. a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, i.e. a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, i.e. a number between 0 and 999
   * @example DateTime.utc()                            //~> now
   * @example DateTime.utc(2017)                        //~> 2017-01-01T00:00:00Z
   * @example DateTime.utc(2017, 3)                     //~> 2017-03-01T00:00:00Z
   * @example DateTime.utc(2017, 3, 12)                 //~> 2017-03-12T00:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5)              //~> 2017-03-12T05:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45)          //~> 2017-03-12T05:45:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10)      //~> 2017-03-12T05:45:10Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10, 765) //~> 2017-03-12T05:45:10.675Z
   * @return {DateTime}
   */


  DateTime.utc = function utc(year, month, day, hour, minute, second, millisecond) {
    if (isUndefined(year)) {
      return new DateTime({
        ts: Settings.now(),
        zone: FixedOffsetZone.utcInstance
      });
    } else {
      return quickDT({
        year: year,
        month: month,
        day: day,
        hour: hour,
        minute: minute,
        second: second,
        millisecond: millisecond
      }, FixedOffsetZone.utcInstance);
    }
  };

  /**
   * Create an DateTime from a Javascript Date object. Uses the default zone.
   * @param {Date} date - a Javascript Date object
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @return {DateTime}
   */


  DateTime.fromJSDate = function fromJSDate(date) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return new DateTime({
      ts: isDate(date) ? date.valueOf() : NaN,
      zone: normalizeZone(options.zone, Settings.defaultZone),
      loc: Locale.fromObject(options)
    });
  };

  /**
   * Create an DateTime from a count of epoch milliseconds. Uses the default zone.
   * @param {number} milliseconds - a number of milliseconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @return {DateTime}
   */


  DateTime.fromMillis = function fromMillis(milliseconds) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return new DateTime({
      ts: milliseconds,
      zone: normalizeZone(options.zone, Settings.defaultZone),
      loc: Locale.fromObject(options)
    });
  };

  /**
   * Create an DateTime from a Javascript object with keys like 'year' and 'hour' with reasonable defaults.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.year - a year, such as 1987
   * @param {number} obj.month - a month, 1-12
   * @param {number} obj.day - a day of the month, 1-31, depending on the month
   * @param {number} obj.ordinal - day of the year, 1-365 or 366
   * @param {number} obj.weekYear - an ISO week year
   * @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
   * @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
   * @param {number} obj.hour - hour of the day, 0-23
   * @param {number} obj.minute - minute of the hour, 0-59
   * @param {number} obj.second - second of the minute, 0-59
   * @param {number} obj.millisecond - millisecond of the second, 0-999
   * @param {string|Zone} [obj.zone='local'] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
   * @param {string} [obj.locale='en-US'] - a locale to set on the resulting DateTime instance
   * @param {string} obj.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} obj.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
   * @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01T00'
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6, zone: 'utc' }),
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6, zone: 'local' })
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6, zone: 'America/New_York' })
   * @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
   * @return {DateTime}
   */


  DateTime.fromObject = function fromObject(obj) {
    var zoneToUse = normalizeZone(obj.zone, Settings.defaultZone);
    if (!zoneToUse.isValid) {
      return DateTime.invalid(UNSUPPORTED_ZONE);
    }

    var tsNow = Settings.now(),
        offsetProvis = zoneToUse.offset(tsNow),
        normalized = normalizeObject(obj, normalizeUnit, true),
        containsOrdinal = !isUndefined(normalized.ordinal),
        containsGregorYear = !isUndefined(normalized.year),
        containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day),
        containsGregor = containsGregorYear || containsGregorMD,
        definiteWeekDef = normalized.weekYear || normalized.weekNumber,
        loc = Locale.fromObject(obj);

    // cases:
    // just a weekday -> this week's instance of that weekday, no worries
    // (gregorian data or ordinal) + (weekYear or weekNumber) -> error
    // (gregorian month or day) + ordinal -> error
    // otherwise just use weeks or ordinals or gregorian, depending on what's specified

    if ((containsGregor || containsOrdinal) && definiteWeekDef) {
      throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
    }

    if (containsGregorMD && containsOrdinal) {
      throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
    }

    var useWeekData = definiteWeekDef || normalized.weekday && !containsGregor;

    // configure ourselves to deal with gregorian dates or week stuff
    var units = void 0,
        defaultValues = void 0,
        objNow = tsToObj(tsNow, offsetProvis);
    if (useWeekData) {
      units = orderedWeekUnits;
      defaultValues = defaultWeekUnitValues;
      objNow = gregorianToWeek(objNow);
    } else if (containsOrdinal) {
      units = orderedOrdinalUnits;
      defaultValues = defaultOrdinalUnitValues;
      objNow = gregorianToOrdinal(objNow);
    } else {
      units = orderedUnits$1;
      defaultValues = defaultUnitValues;
    }

    // set default values for missing stuff
    var foundFirst = false;
    for (var _iterator2 = units, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref3;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref3 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref3 = _i2.value;
      }

      var u = _ref3;

      var v = normalized[u];
      if (!isUndefined(v)) {
        foundFirst = true;
      } else if (foundFirst) {
        normalized[u] = defaultValues[u];
      } else {
        normalized[u] = objNow[u];
      }
    }

    // make sure the values we have are in range
    var higherOrderInvalid = useWeekData ? hasInvalidWeekData(normalized) : containsOrdinal ? hasInvalidOrdinalData(normalized) : hasInvalidGregorianData(normalized),
        invalidReason = higherOrderInvalid || hasInvalidTimeData(normalized);

    if (invalidReason) {
      return DateTime.invalid(invalidReason);
    }

    // compute the actual time
    var gregorian = useWeekData ? weekToGregorian(normalized) : containsOrdinal ? ordinalToGregorian(normalized) : normalized,
        _objToTS2 = objToTS(gregorian, offsetProvis, zoneToUse),
        tsFinal = _objToTS2[0],
        offsetFinal = _objToTS2[1],
        inst = new DateTime({
      ts: tsFinal,
      zone: zoneToUse,
      o: offsetFinal,
      loc: loc
    });

    // gregorian data + weekday serves only to validate
    if (normalized.weekday && containsGregor && obj.weekday !== inst.weekday) {
      return DateTime.invalid('mismatched weekday');
    }

    return inst;
  };

  /**
   * Create a DateTime from an ISO 8601 string
   * @param {string} text - the ISO string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @example DateTime.fromISO('2016-05-25T09:08:34.123')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00', {setZone: true})
   * @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
   * @example DateTime.fromISO('2016-W05-4')
   * @return {DateTime}
   */


  DateTime.fromISO = function fromISO(text) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _parseISODate = parseISODate(text),
        vals = _parseISODate[0],
        parsedZone = _parseISODate[1];

    return parseDataToDateTime(vals, parsedZone, opts);
  };

  /**
   * Create a DateTime from an RFC 2822 string
   * @param {string} text - the RFC 2822 string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
   * @example DateTime.fromRFC2822('Tue, 25 Nov 2016 13:23:12 +0600')
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
   * @return {DateTime}
   */


  DateTime.fromRFC2822 = function fromRFC2822(text) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _parseRFC2822Date = parseRFC2822Date(text),
        vals = _parseRFC2822Date[0],
        parsedZone = _parseRFC2822Date[1];

    return parseDataToDateTime(vals, parsedZone, opts);
  };

  /**
   * Create a DateTime from an HTTP header date
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @param {string} text - the HTTP header date
   * @param {Object} options - options to affect the creation
   * @param {string|Zone} [options.zone='local'] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [options.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
   * @param {string} [options.locale='en-US'] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
   * @return {DateTime}
   */


  DateTime.fromHTTP = function fromHTTP(text) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _parseHTTPDate = parseHTTPDate(text),
        vals = _parseHTTPDate[0],
        parsedZone = _parseHTTPDate[1];

    return parseDataToDateTime(vals, parsedZone, options);
  };

  /**
   * Create a DateTime from an input string and format string
   * Defaults to en-US if no locale has been specified, regardless of the system's locale
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see description)
   * @param {Object} options - options to affect the creation
   * @param {string|Zone} [options.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [options.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [options.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} options.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @return {DateTime}
   */


  DateTime.fromFormat = function fromFormat(text, fmt) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (isUndefined(text) || isUndefined(fmt)) {
      throw new InvalidArgumentError('fromFormat requires an input string and a format');
    }

    var _options$locale = options.locale,
        locale = _options$locale === undefined ? null : _options$locale,
        _options$numberingSys = options.numberingSystem,
        numberingSystem = _options$numberingSys === undefined ? null : _options$numberingSys,
        localeToUse = Locale.fromOpts({ locale: locale, numberingSystem: numberingSystem, defaultToEN: true }),
        _parseFromTokens = parseFromTokens(localeToUse, text, fmt),
        vals = _parseFromTokens[0],
        parsedZone = _parseFromTokens[1],
        invalidReason = _parseFromTokens[2];

    if (invalidReason) {
      return DateTime.invalid(invalidReason);
    } else {
      return parseDataToDateTime(vals, parsedZone, options);
    }
  };

  /**
   * @deprecated use fromFormat instead
   */


  DateTime.fromString = function fromString(text, fmt) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    return DateTime.fromFormat(text, fmt, opts);
  };

  /**
   * Create a DateTime from a SQL date, time, or datetime
   * Defaults to en-US if no locale has been specified, regardless of the system's locale
   * @param {string} text - the string to parse
   * @param {Object} options - options to affect the creation
   * @param {string|Zone} [options.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [options.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [options.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} options.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @example DateTime.fromSQL('2017-05-15')
   * @example DateTime.fromSQL('2017-05-15 09:12:34')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
   * @example DateTime.fromSQL('09:12:34.342')
   * @return {DateTime}
   */


  DateTime.fromSQL = function fromSQL(text) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _parseSQL = parseSQL(text),
        vals = _parseSQL[0],
        parsedZone = _parseSQL[1];

    return parseDataToDateTime(vals, parsedZone, options);
  };

  /**
   * Create an invalid DateTime.
   * @return {DateTime}
   */


  DateTime.invalid = function invalid(reason) {
    if (!reason) {
      throw new InvalidArgumentError('need to specify a reason the DateTime is invalid');
    }
    if (Settings.throwOnInvalid) {
      throw new InvalidDateTimeError(reason);
    } else {
      return new DateTime({ invalidReason: reason });
    }
  };

  // INFO

  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example DateTime.local(2017, 7, 4).get('month'); //=> 7
   * @example DateTime.local(2017, 7, 4).get('day'); //=> 4
   * @return {number}
   */


  DateTime.prototype.get = function get$$1(unit) {
    return this[unit];
  };

  /**
   * Returns whether the DateTime is valid. Invalid DateTimes occur when:
   * * The DateTime was created from invalid calendar information, such as the 13th month or February 30
   * * The DateTime was created by an operation on another invalid date
   * @type {boolean}
   */


  /**
   * Returns the resolved Intl options for this DateTime.
   * This is useful in understanding the behavior of formatting methods
   * @param {Object} opts - the same options as toLocaleString
   * @return {Object}
   */
  DateTime.prototype.resolvedLocaleOpts = function resolvedLocaleOpts() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _Formatter$create$res = Formatter.create(this.loc.clone(opts), opts).resolvedOptions(this),
        locale = _Formatter$create$res.locale,
        numberingSystem = _Formatter$create$res.numberingSystem,
        calendar = _Formatter$create$res.calendar;

    return { locale: locale, numberingSystem: numberingSystem, outputCalendar: calendar };
  };

  // TRANSFORM

  /**
   * "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
   *
   * Equivalent to {@link setZone}('utc')
   * @param {number} [offset=0] - optionally, an offset from UTC in minutes
   * @param {Object} [opts={}] - options to pass to `setZone()`
   * @return {DateTime}
   */


  DateTime.prototype.toUTC = function toUTC() {
    var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return this.setZone(FixedOffsetZone.instance(offset), opts);
  };

  /**
   * "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
   *
   * Equivalent to `setZone('local')`
   * @return {DateTime}
   */


  DateTime.prototype.toLocal = function toLocal() {
    return this.setZone(new LocalZone());
  };

  /**
   * "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
   *
   * By default, the setter keeps the underlying time the same (as in, the same UTC timestamp), but the new instance will report different local times and consider DSTs when making computations, as with {@link plus}. You may wish to use {@link toLocal} and {@link toUTC} which provide simple convenience wrappers for commonly used zones.
   * @param {string|Zone} [zone='local'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'utc+3', or the strings 'local' or 'utc'. You may also supply an instance of a {@link Zone} class.
   * @param {Object} opts - options
   * @param {boolean} [opts.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
   * @return {DateTime}
   */


  DateTime.prototype.setZone = function setZone(zone) {
    var _ref4 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref4$keepLocalTime = _ref4.keepLocalTime,
        keepLocalTime = _ref4$keepLocalTime === undefined ? false : _ref4$keepLocalTime,
        _ref4$keepCalendarTim = _ref4.keepCalendarTime,
        keepCalendarTime = _ref4$keepCalendarTim === undefined ? false : _ref4$keepCalendarTim;

    zone = normalizeZone(zone, Settings.defaultZone);
    if (zone.equals(this.zone)) {
      return this;
    } else if (!zone.isValid) {
      return DateTime.invalid(UNSUPPORTED_ZONE);
    } else {
      var newTS = keepLocalTime || keepCalendarTime // keepCalendarTime is the deprecated name for keepLocalTime
      ? this.ts + (this.o - zone.offset(this.ts)) * 60 * 1000 : this.ts;
      return clone$1(this, { ts: newTS, zone: zone });
    }
  };

  /**
   * "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
   * @param {Object} properties - the properties to set
   * @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
   * @return {DateTime}
   */


  DateTime.prototype.reconfigure = function reconfigure() {
    var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        locale = _ref5.locale,
        numberingSystem = _ref5.numberingSystem,
        outputCalendar = _ref5.outputCalendar;

    var loc = this.loc.clone({ locale: locale, numberingSystem: numberingSystem, outputCalendar: outputCalendar });
    return clone$1(this, { loc: loc });
  };

  /**
   * "Set" the locale. Returns a newly-constructed DateTime.
   * Just a convenient alias for reconfigure({ locale })
   * @example DateTime.local(2017, 5, 25).setLocale('en-GB')
   * @return {DateTime}
   */


  DateTime.prototype.setLocale = function setLocale(locale) {
    return this.reconfigure({ locale: locale });
  };

  /**
   * "Set" the values of specified units. Returns a newly-constructed DateTime.
   * You can only set units with this method; for "setting" metadata, see {@link reconfigure} and {@link setZone}.
   * @param {Object} values - a mapping of units to numbers
   * @example dt.set({ year: 2017 })
   * @example dt.set({ hour: 8, minute: 30 })
   * @example dt.set({ weekday: 5 })
   * @example dt.set({ year: 2005, ordinal: 234 })
   * @return {DateTime}
   */


  DateTime.prototype.set = function set$$1(values) {
    if (!this.isValid) return this;

    var normalized = normalizeObject(values, normalizeUnit),
        settingWeekStuff = !isUndefined(normalized.weekYear) || !isUndefined(normalized.weekNumber) || !isUndefined(normalized.weekday);

    var mixed = void 0;
    if (settingWeekStuff) {
      mixed = weekToGregorian(Object.assign(gregorianToWeek(this.c), normalized));
    } else if (!isUndefined(normalized.ordinal)) {
      mixed = ordinalToGregorian(Object.assign(gregorianToOrdinal(this.c), normalized));
    } else {
      mixed = Object.assign(this.toObject(), normalized);

      // if we didn't set the day but we ended up on an overflow date,
      // use the last day of the right month
      if (isUndefined(normalized.day)) {
        mixed.day = Math.min(daysInMonth(mixed.year, mixed.month), mixed.day);
      }
    }

    var _objToTS3 = objToTS(mixed, this.o, this.zone),
        ts = _objToTS3[0],
        o = _objToTS3[1];

    return clone$1(this, { ts: ts, o: o });
  };

  /**
   * Add a period of time to this DateTime and return the resulting DateTime
   *
   * Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, `dt.plus({ hours: 24 })` may result in a different time than `dt.plus({ days: 1 })` if there's a DST shift in between.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @example DateTime.local().plus(123) //~> in 123 milliseconds
   * @example DateTime.local().plus({ minutes: 15 }) //~> in 15 minutes
   * @example DateTime.local().plus({ days: 1 }) //~> this time tomorrow
   * @example DateTime.local().plus({ days: -1 }) //~> this time yesterday
   * @example DateTime.local().plus({ hours: 3, minutes: 13 }) //~> in 1 hr, 13 min
   * @example DateTime.local().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 1 hr, 13 min
   * @return {DateTime}
   */


  DateTime.prototype.plus = function plus(duration) {
    if (!this.isValid) return this;
    var dur = friendlyDuration(duration);
    return clone$1(this, adjustTime(this, dur));
  };

  /**
   * Subtract a period of time to this DateTime and return the resulting DateTime
   * See {@link plus}
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   @return {DateTime}
  */


  DateTime.prototype.minus = function minus(duration) {
    if (!this.isValid) return this;
    var dur = friendlyDuration(duration).negate();
    return clone$1(this, adjustTime(this, dur));
  };

  /**
   * "Set" this DateTime to the beginning of a unit of time.
   * @param {string} unit - The unit to go to the beginning of. Can be 'year', 'month', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
   * @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
   * @return {DateTime}
   */


  DateTime.prototype.startOf = function startOf(unit) {
    if (!this.isValid) return this;
    var o = {},
        normalizedUnit = Duration.normalizeUnit(unit);
    switch (normalizedUnit) {
      case 'years':
        o.month = 1;
      // falls through
      case 'quarters':
      case 'months':
        o.day = 1;
      // falls through
      case 'weeks':
      case 'days':
        o.hour = 0;
      // falls through
      case 'hours':
        o.minute = 0;
      // falls through
      case 'minutes':
        o.second = 0;
      // falls through
      case 'seconds':
        o.millisecond = 0;
        break;
      case 'milliseconds':
        break;
      default:
        throw new InvalidUnitError(unit);
    }

    if (normalizedUnit === 'weeks') {
      o.weekday = 1;
    }

    if (normalizedUnit === 'quarters') {
      o.month = Math.floor(this.month / 3) * 3 + 1;
    }

    return this.set(o);
  };

  /**
   * "Set" this DateTime to the end (i.e. the last millisecond) of a unit of time
   * @param {string} unit - The unit to go to the end of. Can be 'year', 'month', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-03T00:00:00.000-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
   * @return {DateTime}
   */


  DateTime.prototype.endOf = function endOf(unit) {
    var _startOf$plus;

    return this.isValid ? this.startOf(unit).plus((_startOf$plus = {}, _startOf$plus[unit] = 1, _startOf$plus)).minus(1) : this;
  };

  // OUTPUT

  /**
   * Returns a string representation of this DateTime formatted according to the specified format string.
   * **You may not want this.** See {@link toLocaleString} for a more flexible formatting tool. See the documentation for the specific format tokens supported.
   * Defaults to en-US if no locale has been specified, regardless of the system's locale
   * @param {string} fmt - the format string
   * @param {Object} opts - options
   * @param {boolean} opts.round - round numerical values
   * @example DateTime.local().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
   * @example DateTime.local().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
   * @example DateTime.local().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
   * @return {string}
   */


  DateTime.prototype.toFormat = function toFormat(fmt) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return this.isValid ? Formatter.create(this.loc.redefaultToEN(), opts).formatDateTimeFromString(this, fmt) : INVALID$2;
  };

  /**
   * Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
   * The exact behavior of this method is browser-specific, but in general it will return an appropriate representation.
   * of the DateTime in the assigned locale.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param opts {Object} - Intl.DateTimeFormat constructor options
   * @example DateTime.local().toLocaleString(); //=> 4/20/2017
   * @example DateTime.local().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
   * @example DateTime.local().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
   * @example DateTime.local().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
   * @example DateTime.local().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
   * @example DateTime.local().toLocaleString({weekday: 'long', month: 'long', day: '2-digit'}); //=> 'Thu, Apr 20'
   * @example DateTime.local().toLocaleString({weekday: 'long', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit'}); //=> 'Thu, Apr 20, 11:27'
   * @example DateTime.local().toLocaleString({hour: '2-digit', minute: '2-digit'}); //=> '11:32'
   * @return {string}
   */


  DateTime.prototype.toLocaleString = function toLocaleString() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DATE_SHORT;

    return this.isValid ? Formatter.create(this.loc.clone(opts), opts).formatDateTime(this) : INVALID$2;
  };

  /**
   * Returns an array of format "parts", i.e. individual tokens along with metadata. This is allows callers to post-process individual sections of the formatted output.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
   * @param opts {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
   * @example DateTime.local().toLocaleString(); //=> [
   *                                    //=>   { type: 'day', value: '25' },
   *                                    //=>   { type: 'literal', value: '/' },
   *                                    //=>   { type: 'month', value: '05' },
   *                                    //=>   { type: 'literal', value: '/' },
   *                                    //=>   { type: 'year', value: '1982' }
   *                                    //=> ]
   */


  DateTime.prototype.toLocaleParts = function toLocaleParts() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this.isValid ? Formatter.create(this.loc.clone(opts), opts).formatDateTimeParts(this) : [];
  };

  /**
   * Returns an ISO 8601-compliant string representation of this DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @example DateTime.utc(1982, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
   * @example DateTime.local().toISO() //=> '2017-04-22T20:47:05.335-04:00'
   * @example DateTime.local().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
   * @return {string}
   */


  DateTime.prototype.toISO = function toISO() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!this.isValid) {
      return null;
    }

    return this.toISODate() + 'T' + this.toISOTime(opts);
  };

  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's date component
   * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
   * @return {string}
   */


  DateTime.prototype.toISODate = function toISODate() {
    return toTechFormat(this, 'yyyy-MM-dd');
  };

  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's week date
   * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
   * @return {string}
   */


  DateTime.prototype.toISOWeekDate = function toISOWeekDate() {
    return toTechFormat(this, "kkkk-'W'WW-c");
  };

  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's time component
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @example DateTime.utc().hour(7).minute(34).toISOTime() //=> '07:34:19.361Z'
   * @example DateTime.utc().hour(7).minute(34).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
   * @return {string}
   */


  DateTime.prototype.toISOTime = function toISOTime() {
    var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref6$suppressMillise = _ref6.suppressMilliseconds,
        suppressMilliseconds = _ref6$suppressMillise === undefined ? false : _ref6$suppressMillise,
        _ref6$suppressSeconds = _ref6.suppressSeconds,
        suppressSeconds = _ref6$suppressSeconds === undefined ? false : _ref6$suppressSeconds,
        _ref6$includeOffset = _ref6.includeOffset,
        includeOffset = _ref6$includeOffset === undefined ? true : _ref6$includeOffset;

    return toTechTimeFormat(this, { suppressSeconds: suppressSeconds, suppressMilliseconds: suppressMilliseconds, includeOffset: includeOffset });
  };

  /**
   * Returns an RFC 2822-compatible string representation of this DateTime, always in UTC
   * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
   * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
   * @return {string}
   */


  DateTime.prototype.toRFC2822 = function toRFC2822() {
    return toTechFormat(this, 'EEE, dd LLL yyyy hh:mm:ss ZZZ');
  };

  /**
   * Returns a string representation of this DateTime appropriate for use in HTTP headers.
   * Specifically, the string conforms to RFC 1123.
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
   * @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
   * @return {string}
   */


  DateTime.prototype.toHTTP = function toHTTP() {
    return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
  };

  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Date
   * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
   * @return {string}
   */


  DateTime.prototype.toSQLDate = function toSQLDate() {
    return toTechFormat(this, 'yyyy-MM-dd');
  };

  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Time
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @example DateTime.utc().toSQL() //=> '05:15:16.345'
   * @example DateTime.local().toSQL() //=> '05:15:16.345 -04:00'
   * @example DateTime.local().toSQL({ includeOffset: false }) //=> '05:15:16.345'
   * @example DateTime.local().toSQL({ includeZone: false }) //=> '05:15:16.345 America/New_York'
   * @return {string}
   */


  DateTime.prototype.toSQLTime = function toSQLTime() {
    var _ref7 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref7$includeOffset = _ref7.includeOffset,
        includeOffset = _ref7$includeOffset === undefined ? true : _ref7$includeOffset,
        _ref7$includeZone = _ref7.includeZone,
        includeZone = _ref7$includeZone === undefined ? false : _ref7$includeZone;

    return toTechTimeFormat(this, { includeOffset: includeOffset, includeZone: includeZone, spaceZone: true });
  };

  /**
   * Returns a string representation of this DateTime appropriate for use in SQL DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
   * @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeZone: false }) //=> '2014-07-13 00:00:00.000 America/New_York'
   * @return {string}
   */


  DateTime.prototype.toSQL = function toSQL() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!this.isValid) {
      return null;
    }

    return this.toSQLDate() + ' ' + this.toSQLTime(opts);
  };

  /**
   * Returns a string representation of this DateTime appropriate for debugging
   * @return {string}
   */


  DateTime.prototype.toString = function toString() {
    return this.isValid ? this.toISO() : INVALID$2;
  };

  /**
   * Returns a string representation of this DateTime appropriate for the REPL.
   * @return {string}
   */


  DateTime.prototype.inspect = function inspect() {
    if (this.isValid) {
      return 'DateTime {\n  ts: ' + this.toISO() + ',\n  zone: ' + this.zone.name + ',\n  locale: ' + this.locale + ' }';
    } else {
      return 'DateTime { Invalid, reason: ' + this.invalidReason + ' }';
    }
  };

  /**
   * Returns the epoch milliseconds of this DateTime
   * @return {number}
   */


  DateTime.prototype.valueOf = function valueOf() {
    return this.isValid ? this.ts : NaN;
  };

  /**
   * Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
   * @return {string}
   */


  DateTime.prototype.toJSON = function toJSON() {
    return this.toISO();
  };

  /**
   * Returns a Javascript object with this DateTime's year, month, day, and so on.
   * @param opts - options for generating the object
   * @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
   * @example DateTime.local().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
   * @return {Object}
   */


  DateTime.prototype.toObject = function toObject() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!this.isValid) return {};

    var base = Object.assign({}, this.c);

    if (opts.includeConfig) {
      base.outputCalendar = this.outputCalendar;
      base.numberingSystem = this.loc.numberingSystem;
      base.locale = this.loc.locale;
    }
    return base;
  };

  /**
   * Returns a Javascript Date equivalent to this DateTime.
   * @return {Date}
   */


  DateTime.prototype.toJSDate = function toJSDate() {
    return new Date(this.isValid ? this.ts : NaN);
  };

  // COMPARE

  /**
   * Return the difference between two DateTimes as a Duration.
   * @param {DateTime} otherDateTime - the DateTime to compare this one to
   * @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example
   * var i1 = DateTime.fromISO('1982-05-25T09:45'),
   *     i2 = DateTime.fromISO('1983-10-14T10:30');
   * i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
   * i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
   * i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
   * i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
   * @return {Duration}
   */


  DateTime.prototype.diff = function diff(otherDateTime) {
    var unit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'milliseconds';
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (!this.isValid || !otherDateTime.isValid) return Duration.invalid(this.invalidReason || otherDateTime.invalidReason);

    var units = maybeArray(unit).map(Duration.normalizeUnit),
        otherIsLater = otherDateTime.valueOf() > this.valueOf(),
        earlier = otherIsLater ? this : otherDateTime,
        later = otherIsLater ? otherDateTime : this,
        diffed = _diff(earlier, later, units, opts);

    return otherIsLater ? diffed.negate() : diffed;
  };

  /**
   * Return the difference between this DateTime and right now.
   * See {@link diff}
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */


  DateTime.prototype.diffNow = function diffNow() {
    var unit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'milliseconds';
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return this.diff(DateTime.local(), unit, opts);
  };

  /**
   * Return an Interval spanning between this DateTime and another DateTime
   * @param {DateTime} otherDateTime - the other end point of the Interval
   * @return {Interval}
   */


  DateTime.prototype.until = function until(otherDateTime) {
    return this.isValid ? Interval.fromDateTimes(this, otherDateTime) : this;
  };

  /**
   * Return whether this DateTime is in the same unit of time as another DateTime
   * @param {DateTime} otherDateTime - the other DateTime
   * @param {string} unit - the unit of time to check sameness on
   * @example DateTime.local().hasSame(otherDT, 'day'); //~> true if both the same calendar day
   * @return {boolean}
   */


  DateTime.prototype.hasSame = function hasSame(otherDateTime, unit) {
    if (!this.isValid) return false;
    if (unit === 'millisecond') {
      return this.valueOf() === otherDateTime.valueOf();
    } else {
      var inputMs = otherDateTime.valueOf();
      return this.startOf(unit) <= inputMs && inputMs <= this.endOf(unit);
    }
  };

  /**
   * Equality check
   * Two DateTimes are equal iff they represent the same millisecond
   * @param {DateTime} other - the other DateTime
   * @return {boolean}
   */


  DateTime.prototype.equals = function equals(other) {
    return this.isValid && other.isValid ? this.valueOf() === other.valueOf() && this.zone.equals(other.zone) && this.loc.equals(other.loc) : false;
  };

  /**
   * Return the min of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
   * @return {DateTime} the min DateTime, or undefined if called with no argument
   */


  DateTime.min = function min() {
    for (var _len = arguments.length, dateTimes = Array(_len), _key = 0; _key < _len; _key++) {
      dateTimes[_key] = arguments[_key];
    }

    return bestBy(dateTimes, function (i) {
      return i.valueOf();
    }, Math.min);
  };

  /**
   * Return the max of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
   * @return {DateTime} the max DateTime, or undefined if called with no argument
   */


  DateTime.max = function max() {
    for (var _len2 = arguments.length, dateTimes = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      dateTimes[_key2] = arguments[_key2];
    }

    return bestBy(dateTimes, function (i) {
      return i.valueOf();
    }, Math.max);
  };

  // MISC

  /**
   * Explain how a string would be parsed by fromFormat()
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see description)
   * @param {Object} options - options taken by fromFormat()
   * @return {Object}
   */


  DateTime.fromFormatExplain = function fromFormatExplain(text, fmt) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var _options$locale2 = options.locale,
        locale = _options$locale2 === undefined ? null : _options$locale2,
        _options$numberingSys2 = options.numberingSystem,
        numberingSystem = _options$numberingSys2 === undefined ? null : _options$numberingSys2,
        localeToUse = Locale.fromOpts({ locale: locale, numberingSystem: numberingSystem, defaultToEN: true });

    return explainFromTokens(localeToUse, text, fmt);
  };

  /**
   * @deprecated use fromFormatExplain instead
   */


  DateTime.fromStringExplain = function fromStringExplain(text, fmt) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    return DateTime.fromFormatExplain(text, fmt, options);
  };

  // FORMAT PRESETS

  /**
   * {@link toLocaleString} format like 10/14/1983
   * @type {Object}
   */


  createClass(DateTime, [{
    key: 'isValid',
    get: function get$$1() {
      return this.invalidReason === null;
    }

    /**
     * Returns an explanation of why this DateTime became invalid, or null if the DateTime is valid
     * @type {string}
     */

  }, {
    key: 'invalidReason',
    get: function get$$1() {
      return this.invalid;
    }

    /**
     * Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
     *
     * @type {string}
     */

  }, {
    key: 'locale',
    get: function get$$1() {
      return this.isValid ? this.loc.locale : null;
    }

    /**
     * Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
     *
     * @type {string}
     */

  }, {
    key: 'numberingSystem',
    get: function get$$1() {
      return this.isValid ? this.loc.numberingSystem : null;
    }

    /**
     * Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
     *
     * @type {string}
     */

  }, {
    key: 'outputCalendar',
    get: function get$$1() {
      return this.isValid ? this.loc.outputCalendar : null;
    }

    /**
     * Get the name of the time zone.
     * @type {string}
     */

  }, {
    key: 'zoneName',
    get: function get$$1() {
      return this.isValid ? this.zone.name : null;
    }

    /**
     * Get the year
     * @example DateTime.local(2017, 5, 25).year //=> 2017
     * @type {number}
     */

  }, {
    key: 'year',
    get: function get$$1() {
      return this.isValid ? this.c.year : NaN;
    }

    /**
     * Get the quarter
     * @example DateTime.local(2017, 5, 25).quarter //=> 2
     * @type {number}
     */

  }, {
    key: 'quarter',
    get: function get$$1() {
      return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
    }
    /**
     * Get the month (1-12).
     * @example DateTime.local(2017, 5, 25).month //=> 5
     * @type {number}
     */

  }, {
    key: 'month',
    get: function get$$1() {
      return this.isValid ? this.c.month : NaN;
    }

    /**
     * Get the day of the month (1-30ish).
     * @example DateTime.local(2017, 5, 25).day //=> 25
     * @type {number}
     */

  }, {
    key: 'day',
    get: function get$$1() {
      return this.isValid ? this.c.day : NaN;
    }

    /**
     * Get the hour of the day (0-23).
     * @example DateTime.local(2017, 5, 25, 9).hour //=> 9
     * @type {number}
     */

  }, {
    key: 'hour',
    get: function get$$1() {
      return this.isValid ? this.c.hour : NaN;
    }

    /**
     * Get the minute of the hour (0-59).
     * @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
     * @type {number}
     */

  }, {
    key: 'minute',
    get: function get$$1() {
      return this.isValid ? this.c.minute : NaN;
    }

    /**
     * Get the second of the minute (0-59).
     * @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
     * @type {number}
     */

  }, {
    key: 'second',
    get: function get$$1() {
      return this.isValid ? this.c.second : NaN;
    }

    /**
     * Get the millisecond of the second (0-999).
     * @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
     * @type {number}
     */

  }, {
    key: 'millisecond',
    get: function get$$1() {
      return this.isValid ? this.c.millisecond : NaN;
    }

    /**
     * Get the week year
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2014, 11, 31).weekYear //=> 2015
     * @type {number}
     */

  }, {
    key: 'weekYear',
    get: function get$$1() {
      return this.isValid ? possiblyCachedWeekData(this).weekYear : NaN;
    }

    /**
     * Get the week number of the week year (1-52ish).
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
     * @type {number}
     */

  }, {
    key: 'weekNumber',
    get: function get$$1() {
      return this.isValid ? possiblyCachedWeekData(this).weekNumber : NaN;
    }

    /**
     * Get the day of the week.
     * 1 is Monday and 7 is Sunday
     * @see https://en.wikipedia.org/wiki/ISO_week_date
     * @example DateTime.local(2014, 11, 31).weekday //=> 4
     * @type {number}
     */

  }, {
    key: 'weekday',
    get: function get$$1() {
      return this.isValid ? possiblyCachedWeekData(this).weekday : NaN;
    }

    /**
     * Get the ordinal (i.e. the day of the year)
     * @example DateTime.local(2017, 5, 25).ordinal //=> 145
     * @type {number|DateTime}
     */

  }, {
    key: 'ordinal',
    get: function get$$1() {
      return this.isValid ? gregorianToOrdinal(this.c).ordinal : NaN;
    }

    /**
     * Get the human readable short month name, such as 'Oct'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
     * @type {string}
     */

  }, {
    key: 'monthShort',
    get: function get$$1() {
      return this.isValid ? Info.months('short', { locale: this.locale })[this.month - 1] : null;
    }

    /**
     * Get the human readable long month name, such as 'October'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).monthLong //=> October
     * @type {string}
     */

  }, {
    key: 'monthLong',
    get: function get$$1() {
      return this.isValid ? Info.months('long', { locale: this.locale })[this.month - 1] : null;
    }

    /**
     * Get the human readable short weekday, such as 'Mon'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
     * @type {string}
     */

  }, {
    key: 'weekdayShort',
    get: function get$$1() {
      return this.isValid ? Info.weekdays('short', { locale: this.locale })[this.weekday - 1] : null;
    }

    /**
     * Get the human readable long weekday, such as 'Monday'.
     * Defaults to the system's locale if no locale has been specified
     * @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
     * @type {string}
     */

  }, {
    key: 'weekdayLong',
    get: function get$$1() {
      return this.isValid ? Info.weekdays('long', { locale: this.locale })[this.weekday - 1] : null;
    }

    /**
     * Get the UTC offset of this DateTime in minutes
     * @example DateTime.local().offset //=> -240
     * @example DateTime.utc().offset //=> 0
     * @type {number}
     */

  }, {
    key: 'offset',
    get: function get$$1() {
      return this.isValid ? this.zone.offset(this.ts) : NaN;
    }

    /**
     * Get the short human name for the zone's current offset, for example "EST" or "EDT".
     * Defaults to the system's locale if no locale has been specified
     * @type {string}
     */

  }, {
    key: 'offsetNameShort',
    get: function get$$1() {
      if (this.isValid) {
        return this.zone.offsetName(this.ts, {
          format: 'short',
          locale: this.locale
        });
      } else {
        return null;
      }
    }

    /**
     * Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
     * Defaults to the system's locale if no locale has been specified
     * @type {string}
     */

  }, {
    key: 'offsetNameLong',
    get: function get$$1() {
      if (this.isValid) {
        return this.zone.offsetName(this.ts, {
          format: 'long',
          locale: this.locale
        });
      } else {
        return null;
      }
    }

    /**
     * Get whether this zone's offset ever changes, as in a DST.
     * @type {boolean}
     */

  }, {
    key: 'isOffsetFixed',
    get: function get$$1() {
      return this.isValid ? this.zone.universal : null;
    }

    /**
     * Get whether the DateTime is in a DST.
     * @type {boolean}
     */

  }, {
    key: 'isInDST',
    get: function get$$1() {
      if (this.isOffsetFixed) {
        return false;
      } else {
        return this.offset > this.set({ month: 1 }).offset || this.offset > this.set({ month: 5 }).offset;
      }
    }

    /**
     * Returns true if this DateTime is in a leap year, false otherwise
     * @example DateTime.local(2016).isInLeapYear //=> true
     * @example DateTime.local(2013).isInLeapYear //=> false
     * @type {boolean}
     */

  }, {
    key: 'isInLeapYear',
    get: function get$$1() {
      return isLeapYear(this.year);
    }

    /**
     * Returns the number of days in this DateTime's month
     * @example DateTime.local(2016, 2).daysInMonth //=> 29
     * @example DateTime.local(2016, 3).daysInMonth //=> 31
     * @type {number}
     */

  }, {
    key: 'daysInMonth',
    get: function get$$1() {
      return daysInMonth(this.year, this.month);
    }

    /**
     * Returns the number of days in this DateTime's year
     * @example DateTime.local(2016).daysInYear //=> 366
     * @example DateTime.local(2013).daysInYear //=> 365
     * @type {number}
     */

  }, {
    key: 'daysInYear',
    get: function get$$1() {
      return this.isValid ? daysInYear(this.year) : NaN;
    }
  }], [{
    key: 'DATE_SHORT',
    get: function get$$1() {
      return DATE_SHORT;
    }

    /**
     * {@link toLocaleString} format like 'Oct 14, 1983'
     * @type {Object}
     */

  }, {
    key: 'DATE_MED',
    get: function get$$1() {
      return DATE_MED;
    }

    /**
     * {@link toLocaleString} format like 'October 14, 1983'
     * @type {Object}
     */

  }, {
    key: 'DATE_FULL',
    get: function get$$1() {
      return DATE_FULL;
    }

    /**
     * {@link toLocaleString} format like 'Tuesday, October 14, 1983'
     * @type {Object}
     */

  }, {
    key: 'DATE_HUGE',
    get: function get$$1() {
      return DATE_HUGE;
    }

    /**
     * {@link toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'TIME_SIMPLE',
    get: function get$$1() {
      return TIME_SIMPLE;
    }

    /**
     * {@link toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'TIME_WITH_SECONDS',
    get: function get$$1() {
      return TIME_WITH_SECONDS;
    }

    /**
     * {@link toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'TIME_WITH_SHORT_OFFSET',
    get: function get$$1() {
      return TIME_WITH_SHORT_OFFSET;
    }

    /**
     * {@link toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'TIME_WITH_LONG_OFFSET',
    get: function get$$1() {
      return TIME_WITH_LONG_OFFSET;
    }

    /**
     * {@link toLocaleString} format like '09:30', always 24-hour.
     * @type {Object}
     */

  }, {
    key: 'TIME_24_SIMPLE',
    get: function get$$1() {
      return TIME_24_SIMPLE;
    }

    /**
     * {@link toLocaleString} format like '09:30:23', always 24-hour.
     * @type {Object}
     */

  }, {
    key: 'TIME_24_WITH_SECONDS',
    get: function get$$1() {
      return TIME_24_WITH_SECONDS;
    }

    /**
     * {@link toLocaleString} format like '09:30:23 EDT', always 24-hour.
     * @type {Object}
     */

  }, {
    key: 'TIME_24_WITH_SHORT_OFFSET',
    get: function get$$1() {
      return TIME_24_WITH_SHORT_OFFSET;
    }

    /**
     * {@link toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
     * @type {Object}
     */

  }, {
    key: 'TIME_24_WITH_LONG_OFFSET',
    get: function get$$1() {
      return TIME_24_WITH_LONG_OFFSET;
    }

    /**
     * {@link toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'DATETIME_SHORT',
    get: function get$$1() {
      return DATETIME_SHORT;
    }

    /**
     * {@link toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'DATETIME_SHORT_WITH_SECONDS',
    get: function get$$1() {
      return DATETIME_SHORT_WITH_SECONDS;
    }

    /**
     * {@link toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'DATETIME_MED',
    get: function get$$1() {
      return DATETIME_MED;
    }

    /**
     * {@link toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'DATETIME_MED_WITH_SECONDS',
    get: function get$$1() {
      return DATETIME_MED_WITH_SECONDS;
    }

    /**
     * {@link toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'DATETIME_FULL',
    get: function get$$1() {
      return DATETIME_FULL;
    }

    /**
     * {@link toLocaleString} format like 'October 14, 1983, 9:303 AM EDT'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'DATETIME_FULL_WITH_SECONDS',
    get: function get$$1() {
      return DATETIME_FULL_WITH_SECONDS;
    }

    /**
     * {@link toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'DATETIME_HUGE',
    get: function get$$1() {
      return DATETIME_HUGE;
    }

    /**
     * {@link toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
     * @type {Object}
     */

  }, {
    key: 'DATETIME_HUGE_WITH_SECONDS',
    get: function get$$1() {
      return DATETIME_HUGE_WITH_SECONDS;
    }
  }]);
  return DateTime;
}();
function friendlyDateTime(dateTimeish) {
  if (dateTimeish instanceof DateTime) {
    return dateTimeish;
  } else if (dateTimeish.valueOf && isNumber(dateTimeish.valueOf())) {
    return DateTime.fromJSDate(dateTimeish);
  } else if (dateTimeish instanceof Object) {
    return DateTime.fromObject(dateTimeish);
  } else {
    throw new InvalidArgumentError('Unknown datetime argument');
  }
}

exports.DateTime = DateTime;
exports.Duration = Duration;
exports.Interval = Interval;
exports.Info = Info;
exports.Zone = Zone;
exports.Settings = Settings;


},{}]},{},[1]);
