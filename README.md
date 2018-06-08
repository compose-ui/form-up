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
- `data-validate-time="true"` - Ensure that input is a valid date string.
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

```html
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

## Form Diff

Add a `data-diff-target='#selector'` to your `<form>` element to have formUp automatically generate a form diff whenever input values
are changed in your form. Here's some example html.

```html
<form data-diff-target='#form-diff'>…<form>

<div id='form-diff'></div>
```

When an input is changed, a table is created with changed form input values like this.

|-------------|---------------|----|---------------|-----|
| input label | initial value | -> | current value | (x) |

Users can click the `(x)` button to reset the input to its initial value.

The input label is derived based on the first successful attempt from these conditions:

- The value of an input's `aria-label` property
- The combined `textContent` of any elements referenced by the input's `aria-labelledby` property.
- `textContent` from a `<label>` element which wraps the input.
- A `<label>` element which points to the input's id using its `for` attribute.
- The value of an input's `placeholder` attribute.
- The value of an input's `name` attribute.

#### Examples of how you might label your input.

```html
<!-- Input label will be "Your Comment" -->
<textarea aria-label="Your Comment" …></textarea>
```

```html
<!-- Input label will be "Street Address" -->
<h3 id="address-title">Address</h3>

<div>
  <label id="street-label">Street</label>
  <input aria-labelledby="street-label address-title" …>
</div>
```

```html
<!-- Input label will be "Your Name" -->
<label>
  <span>Your Name</span>
  <input …>
</label>
```

```html
<!-- Input label will be "Your Name" -->
<label for="name">Your Name</label>
<input id="name" …>
```

```html
<!-- Input label will be "Postal code" -->
<input placeholder="Postal code" …>
```

### Diff note

Add `diff-note="Your message"` to an input to display a note by its diff. For example:

```html
<input name='address' diff-note='( affects shipping estimate )'…>
```

This will add a note next to the input's label in the diff table.

|-------------|---------------|----|---------------|-----|
| address ( affects shipping estimate ) | initial value | -> | current value | (x) |

This will create a `<span class='diff-note'>` element inside the label.


### Diff class

Add `diff-class="some-classname"` to an input to add a classname to the table row for that input's diff.

```html
<input name='enabled' type='checkbox' diff-class='destructive-change'…>
```

This will add a `.destructive-change` class name to the `tr.input-diff` element.

### Hide when empty

It may be helpful to hide some elements when a diff table is empty. Add a `data-hide-when-empty='#selector'` attribute to your
form-diff target to hide other elements when the form-diff is empty.

Here's an example:

```html

<form data-diff-target='#form-diff'>–</form>

<div id='diff-summary'> <!-- This element will be hidden when the diff is empty -->

  <h3>Form Summary</h3>
  <p>These changes will be applied when you submit this form.</p>

  <div id='form-diff' data-hide-when-empty='#diff-summary'></div> <!-- This is where the diff table will be inserted -->
</div>
```

This adds a `.form-diff-empty` classname to elements matched by the selector in `data-hide-when-empty`. A `<style>` tag is added to
the head to be sure that classname will hide elements.

## Input Changes

FormUp tracks input changes and makes it easy to track which inputs in a form have changed. Inputs which have been changed from their
initial value (at page load) will receive a `changed-value` class. Their corresponding label (if any) will receive an
`input-changed-value` class.

## Reset forms and inputs

### Reset input to initial value

When a page is loaded, form elements store their initial value as a `data-initial-value` property.

```html
<a href='#' data-reset-input='#your-name'>Reset Name</a>
```

An element with a `data-reset-input='#selector'` will reset an input to its initial value when clicked. 

### Restore inputs to default value

If you have an input which has some natural default state, you can track that by adding a `data-default='default value'` property.

```html
<a href='#' data-restore-default='#config-input'>Reset config to default</a>
```

An element with a `data-restore-default='#selector'` will reset an input to its default value when clicked. 


### Resetting an entire form

When a form is reset using an `<input type='reset'>` button, typically no events fire on the inputs. If you're tracking changes to
inputs, this can be a problem. Using FormUp will cause `input` events to fire on each input which has been changed whenever a form is
reset.

## Get label

This is a utility function for making it simple to get a reference to the label that corresponds to an input.

```javascript
// Returns a DOM reference to a label (if it can find one)
formUp.getLabel( input ) // accepts a DOM reference or selector
```

To get the label, `getLabel` looks at:

- DOM heirarchy (is the input inside a label element)
- Queries for `[for="input.id"]` to find labels linked by the `for` property.


If you wan to get a text label to describe an input, use `getLabel.text( input )`

```javascript
formUp.getLabel.text( input ) // accepts a DOM reference or selector
```

This returns text from the:

- label's text (found by `getLabel`)
- Value from the `aria-label` property
- Combines text from elements matched by the `aria-labelledby` selector
- or uses the input `name` property if it cannot find a label

