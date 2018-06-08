var u = require('./_utils.js')

describe('Progressive form', () => {
  beforeAll(async () => {
    await page.goto("http://localhost:8081/progressive.html")
  })

  it('generates form navigation', async () => {
    await u.findElement('.progressive-form-nav')
  })

  it('customizes nav labels for form navigation', async () => {
    await u.findElement('.progressive-form-nav-item[data-step="2"]', { text: 'Step Two' })
  })

  it('disables all but the first fieldset', async () => {
    await u.findElement('#fieldsetOne.active:not([disabled])')
    await u.findElement('#fieldsetTwo[disabled]')
    await u.findElement('#fieldsetThree[disabled]')
  })

  it('does not progress if an input is invalid', async () => {
    await u.click('#submit-1')
    await u.isInvalid('#input-1')
    await u.findElement('#fieldsetOne:not([disabled])')

    await u.type('#input-1 input', 'test')
    await u.isValid('#input-1')
    await u.click('#submit-1')

    await u.findElement('#fieldsetOne[disabled]')
    await u.findElement('#fieldsetTwo.active')
  })

  it('can navigate to a specific step', async () => {
    await u.click('nav a.previous')
    await u.findElement('#fieldsetOne.active')
    await u.findElement('#fieldsetTwo[disabled]')
    await u.click('nav a.next')
    await u.findElement('#fieldsetOne[disabled]')
    await u.findElement('#fieldsetTwo.active')
  })
})

