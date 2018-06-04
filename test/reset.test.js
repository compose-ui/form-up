var u = require('./_utils.js')
const log = function(a){
  console.log(a)
}

describe( 'Progressive form', () => {
  beforeAll( async () => {
    await page.goto( "http://localhost:8081/reset.html" )

    await page.exposeFunction( 'log', text =>
      log(text)
    )
  })

  it( 'resets a text input', async () => {
    await expect( page ).toFill( '#input-1', 'another value' )
    await u.findElement( '#input-1', { value: 'another value' } )
    await u.click( 'a.reset-1' )

    await u.findElement( '#input-1', { value: 'initial value' } )
  })

  it( 'resets a select', async () => {
    await expect( page ).toSelect( '#input-2', '1' )
    await u.findElement( '#input-2', { value: '1' } )
    await u.click( 'a.reset-2' )

    await u.findElement( '#input-2', { value: '0' })
  })

  it( 'resets two inputs', async () => {
    await expect( page ).toFill( '#multi-input-1', 'another value' )
    await expect( page ).toSelect( '#multi-input-2', '1' )
    await u.findElement( '#multi-input-1', { value: 'another value' })
    await u.findElement( '#multi-input-2', { value: '1' } )
    await u.click( 'a.reset-3' )

    await u.findElement( '#multi-input-1', { value: 'initial value' } )
    await u.findElement( '#multi-input-2', { value: '0' } )
  })


  it( 'triggers input events when resetting a form', async () => {
    await expect( page ).toFill( '#input-1', 'another value' )
    await expect( page ).toSelect( '#input-2', '1' )
    await expect( page ).toFill( '#multi-input-1', 'another value' )
    await expect( page ).toSelect( '#multi-input-2', '1' )

    await u.findElement( '.changed-value' )

    await u.click( '[type=reset]' )
    await u.wait( 100 )

    await u.isNull( '.changed-value' )
  })

  //TODO: write tests for restoring default for a single input
  //TODO: write tests for restoring default for a nested input
  //TODO: restore default points to the label (or something)
})
