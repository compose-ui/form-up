var u = require('./_utils.js')

describe('Validation', () => {
  beforeAll(async () => {
    await page.goto("http://localhost:8081/validation.html")
  })

  it('should do simple required validation', async () => {
    await u.click('button')
    await u.isInvalid('#input-1')

    // Prove that keyup events trigger validation
    await u.type('#input-1 input', 'test')
    await u.isValid('#input-1')
  })

  it('should handle pattern matching validation and messages', async () => {
    await u.click('button')
    await u.isInvalid('#input-2')
    await u.matchText('#input-2','Please enter a valid email address.')

    await u.type('#input-2 input', 'foo@bar.org')
    await u.isValid('#input-2')
  })

  it('should not permit invalid values', async () => {
    await u.type('#input-3 input', 'not cool')
    await u.isInvalid('#input-3')
    await u.matchText('#input-3', "Value 'not cool' is not permitted")

    await u.type('#input-3 input', "it's cool")
    await u.isValid('#input-3')
  })

  it('should invalidate an input with a message', async () => {
    await u.type('#input-2 input', 'foo@bar.org')
    await u.invalidateField('#input-2 input', 'Email address already registered')
    await u.isInvalid('#input-2')
    await u.matchText('#input-2', "Email address already registered")

    await u.type('#input-2 input', 'foo@bar2.org')
    await u.isValid('#input-2')
  })

  it('should validate a maximum number of words (3)', async () => {
    await u.type('#input-4 input', 'more than a few words')
    await u.isInvalid('#input-4')

    await u.type('#input-4 input', 'a few words')
    await u.isValid('#input-4')
  })

  it('should validate a minimum number of words (3)', async () => {
    await u.type('#input-5 input', 'few words')
    await u.isInvalid('#input-5')

    await u.type('#input-5 input', 'a few words')
    await u.isValid('#input-5')
  })

  it('should test select elements', async () => {
    await u.select('#input-6 select', 'Select something')
    await u.isInvalid('#input-6')

    await u.select('#input-6 select', 'Something')
    await u.isValid('#input-6')
  })

  it('validates times', async () => {
    await u.type('#input-7 input', 'few words')
    await u.isInvalid('#input-7')
    await u.matchText('#input-7', 'Please enter a valid date string: YYYY-MM-DD HH:MM:SS')

    await u.type('#input-7 input', '2010-05-23 08:19:00')
    await u.isValid('#input-7')
  })

  it('only validates after a time', async () => {
    await u.type('#input-8 input', '2000-05-23 08:19')
    await u.isInvalid('#input-8')
    await u.matchText('#input-8', 'Please enter a time after 2008-12-26 07:23')

    await u.type('#input-8 input', '2010-05-23 08:19')
    await u.isValid('#input-8')
  })

  it('only validates before a time', async () => {
    await u.type('#input-9 input', '2020-05-23')
    await u.isInvalid('#input-9')
    await u.matchText('#input-9', 'Please enter a time before 2015-07-22 07:23')

    await u.type('#input-9 input', '2000-05-23')
    await u.isValid('#input-9')
  })

  it('only validates between times', async () => {
    await u.type('#input-10 input', '2020-05-23')
    await u.isInvalid('#input-10')
    await u.matchText('#input-10', 'Please enter a time between 2008-12-26 07:23 and 2015-07-22 07:23')

    await u.type('#input-10 input', '2009-05-23')
    await u.isValid('#input-10')
  })
})
