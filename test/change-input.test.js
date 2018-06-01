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
    await u.isNull( '.changed-value' )
    await expect( page ).toFill( '#input-1', 'another value' )
    await u.findElement( '.changed-value', { value: 'another value' } )
    await u.findElement( 'label.input-changed-value', { text: 'First input' } )

    await expect( page ).toFill( '#input-1', 'initial value' )
    await u.isNull( '.changed-value' )
  })

  it( 'adds an "empty" class to inputs with no value', async () => {
    await u.findElement( '#input-2.empty' )
  })

  it( 'adds change class to label connected by a for attribute', async () => {
    await u.isNull( '.changed-value' )
    await expect( page ).toFill( '#input-2', '2' )
    await u.findElement( 'label[for="input-2"].input-changed-value' )
  })

  it( 'detects changes to a select', async () => {
    await u.isNull( '#select-input.changed-value' )

    await expect( page ).toSelect( '#select-input', '1' )
    await u.findElement( '#select-input.changed-value' )

    await expect( page ).toSelect( '#select-input', '0' )
    await u.isNull( '#select-input.changed-value' )
  })

  it( 'detects changes to a textarea', async () => {
    await u.isNull( '#textarea.changed-value' )

    await expect( page ).toFill( '#text-area', 'New content' )
    await u.findElement( '#text-area.changed-value' )

    await expect( page ).toFill( '#text-area', '" \'this \'is in here< asdf& ;asdf> "' )
    await u.isNull( '#textarea.changed-value' )
  })

  it( 'detects changes to a radio input', async () => {
    await u.isNull( '[type="radio"].changed-value' )

    await expect( page ).toClick( '#radio-2' )
    await u.findElement( '#radio-1.changed-value' )
    await u.isNull( '#radio-3.changed-value' )

    await expect( page ).toClick( '#radio-1' )
    await u.isNull( '#radio-1.changed-value' )
    await u.isNull( '#radio-2.changed-value' )
  })

  it( 'detects changes to a checkbox', async () => {
    await u.isNull( '#checkbox.changed-value' )

    await expect( page ).toClick( '#checkbox' )
    await u.findElement( '#checkbox.changed-value' )

    await expect( page ).toClick( '#checkbox' )
    await u.isNull( '#checkbox.changed-value' )
  })

  //TODO: test multiple inputs under a single label
})
