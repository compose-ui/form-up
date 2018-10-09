var u = require('./_utils.js')

const log = function(a){
  if ( typeof a == 'object' ) { a = JSON.stringify( a ) }
  console.log(a)
}

describe('Number input', () => {
  beforeAll(async () => {
    await page.goto("http://localhost:8081/external-labels.html")

    await page.exposeFunction( 'log', text =>
      log(text)
    )
  })

  it('has a default label', async () => {
    await u.matchText( '#input-1-label .label-content', 'A' )
  })

  it('sets a label', async () => {
    await expect( page ).toFill( '#input-1', '1.25' )
    await u.wait(100)
    await u.matchText( '#input-1-label .label-content', 'B' )

    await expect( page ).toFill( '#input-1', '1.5' )
    await u.wait(100)
    await u.matchText( '#input-1-label .label-content', 'C' )
  })
})
