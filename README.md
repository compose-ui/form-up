# FormUp

A lightwight HTML5 form validation module.

### `watch()` - Automatic

FormUp can watch for form submission events and stop them and style invalid
inputs, and add messages if the form is invalid. This will also watch for
input changes and update validation styles when the user interacts.

Here's what that looks like.

```js
var formUp = require( 'compose-form-up' )
formUp.watch()
```

### `validate( form )` - Manual

This component works best automatically, but if for some reason you have to
manually trigger validation, you'd do this.

```js
var formUp = require( 'compose-form-up' )
var form = document.querySelector( '#your-form' )

if ( formUp.validate( form ) ) {
  // Form is valid  
} else {
  // For is not valid
}
```

Here, `formUp.validate( form )` will return `true` or `false` based on the forms
validity. It will set custom messages and style invalid inputs. However, to clear
invalid styles you'll need to run this any time a form element is updated.
