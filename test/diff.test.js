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

  it( 'does something', async () => {
    await expect( page ).toFill( '#input-1', 'another value' )
    await u.findElement( '.changed-value', { value: 'another value' } )
    //console.log( await u.html( '#form-diff' ) )
  })

})
