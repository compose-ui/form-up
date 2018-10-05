var u = require('./_utils.js')

const log = function(a){
  if ( typeof a == 'object' ) { a = JSON.stringify( a ) }
  console.log(a)
}

describe('Number input', () => {
  beforeAll(async () => {
    await page.goto("http://localhost:8081/number-input.html")

    await page.exposeFunction( 'log', text =>
      log(text)
    )
  })

  it('rounds numbers', async () => {
    await expect( page ).toFill( '#input-1', '1.6' )
    await u.wait(50)
    await u.matchValue( '#input-1', '1.5' )

    await expect( page ).toFill( '#input-2', '1.69' )
    await u.wait(50)
    await u.matchValue( '#input-2', '1.75' )

    await expect( page ).toFill( '#input-1', '1000.69' )
    await u.wait(50)
    await u.matchValue( '#input-1', '100' )
  })
})
