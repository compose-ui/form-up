module.exports = u = {
  validate: async () => {
    await page.evaluate("FormUp.validate(document.querySelector('form'))")
  },

  type: async (selector, data) => {
    await expect(page).toFill(selector, data)
    await page.evaluate("FormUp.validate(document.querySelector('form'))")
    await u.validate()
  },

  select: async (selector, option) => {
    await expect(page).toSelect(selector, option)
    await u.validate()
  },

  invalidateField: async (selector, text) => {
    await page.evaluate(`FormUp.invalidateField( document.querySelector('${selector}'), '${text}')`)
    await u.validate()
  },

  isValid: async (selector) => {
    await expect(page).toMatchElement(`${selector}.valid`)
  },

  isInvalid: async (selector) => {
    await u.findElement(`${selector}.invalid`)
  },

  findElement: async (selector, options) => {
    await expect(page).toMatchElement(`${selector}`, options)
  },

  find: async (text) => {
    await expect(page).toMatch(text)
  },

  click: async (selector, options) => {
    await expect(page).toClick(selector, options)
  },

  html: async (selector) => {
    return await page.$eval(selector, e => e.outerHTML);
  },

  matchText: async (selector, text) => {
    return expect( await u.text(selector)).toBe(text)
  },

  text: async (selector) => {
    return await page.$eval(selector, e => e.textContent);
  }
}
