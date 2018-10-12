var u = require('./_utils.js')
var helpers = require('../lib/slider/helpers')
var template = require('../lib/slider/template')

const log = function(a){
  console.log(a)
}

// Unit tests
describe('Slider Helpers', () => {
  it('sets values', async () => {
    expect( helpers.getValues(0,10) ).toMatchObject( [0,1,2,3,4,5,6,7,8,9,10] ) 
    expect( helpers.getValues(null,null,'a,b,c,d,e,f,g,h,j,k,l,m,n,o') ).toMatchObject( ['a','b','c','d','e','f','g','h','j','k','l','m','n','o'] ) 
  })

  it('gets labels', async () => {
    expect( helpers.getLabels( { test: 'a, b, c' } )).toMatchObject( { test: ['a', 'b', 'c'] } ) 
    expect( helpers.getLabels( {'': 'a,b,c'} )).toMatchObject( { default: ['a','b','c'] } ) 
    expect( helpers.getLabels( {'': 'none'} )).toBe( false ) 
  })

  it('gets line labels', async () => {
    expect( helpers.getLineLabels( '1:hi;2:yo;howdy' ) ).toMatchObject( [undefined, 'hi','yo','howdy'] ) 
    expect( helpers.getLineLabels( 'hi,yo,howdy' ) ).toMatchObject( [undefined, 'hi','yo','howdy'] ) 
    expect( helpers.getLineLabels( 'hi,yo,5:howdy' ) ).toMatchObject( [undefined, 'hi','yo', undefined, undefined,'howdy'] ) 
  })

  it('gets label html', async () => {
    expect( template.labelHTML({ labels: { default: [1,2,3] }}, 'default') ).toBe("<span class='label-content'></span>")

    var labels = { labels: { default: [1,2,3] }}
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
    expect( template.addLineLabel([undefined, 1,2,3, undefined, undefined,5], 1) ).toMatch("<span class='slider-line-label'>1</span>")
    expect( template.addLineLabel([undefined, 1,2,3, undefined, undefined,5], 4) ).toBe("")
  })

  it('creates slider html', async () => {
    var data = {
      labels: { default: ['1','2','3'] },
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

