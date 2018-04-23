describe('Local', () => {
  beforeAll(async () => {
    await page.goto("http://localhost:8081/form.html")
  })

  it('should display "Submit" text on page', async () => {
    await expect(page).toMatch('Submit')
    await expect(page).toClick('button', { text: 'Submit' })
    await expect(page).toMatchElement('label.invalid')
    await expect(page).toFill('#first-input', 'test')
    await expect(page).toClick('button', { text: 'Submit' })
    await expect(page).toMatchElement('label.valid')
  })
})
