# FormUp

A lightwight form utlitiy module.

## Validation

FormUp enhances HTML5's form validation, adding `valid` and `invalid` classes as the form is completed, and handling custom messages with a bit more finesse.

### Automatic validation

FormUp can watch for form submission events and stop them and style invalid
inputs, and add messages if the form is invalid. This will also watch for
input changes and update validation styles when the user interacts.

Here's what that looks like.

```js
var formUp = require( 'compose-form-up' )
```

Whenever `submit` is triggered on a form, validation will
automatically run, handling messages and styles.

### `validate( form )` - Manual Validation

This component works best automatically, but if for some reason you have to
manually trigger validation, you'd do this.

```js
var formUp = require( 'compose-form-up' )
var form = document.querySelector( '#your-form' )

if ( formUp.validate( form ) ) {
  // Form is valid  
} else {
  // Form is not valid
}
```

Here, `formUp.validate( form )` will return `true` or `false` based on the forms
validity. It will set custom messages and style invalid inputs. However, to clear
invalid styles you'll need to run this any time a form element is updated.


### Custom Validation Messages

Inputs can have custom validation messages with the
`data-message` attribute. 

This input uses the pattern attribute to check for a valid email address and then the `data-message` attribute to use a custom message if the field is invalid.

```
<input type="email" pattern="([^@]+@[^@]+\.[a-zA-Z]{2,}|)"
data-message="Please enter a valid email address."
required="required" value="">
```

### Custom Validation helpers

- `data-max-words="3"` - Ensure no more than 3 words are entered.
- `data-min-words="3"` - Ensure at least 3 words are entered.
- `data-before-time="YYYY-MM-DD HH:MM:SS Z"` - Ensure that a date string occurs before a certian date.
- `data-after-time="YYYY-MM-DD HH:MM:SS Z"` - Ensure that a date string occurs after a certian date.
- `data-zone="utc-5"` - Select a timezone for parsing date strings, defaults to UTC.
- `data-invalid-value="superman"` - Superman cannot be entered.
- `data-invalid-value-message="Invalid value: superman"` - Sets a custom error message when a value matching the `data-invalid-value` is set.

Using `invalidateField` you can easily invalidate a field's current value.

```js
formUp.invalidateField( element, [message] )
```

For example if you find a usename is already taken, you could invalidate the username field like this.

```js
var username = document.querySelector( 'input[name=username]' )
formUp.invalidateField( username, "Username: " + username.value + " is taken. ")
```

## Progressive Forms

A progressive form will show one fieldset at a time. Each time a submit event is triggered, the active fieldset will transition away (assuming there are no
validation errors), and the next fieldset will appear. Once all fieldsets are complete, the form will submit as usual. You can also register a callback to be
triggered at the point of each transition, to call some scrip before continuing (like an ajax call or whatever).

Here's what a simple progressive form may look like.

```html
<form id="some-form" class="progressive">

  <fieldset class="form-step">
    <!-- Some inputs -->
    <button type='submit'>Submit</button>
  </fieldset>

  <fieldset class="form-step">
    <!-- Some more inputs -->
    <button type='submit'>Submit</button>
  </fieldset>

</form>
```

### Styling fieldsets

To help with styling form steps (with transitions) these classnames are added to fieldsets to show state.

```
active    - the current step
enter     - When a step transitions in
exit      - When a step is being dismissed
completed - When a step has been filled out
```

Also `data-direction` attributes describe the direction of a transition. So you could style transitions in and out like this:

```
/* Enter animations */
.form-step.enter[data-direction=forward] { /* enter stage right */ }
.form-step.enter[data-direction=reverse] { /* enter stage left */ }

/* Exit animations */
.form-step.exit[data-direction=forward] { /* exit stage left */ }
.form-step.exit[data-direction=reverse] { /* exit stage right */ }
```

### Handling the next event

```js
var formUp = require( 'compose-form-up' )

var form = document.querySelector( '#some-form' )

formUp.next( form, function( event, step ) {

  // event is the submission event

  // step.forward() - go to the next step
  // step.dismiss() - leave the current step
  // step.revisit() - used after dismiss, return to a dismissed step (for example: to deal with an ajax error)
  // step.fieldset  - reference the current fieldset element
  // step.form      - reference to the current form element
  // step.complete  - true/false - is this the last step?
  // step.formData  - formData object for the current fieldset ( handy for ajax )

  // Example ajax
  ajax.post( '/users' )
    .send( step.formData )
    .end( function( err, response ) {

      if (!err) step.forward()  // go to the next fielset
      else      step.back()     // return to current fieldset

    })

})
```

### Fieldset Navigation

To add navigation to your progressive form, add `data-nav=true` to the form element.

Note: Users cannot use the navigation to advance forward through fieldsets witout submitting the forms.
This navigation exists to allow users to revisit any fieldset and update its information. Users can navigate to any fieldset
which has been filled out and submitted, or navigate back to the current step.

Here's an example a form with navigation

```html
<form id="some-form" class="progressive" data-nav='true'>

  <fieldset class="form-step" data-nav='1. Create Account'>
    <!-- Some inputs -->
    <button type='submit'>Submit</button>
  </fieldset>

  <fieldset class="form-step" data-nav='2. Enter Payment'>
    <!-- Some more inputs -->
    <button type='submit'>Submit</button>
  </fieldset>

</form>
```

Each fieldset can set the title for the navigation with the `data-nav` element.

This will generate navigation with this HTML:

```
<nav class='progressive-form-nav'>
  <a href="#" data-step='1'>1. Create Account</a>
  <a href="#" data-step='2'>2. Enter Payment</a>
</nav>
```

### Styling nav items

Nav items will receive classes based on their state. You can use these to style them appropriately.

```
here      - The current step
next      - All steps after the current step
previous  - All steps before the current step
completed - Any step which has been submitted (this includes current and next steps if a user has navigated back)
```

