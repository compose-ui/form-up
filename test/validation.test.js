var u = require('./_utils.js')

describe('Local', () => {
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
    await u.find('Please enter a valid email address.')

    await u.type('#input-2 input', 'foo@bar.org')
    await u.isValid('#input-2')
  })

  it('should not permit invalid values', async () => {
    await u.type('#input-3 input', 'not cool')
    await u.isInvalid('#input-3')
    await u.find("Value 'not cool' is not permitted")

    await u.type('#input-3 input', "it's cool")
    await u.isValid('#input-3')
  })

  it('should invalidate an input with a message', async () => {
    await u.type('#input-2 input', 'foo@bar.org')
    await u.invalidateField('#input-2 input', 'Email address already registered')
    await u.isInvalid('#input-2')
    await u.find("Email address already registered")

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
})
