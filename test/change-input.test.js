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

  it( 'detects changed inputs', async () => {
    await u.isNull( '.input-changed' )
    await expect( page ).toFill( '#input-1', 'another value' )
    await u.findElement( '.input-changed', { value: 'another value' } )
    await u.findElement( 'label.input-changed', { text: 'First input' } )

    await expect( page ).toFill( '#input-1', 'initial value' )
    await u.isNull( '.input-changed' )
  })

  it( 'adds an "empty" class to inputs with no value', async () => {
    await u.findElement( '#input-2.empty' )
  })

  it( 'adds change class to label connected by a for attribute', async () => {
    await u.isNull( '.input-changed' )
    await expect( page ).toFill( '#input-2', '2' )
    await u.findElement( 'label[for="input-2"].input-changed' )
  })

  it( 'detects changes to a select', async () => {
    await u.isNull( '#select-input.input-changed' )

    await expect( page ).toSelect( '#select-input', '1' )
    await u.findElement( '#select-input.input-changed' )

    await expect( page ).toSelect( '#select-input', '0' )
    await u.isNull( '#select-input.input-changed' )
  })

  it( 'detects changes to a textarea', async () => {
    await u.isNull( '#textarea.input-changed' )

    await expect( page ).toFill( '#text-area', 'New content' )
    await u.findElement( '#text-area.input-changed' )

    await expect( page ).toFill( '#text-area', '" \'this \'is in here< asdf& ;asdf> "' )
    await u.isNull( '#textarea.input-changed' )
  })

  it( 'detects changes to a radio input', async () => {
    await u.isNull( '[type="radio"].input-changed' )

    await expect( page ).toClick( '#radio-2' )
    await u.findElement( '#radio-1.input-changed' )
    await u.isNull( '#radio-3.input-changed' )

    await expect( page ).toClick( '#radio-1' )
    await u.isNull( '#radio-1.input-changed' )
    await u.isNull( '#radio-2.input-changed' )
  })

  it( 'detects changes to a checkbox', async () => {
    await u.isNull( '#checkbox.input-changed' )

    await expect( page ).toClick( '#checkbox' )
    await u.findElement( '#checkbox.input-changed' )

    await expect( page ).toClick( '#checkbox' )
    await u.isNull( '#checkbox.input-changed' )
  })
})
