var u = require('./_utils.js')

describe('Progressive form', () => {
  beforeAll(async () => {
    await page.goto("http://localhost:8081/labels.html")
  })

  it('Has labels', async () => {
    expect( await page.evaluate( 'FormUp.getLabel.text( "#input-1" )' )).toBe( 'First input' )
    expect( await page.evaluate( 'FormUp.getLabel.text( "#input-2" )' )).toBe( 'Second input' )
    expect( await page.evaluate( 'FormUp.getLabel.text( "#input-3" )' )).toBe( 'Third input' )
    expect( await page.evaluate( 'FormUp.getLabel.text( "#input-4" )' )).toBe( 'Text w/ label' )
  })
})
