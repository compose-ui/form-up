# FormUp

A form utlitiy module featuring simple

- Form validation
- Progressive form completion
- Fully custom Slider (range) Input 
- Input step labels (for numbers and range inputs)
- Number input bounding (min, max, and step rounding)
- Input state change tracking
- Form diffing

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

## Slider (range) inputs

Takes range inputs (sliders) and adds the features you wish they had.

[![Build Status](http://img.shields.io/travis/compose-ui/slider.svg?style=flat-square)](https://travis-ci.org/compose-ui/slider)

### Features:

- Custom values - More than numbers, creates and binds a hidden input to custom values
- Custom labels - Display labels adjacent to the slider, or update values anywhere on the page.
- Label prefixes/suffixes - Easily set units for labels.
- Line labels - Label increments with whatever values you want.
- Line marks - Add emphasis to any point(s) in your slider track.

Some things to note:

- All `input type="range"` elements will be converted into sliders.

### Usage

Enable slider watching

```js
var formUp = require( 'compose-form-up' )
formUp.slider.setup()
```

Configure your range inputs using `data-` attributes.

| Attribute | Description | Example |
|:--------|:------------|:--------|
| `name`                | Name attribute for hidden input (values set by slider)      | `name="rating"` |
| `data-values`         | Set custom values for a hidden input                        | `1,4,8,15,16,23,42` |
| `data-label`          | Label array for displaying labels. Defaults to value or data-value. To disable: `data-label='false'`. | `data-label="Poor,Fair,Good,…"` |
| `data-label-[custom]` | Add multiple labels. | `data-label-price="10,20,…"`, `data-label-plan="Bronze,Silver,…"`.|
| `data-step-label-[custom]` | An array of labels for displaying external to the slider. | `data-step-label-price` updates `data-step-label='price'` |
| `data-before-label`   | Set a label prefix                                          | `$` |
| `data-after-label`    | Set a label suffix                                          | `.00` |
| `data-before-label-[custom]`   | Set a label prefix for a custom label              | `data-before-label-price='$'` `data-before-label-plan='Plan: '` |
| `data-after-label-[custom]`    | Set a label suffix for a custom label              | `data-after-price-='.00 /month'` |
| `data-mark`           | Add a marker to highlight a slider segment (1 based index)  | `1,5,10` |
| `data-line-labels`    | Add labels inline on slider (1 based index)                 | `data-line-labels="Bronze,Silver,Gold"`, `data-line-labels="1:Bronze,2:Silver,3:Gold"` |
| `data-position-label` | Add a classname to control position ('left' => '.align-left'), default: 'right'  | `left` or `right` |


### Examples:

#### Simple: Add a label and suffix to a standard 0-100 range input

Use `data-after-label='%'` to add a suffix to the slider label.

```html
<input type="range" min="0" max="100" data-after-label="%">
```

### Custom value

Set custom values for an input. 

```html
<input type="range" data-input='rating' data-values="poor,fair,good,great">
```

This will:

- Create a new `hidden` input with `name='rating'`.
- Set the slider's attributes `min="0"` and `max="3"`, so only four choices can be selected.
- Update the value on the hidden input to the corresponding value when the slider is changed.
- Display the custom value in the slider's label.

### Turn off internal slider label

To prevent a slider from having an internal label set `data-label='false'`.

```html
<input type='range' name='rating' data-label='false'>
```

To to display labels somewhere else on the page, use a step label see below for an example of how to use step labels.

## Step Labels (for number and range inputs)

Step labels offer a way to set a label on another element 

```html
Input:
<input type='number' data-step-label-rating="Poor, Fair, Good, Great, Excellent" min='0' max='4'>

Step label element:
<span data-step-label='rating'></span>
```
The input's step label attribute, is converted to an array; `['Poor','Fair','Good','Great','Excellent']` and whenever the input is changed,
it uses the value to find the correct label in the array and updates the HTML of the `<span>`.

Since the `min` attribute is `0` the Array is zero based, and if the input value is `3`, the corresponding label will be `Great`.

The HTML for the step-label will be updated as follows.

```html
<span data-step-label='rating'>
  <span class='label-content'>Great</span>
</span>
```

Array indexes for labels are always based off of the input value minus the `min` attribute. So if your value is `50` and your min is `50`
it will select the first `0th` label in the array.

Note:
If your labels need to contain commas, you can separate step-labels with a semicolon
instead. For example: `data-step-label-cost="$10,000; $20,000; $30,000"`.

### Use slider labels and step labels

Here's an example of a slider which ties units to price, displaying units on the slider and price elsewhere on the page.

```html
<input type='range' name='units'
  data-values='1,3,5,7'
  data-before-label='scale: '
  data-step-label-price='$10,$30,$50,$70'>

<span data-step-label='price'></span>
```

This will:

- Display a label on the slider: `scale: 1`.
- Create a hidden input with `name='scale'` and set its value to `1`.
- Find elements matching `data-step-label='price'` and set its contents to: `$10`.


## Input State Changes (on range and number inputs)

If a slider or number input increases, decreases, or returns to its original value, it can update an element contents and `data-` attribute to describe the change.

```html
<span data-track-input-state='#id-of-input'></span>
```

If an input is updated this element will be udpated as follows.

```html
<span data-input-state='initial' data-track-input-state='#id-of-input'></span>
<span data-input-state='increased' data-track-input-state='#id-of-input'></span>
<span data-input-state='decreased' data-track-input-state='#id-of-input'></span>
```

This is useful to change colors or hide and show content based on slider changes. For example.

```css
[data-input-state=increased] { color: green; }
[data-input-state=decreased] { color: red; }
```

These `data-` state attributes will also be added to the input and its label parent (if it has one). For example:

```html
<label data-input-state='increased'>
  <input type='number' data-input-state='increased' … >
</label>
```

## Form Diff

First, to enable form-diff run `formUp.diff.watch()` to watch for changes to forms. Then add a `data-diff-target='#selector'` to your `<form>` element to have formUp automatically generate a form diff whenever input values
are changed in your form. Here's some example html.

```html
<form data-diff-target='#form-diff'>…<form>

<div id='form-diff'></div>
```

When an input is changed, a table is created with changed form input values like this.

| input label | initial value | | current value | reset |
|:------------|:--------------|:--:|:--------------|:---:|
| Name | Bob | -> | Robert | (x) |

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

```html
<!-- Input label will be "street_address" -->
<input name="street_address" …>
```

### Diff note

Add `diff-note="Your message"` to an input to display a note by its diff. For example:

```html
<input name='zipcode' diff-note='( affects shipping estimate )'…>
```

This will add a note next to the input's label in the diff table.

| input label | initial value | | current value | reset |
|:------------|:--------------|:--:|:--------------|:---:|
| zipcode ( affects shipping estimate ) | 31249 | -> | 31281 | (x) |

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

- The value of an input's `aria-label` property
- The combined `textContent` of any elements referenced by the input's `aria-labelledby` property.
- `textContent` from a `<label>` element which wraps the input.
- A `<label>` element which points to the input's id using its `for` attribute.
- The value of an input's `placeholder` attribute.

For radio buttons grouped underneath a `<fieldset>`, you can get the text for the legend using `getLabel.legend( #some-radio-input )`.
