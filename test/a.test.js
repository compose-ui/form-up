describe('Local', () => {
  beforeAll(async () => {
    await page.goto("http://localhost:8081/form.html")
  })

  it('should display "Submit" text on page', async () => {
    await expect(page).toMatch('Submit')
    await expect(page).toClick('button', { text: 'Submit' })
    await expect(page).toMatchElement('#input-1.invalid')

    await page.focus('#input-1 input')
    await page.keyboard.type('test', {delay: 100})
    await expect(page).toMatchElement('#input-1.valid')

    await expect(page).toClick('button', { text: 'Submit' })
    await expect(page).toMatchElement('#input-2.invalid')
    await expect(page).toMatch('Please enter a valid email address.')

    await page.focus('#input-2 input')
    await page.keyboard.type('foo@bar.org', {delay: 100})
    await expect(page).toMatchElement('#input-2.valid')
  })
})
