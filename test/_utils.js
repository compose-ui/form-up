module.exports = u = {
  validate: async () => {
    await page.evaluate("FormUp.validate(document.querySelector('form'))")
  },

  exec: async (func) => {
    return await page.evaluate(func)
  },

  type: async (selector, data) => {
    await expect(page).toFill(selector, data)
    //await page.evaluate("FormUp.validate(document.querySelector('form'))")
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
    return expect( (await u.text(selector)).trim() ).toBe(text)
  },

  matchValue: async (selector, val) => {
    return expect( await u.value(selector)).toBe(val)
  },

  text: async (selector) => {
    return await page.$eval(selector, e => e.textContent);
  },

  value: async (selector) => {
    return await page.$eval(selector, e => e.value);
  },

  valueIs: async (selector, expected) => {
    return expect( await u.value(selector)).toBe(expected)
  },

  countIs: async (selector, expected) => {
    return expect( await page.$$eval(selector, e => e.length)).toBe(expected)
  },  

  isNull: async (selector) => {
    return expect( await page.$(selector)).toBe(null)
  },

  wait: async ( time ) => {
    return await page.keyboard.press( 'ShiftLeft', { delay: time } )
  },

  data: async (selector, object) => {
    if ( object ) {
      return await page.$eval(selector, (e, object) => e.dataset[object], object);
    } else {
      return JSON.parse( await page.$eval(selector, (e) => JSON.stringify(e.dataset)) );
    }
  },

  setValue: async (selector, value) => {
    await page.evaluate(`document.querySelector('${selector}').value = '${value}'`)
    await page.evaluate(`var input = document.querySelector('${selector}'); FormUp.event.fire(input, 'input')`)
  },

  enableLogging: ()=> {
    page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${msg.args()[i]}`)
    });
  },

  reload: async () => {
    return await page.reload( { waitUntil: 'domcontentloaded' })
  }
}
