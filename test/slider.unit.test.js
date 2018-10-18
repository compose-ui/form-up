var u = require('./_utils.js')
var helpers = require('../lib/slider/helpers')
var template = require('../lib/slider/template')

const log = function(a){
  console.log(a)
}

// Unit tests
describe('Slider Helpers', () => {
  it('sets values', async () => {
    expect( helpers.getValues(0,10) ).toMatchObject( {"0": 0, "1": 1, "10": 10, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9} ) 
    expect( helpers.getValues(0,10,null,2) ).toMatchObject( {"0": 0, "10": 10, "2": 2, "4": 4, "6": 6, "8": 8} ) 
    expect( helpers.getValues(0,100,'a,b,c,d,e') ).toMatchObject( {"0": "a", "1": "b", "2": "c", "3": "d", "4": "e"} ) 
  })

  it('gets labels', async () => {
    expect( helpers.getLabels( { test: 'a, b, c' }, { min: 0, max: 2, step: 1 } )).toMatchObject( { test: {"0": "a", "1": "b", "2": "c"}} ) 
    expect( helpers.getLabels( { default: 'a,b,c'}, { min: 0, max: 2, step: 1} )).toMatchObject( { default: {"0": "a", "1": "b", "2": "c"} } ) 
    expect( helpers.getLabels( { default: 'none'}, { min: 0, max: 2, step: 1 } )).toBe( false ) 
  })

  it('gets line labels', async () => {
    expect( helpers.getLineLabels( '1:hi;2:yo;howdy' ) ).toMatchObject( {"1": "hi", "2": "yo", "3": "howdy"} ) 
    expect( helpers.getLineLabels( 'hi,yo,howdy' ) ).toMatchObject( {"1": "hi", "2": "yo", "3": "howdy"} ) 
    expect( helpers.getLineLabels( 'hi,yo,5:howdy' ) ).toMatchObject( {"1": "hi", "2": "yo", "5": "howdy"} ) 
  })

  it('gets label html', async () => {
    var labels = { labels: { default: [1,2,3] }, min: 1, max: 3, step: 1}
    expect( template.labelHTML(labels, 'default') ).toBe("<span class='label-content'></span>")

    labels['before-label'] = "$"
    labels['after-label'] = "/month"
    var label = template.addLabels(labels)

    expect( label ).toMatch("<span class='before-label'>$</span>")
    expect( label ).toMatch("<span class='after-label'>/month</span>")

    expect( template.addLabels({ labels: false }) ).toBe( '' )
  })

  it('adds slider fills', async () => {
    // There is n-1 fills, so if there are two points on a line, there is only one fill between them
    expect( template.addFills(2) ).toBe("<div class='slider-fills'><span class='slider-fill' data-index='1'></span></div>")
    // If there are 10 points, there will be 9 fills
    expect( template.addFills(10) ).toMatch("<span class='slider-fill' data-index='9'></span></div>")
  })

  it('adds slider marks', async () => {
    expect( template.addMark([1,4,6], 1) ).toMatch("<span class='slider-segment-mark' data-index='1'></span>")
    expect( template.addMark([1,4,6], 5) ).toBe( '' )
  })

  it('adds line labels', async () => {
    // Line labels are 1 indexed and the first item will always be undefined
    // Because they are added to the array starting at index 1
    expect( template.addLineLabel('test') ).toMatch("<span class='slider-line-label'>test</span>")
    expect( template.addLineLabel('') ).toBe("")
  })

  it('creates slider html', async () => {
    var data = {
      labels: { default: ['1','2','3'] },
      values: [1,2,3,4],
      input: 'slider-test',
      inputClass: 'slider-test-1',
      lineLabels: [],
      segments: 3,
      mark: [1,3]
    }

    var html = template.html( data )
    expect( html ).toMatch("<div class='slider-fills'><span class='slider-fill' data-index='1'></span><span class='slider-fill' data-index='2'></span></div>")
  })
})

//describe('Progressive form', () => {
  //beforeAll(async () => {
    //await page.goto("http://localhost:8081/labels.html")

    //await page.exposeFunction( 'log', text =>
      //log(text)
    //)
  //})

//})

