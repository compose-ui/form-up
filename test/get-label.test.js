var u = require('./_utils.js')

const log = function(a){
  if ( typeof a == 'object' ) { a = JSON.stringify( a ) }
  console.log(a)
}

describe('Progressive form', () => {
  beforeAll(async () => {
    await page.goto("http://localhost:8081/labels.html")

    await page.exposeFunction( 'log', text =>
      log(text)
    )
  })

  it('gets text from label.textContent', async () => {
    expect( await page.evaluate( 'FormUp.getLabel.text( "#input-1" )' )).toBe( 'First input' )
  })

  it('gets text from `for` attribute', async () => {
    expect( await page.evaluate( 'FormUp.getLabel.text( "#input-2" )' )).toBe( 'Second input' )
  })

  it('gets text from placeholder', async () => {
    expect( await page.evaluate( 'FormUp.getLabel.text( "#input-3" )' )).toBe( 'Third input' )
  })

  it('gets text from aria-label', async () => {
    expect( await page.evaluate( 'FormUp.getLabel.text( "#input-4" )' )).toBe( 'Text w/ placeholder' )
  })

  it('gets text from aria-labelledby', async () => {
    expect( await page.evaluate( 'FormUp.getLabel.text( "#input-5" )' )).toBe( 'Phone number' )
  })

  it('gets text (in order) from aria-labelledby', async () => {
    expect( await page.evaluate( 'FormUp.getLabel.text( "#input-6" )' )).toBe( 'Street Address' )
  })

  it('gets text from a fieldset legend', async () => {
    expect( await page.evaluate( 'FormUp.getLabel.legend( "#radio-1" )' )).toBe( 'Select a choice' )
  })

  it('gets text from a radio input', async () => {
    expect( await page.evaluate( 'FormUp.getLabel.text( "#radio-1" )' )).toBe( 'Choice 1' )
  })
})
