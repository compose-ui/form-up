var u = require('./_utils.js')
const log = function(a){
  console.log(a)
}

beforeAll( async () => {
  await page.goto( "http://localhost:8081/reset.html" )
  await page.setViewport({ height: 1024, width: 1024 })

  await page.exposeFunction( 'log', text =>
    log(text)
  )
})

describe( 'Input reset', () => {
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
})

describe( 'Form reset', () => {
  it( 'triggers input events when resetting a form', async () => {
    await expect( page ).toFill( '#input-1', 'another value' )
    await expect( page ).toSelect( '#input-2', '1' )
    await expect( page ).toFill( '#multi-input-1', 'another value' )
    await expect( page ).toSelect( '#multi-input-2', '1' )

    await u.findElement( '.changed-value' )

    await u.click( '[type=reset]' )
    await u.wait( 120 )

    await u.isNull( '.changed-value' )
  })
})

describe( 'Restore default', () => {
  it( 'restores default for a text input', async () => {
    await expect( page ).toFill( '#input-1', 'another value' )
    await u.matchValue( '#input-1', 'another value' )
    await u.click( '#default-1' )

    await u.matchValue( '#input-1', 'default value' )
  })

  it( 'restores default for a select', async () => {
    await expect( page ).toSelect( '#input-2', '0' )
    await u.click( '#default-2' )

    await u.matchValue( '#input-2', '1' )
  })

  it( 'restores default for a radio input', async () => {
    await u.click( '#radio-2' )
    await u.findElement( '#radio-2', { checked: 'checked' } )
    await u.click( '#default-3' )

    await u.findElement( '#radio-3', { checked: 'checked' } )
  })

  it( 'restores default for nested inputs', async () => {
    await u.click( '#radio-2' )
    await u.findElement( '#radio-2', { checked: 'checked' } )
    await u.click( '#default-4' )

    await u.findElement( '#radio-3.defaulted-value', { checked: 'checked' } )
  })

  it( "restores a form's nested inputs", async () => {
    await u.click( '#radio-2' )
    await u.type( '#input-1', 'another value' )
    await u.type( '#multi-input-1', 'another value' )
    await expect( page ).toSelect( '#input-2', '0' )

    await u.click( '#default-5' )

    await u.matchValue( '#input-1.defaulted-value', 'default value' )
    await u.matchValue( '#input-2.defaulted-value', '1' )
    await u.matchValue( '#multi-input-1', 'defaulted value' )
    await u.findElement( '#radio-3.defaulted-value', { checked: 'checked' } )
  })

  it( "removes defaulted classnames on an input change", async () => {
    await u.reload()
    await u.click( '#default-1' )

    await u.matchValue( '#input-1.defaulted-value', 'default value' )
    await u.findElement( 'label[for="input-1"].input-defaulted-value' )

    await u.type( '#input-1', 'another value' )
    await u.isNull( 'label[for="input-1"].input-defaulted-value' )
    await u.isNull( '#input-1.defaulted-value' )
  })
})
