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
- `data-invalid-value="superman"` - Superman cannot be entered.
- `data-invalid-value-message="Invalid value: superman"` - Sets a custom error message when a value matching the `data-invalid-value` is set.


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

### Handling the next event

```js
var formUp = require( 'compose-form-up' )

var form = document.querySelector( '#some-form' )

formUp.next( form, function( event, step ) {

  // event is the submission event

  // step.forward() - go to the next step
  // step.back()    - return to this step
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
