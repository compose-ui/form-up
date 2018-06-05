var u = require('./_utils.js')
const log = function(a){
  console.log(a)
}

describe( 'Progressive form', () => {
  beforeAll( async () => {
    await page.goto( "http://localhost:8081/changes.html" )

    await page.exposeFunction( 'log', text =>
      log(text)
    )
  })

  it( 'assigns data-form-diff-id to inputs', async () => {
    await expect( page ).toFill( '#input-1', 'another value' )
    await u.findElement( '[data-form-diff-id]' )
  })

  it( 'can find elements with data-form-diff-id', async () => {
    var resetSelector = await u.data( '[data-reset-input]', 'resetInput' )
    await u.findElement( resetSelector )
  })

  // TODO: Reset an input from the form diff
  // TODO: Verify initial and new values are correct
  // TODO: Check values for multiple inputs under a label
  // TODO: Check values for radios
  // TODO: Check values for select
  // TODO: Check values for range (from Tungsten sliders)

})
