var u = require('./_utils.js')
const log = function(a){
  if ( typeof a == 'object' ) { a = JSON.stringify( a ) }
  console.log(a)
}

describe( 'Form diff', () => {
  beforeAll( async () => {
    await page.goto( "http://localhost:8081/diff.html" )

    await page.exposeFunction( 'log', text =>
      log(text)
    )
  })

  it( 'hides empty diff targets on load', async () => {
    await u.findElement( '#diff-title.form-diff-hidden' )
    await u.findElement( '#form-diff.form-diff-hidden' )
    await u.findElement( 'style#form-diff-hidden' )
  })

  it( 'assigns data-form-diff-id to inputs', async () => {
    await expect( page ).toFill( '#input-1', 'another value' )
    await u.findElement( '[data-form-diff-id]' )
  })

  it( 'can find elements with data-form-diff-id', async () => {
    var resetSelector = (await u.data( '[data-reset-input]' )).resetInput
    await u.findElement( resetSelector )
  })

  it( 'shows initial and new values in the diff', async () => {
    await expect( page ).toFill( '#input-1', 'new value' )

    await u.findElement( '.input-diff-label', { text: 'First input' })
    await u.findElement( '.input-diff-initial', { text: 'initial value' })
    await u.findElement( '.input-diff-value', { text: 'new value' })
  })

  it( 'can reset an input from the reset button and hides when empty', async () => {
    await expect( page ).toFill( '#input-1', 'some value' )
    await u.matchValue( '#input-1', 'some value' )

    await u.wait(110)

    await u.click('[data-diff-name*=input-1] button')
    await u.matchValue( '#input-1', 'initial value' )
    
    // Hides form-diff and related elements
    await u.findElement( '#form-diff.form-diff-hidden' )
    await u.findElement( '#diff-title.form-diff-hidden' )

    // Form diff is empty
    await u.isNull( '#form-diff *:first-child' )
  })

  it( 'shows multiple values under a single label', async () => {
    await u.click( '#reset' )
    await u.wait(110)

    // Change values
    await expect( page ).toSelect( '#multi-input-2', 'GB' )
    await expect( page ).toFill( '#multi-input-1', '200' )

    await u.wait(110)

    expect( await page.evaluate( "document.querySelectorAll( '#form-diff tr' ).length" )).toBe( 1 )

    // Check to be sure the diff has the correct text in it
    await u.matchText( '[data-diff-name*=multi-input-1] .input-diff-label', 'Select Size' )
    await u.matchText( '[data-diff-name*=multi-input-1] .input-diff-initial', '100 MB' )
    await u.matchText( '[data-diff-name*=multi-input-1] .input-diff-value', '200 GB' )

    // And reset it
    await u.click('[data-diff-name*=multi-input-1] button')
    await u.wait(110)

    // Ensure they are reset
    await u.matchValue( '#multi-input-2', 'MB' )
    await u.matchValue( '#multi-input-1', '100' )
  })

  it( 'shows diff for a checkbox', async () => {
    await u.click( '#checkbox' )
    await u.wait(110)

    await u.matchText( '[data-diff-name*=check-test] .input-diff-label', 'Ice cream?' )
    await u.matchText( '[data-diff-name*=check-test] .input-diff-initial', 'false' )
    await u.matchText( '[data-diff-name*=check-test] .input-diff-value', 'true' )

    await u.click( '#checkbox' )
    await u.wait(110)

    // Changing the checkbox back removes the diff element
    await u.isNull( '[data-diff-name*=check-test]' )
  })

  it( 'shows diff for a select', async () => {
    await expect( page ).toSelect( '#select-input', '1' )
    await u.wait(110)

    await u.matchText( '[data-diff-name*=select-input] .input-diff-label', 'Favorite breakfast bread' )
    await u.matchText( '[data-diff-name*=select-input] .input-diff-initial', 'no selection' )
    await u.matchText( '[data-diff-name*=select-input] .input-diff-value', 'Toast' )

  })

  it( 'shows diff notes', async () => {
    await expect( page ).toFill( '#input-2', 'Banana' )
    await expect( page ).toFill( '#multi-input-note-2', 'GB' )
    await u.wait(110)

    // Use the classname from data-diff-class
    await u.matchText( '.kraken .input-diff-label .diff-note', '(Beware the Kraken!)' )

    // This proves that setting the secondary input under a label shows the notes for all inputs
    await u.matchText( '[data-diff-name*=multi-input-note-1] .diff-note', '*causes restart' )
  })

  it( 'adds classes and proper labels for null values', async () => {
    await expect( page ).toFill( '#input-2', 'Cheese' )
    await expect( page ).toSelect( '#select-input', '0' )
    await u.wait(110)

    await u.matchText( '[data-diff-name*=input-2] td.null-value', 'null' )
    await u.matchText( '[data-diff-name*=select-input] td.null-value', 'no selection' )
  })
  
  it( 'shows custom values for fancy range inputs', async () => {
    await u.setValue( '#range-input', 3 )
    await u.wait(110)

    await u.matchText( '[data-diff-name*=range-input] .input-diff-label', 'Rate our service' )
    await u.matchText( '[data-diff-name*=range-input] .input-diff-initial', 'good' )
    await u.matchText( '[data-diff-name*=range-input] .input-diff-value', 'great' )
  })

  it( 'ignores text around the labelledby label', async() => {
    await expect( page ).toSelect( '#select-units', 'GB' )
    await u.wait(110)

    await u.matchText( '[data-diff-name*=effective_cache_size] .input-diff-label', 'effective_cache_size' )
  })

  it( 'shows only one diff for a radio group change', async() => {
    await u.reload()

    // Form diff is empty
    await u.isNull( '#form-diff *:first-child' )

    await u.click( "#radio-2" )
    await u.wait(130)

    await u.matchText( '[data-diff-name*=radio-input] .input-diff-label', 'Select a choice' )
    await u.matchText( '[data-diff-name*=radio-input] .input-diff-initial', 'Choice 1' )
    await u.matchText( '[data-diff-name*=radio-input] .input-diff-value', 'Choice 2' )

    expect( await page.evaluate( "document.querySelectorAll( '#form-diff tr' ).length" )).toBe( 1 )

  })
})
