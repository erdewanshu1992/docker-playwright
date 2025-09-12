import { test, Page, Locator, expect } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specified URL with error handling
   * @param url - The URL to navigate to
   */
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Click on an element with robust error handling
   * @param locator - The locator of the element to click
   * @param options - Optional click options
   */
  async clickElement(
    locator: string,
    options?: { timeout?: number; force?: boolean }
  ): Promise<void> {
    await this.page.locator(locator).waitFor({ state: 'visible' });
    await this.page.locator(locator).click({
      timeout: options?.timeout,
      force: options?.force || false,
      trial: false,
    });
  }

  /**
   * Fill input field with value
   * @param locator - The locator of the input field
   * @param value - Value to be filled
   */
  async fillInput(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  /**
   * Fill input field with value by keyboard
   * @param value - Value to be type
   */
  async fillInputByKeyBoardType(value: string) {
    await this.page.keyboard.type(value);
  }

  /**
   * Clear input field
   * @param locator - The locator of the input field
   */
  async clearInput(locator: Locator): Promise<void> {
    await locator.clear();
  }

  /**
   * Wait for element to be visible with configurable timeout
   * @param locator - The locator of the element
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForElementVisible(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await locator.waitFor({
      state: 'visible',
      timeout: options?.timeout,
    });
  }

  /**
   * handles new tab
   * @param action - action on the link to be click to open new tab
   */
  async handleNewTabAction(action: () => Promise<void>): Promise<Page> {
    const [newTab] = await Promise.all([
      this.page.waitForEvent('popup'),
      action(), // Trigger the action that opens the new tab (e.g., click, navigation)
    ]);
    await newTab.waitForLoadState('domcontentloaded');
    return newTab; // Return the new tab to allow further interaction
  }

  /*

  async handleNewTabAction(action: () => Promise<void>): Promise<Page> {
  let newPage: Page | null = null;

  try {
    [newPage] = await Promise.all([
      this.page.context().waitForEvent('page').catch(() => null),
      action()
    ]);
  } catch (err) {
    console.error('❌ Error during tab handling:', err);
    throw err;
  }

      return newPage || this.page;
  }

  */

  /**
   * Generate a custom date
   * @param year - provide the numeric input for year
   * @param month - provide any input for month
   * @param day - provide the numeric input for day
   */
  async generateCustomDate(year: number, month: any, day: number) {
    const customDate = new Date(year, month - 1, day);
    return customDate.toISOString();
  }

  /**
   * select element by text when more than one matching elements
   * @param locator - The locator of the element
   * @param targetText - Used to filter and select the element whose inner text corresponds exactly to the value passed
   */
  async selectElementByText(locator: Locator, targetText: string) {
    const filteredElement = locator
      .filter({ hasText: new RegExp(`^${targetText}$`, 'i') }) // Exact match with case-insensitive option (optional)
      .first();

    if (filteredElement) {
      await filteredElement.click();
      return;
    }
  }

  /**
   * @param checkboxId - Id of the event which needs to be checked
   */
  async clickCheckboxById(checkboxId: any): Promise<void> {
    const checkboxLocator = checkboxId;
    const isChecked = await checkboxLocator.isChecked();
    if (!isChecked) {
      await checkboxLocator.click();
    }
  }

  /**
   * Verifies the checkbox state (checked or not) based on the expected condition.
   * @param checkboxLocator - Locator for the checkbox.
   * @param shouldBeChecked - If true, the checkbox should be checked; if false, the checkbox should be unchecked.
   */
  async verifyCheckboxStateById(checkboxLocator: Locator, shouldBeChecked: boolean): Promise<void> {
    const isChecked = await checkboxLocator.isChecked();

    if (shouldBeChecked) {
      if (!isChecked) {
        throw new Error('Checkbox is not checked as expected.');
      }
    } else {
      if (isChecked) {
        throw new Error('Checkbox is checked, but it was expected to be unchecked.');
      }
    }
  }

  /**
   * Selects an option from a dropdown by option text
   * @param dropdownBtn - Selector for the dropdown button
   * @param optionLocator - Selector for the all the options in the dropdown
   * @param optionName - Name of the option to select
   */

  async selectDropdownOptionByText(dropdownBtn: string, optionLocator: string, optionName: string) {
    await this.clickElement(dropdownBtn);
    const option = this.page
      .locator(optionLocator)
      .filter({
        hasText: optionName,
      })
      .first();
    const optionValue = await option.getAttribute('value');
    if (optionValue) {
      await this.page.locator(dropdownBtn).selectOption({ value: optionValue });
    } else {
      throw new Error(`Option with name "${optionName}" not found.`);
    }
  }

  async downloadFile(downloadDir: any, locator: string, fileName: string) {
    const downloadPromise = this.page.waitForEvent('download');
    await this.clickElement(locator);
    const download = await downloadPromise;
    await download.saveAs(`${downloadDir}/${fileName}`);
  }

  /**
   * Select date from ui datepicker widget used in Rewards Expiration Date[Create,Edit]
   * @param date - date to be selected in YYYY-MM-DD format
   */
  async enterDateInDatePicker(date: string) {
    const [year, month, day] = date.split('-').map(Number);

    const datepicker = this.page.locator('.ui-datepicker-inline');
    await datepicker.waitFor({ state: 'visible' });

    const targetMonthName = new Date(year, month - 1, 1).toLocaleString('default', {
      month: 'long',
    }); // month - 1 for Date object

    let currentYear = Number(await datepicker.locator('.ui-datepicker-year').textContent());
    let currentMonth = await datepicker.locator('.ui-datepicker-month').textContent();

    while (currentYear !== year || currentMonth !== targetMonthName) {
      if (currentMonth) {
        const direction =
          currentYear < year ||
          (currentYear === year && this.monthNameToNumber(currentMonth) < month)
            ? 'next'
            : 'prev'; // Corrected direction logic

        const navButton = datepicker.locator(`.ui-datepicker-${direction}`);
        const isDisabled = await navButton.evaluate((el) =>
          el.classList.contains('ui-state-disabled')
        );

        await navButton.click({ force: true });

        // Wait for the month or year to change (Stability Check):
        await expect(datepicker.locator('.ui-datepicker-month')).not.toHaveText(currentMonth, {
          timeout: 5000,
        });

        currentYear = Number(await datepicker.locator('.ui-datepicker-year').textContent());
        currentMonth = await datepicker.locator('.ui-datepicker-month').textContent();
      }
    }

    const dayLocator = datepicker.locator(
      `table.ui-datepicker-calendar td[data-month="${
        month - 1
      }"][data-year="${year}"] a[data-date="${day}"]`
    ); //month - 1 for locator
    await dayLocator.click({ force: true });
  }

  // Helper function to convert month name to number (0-11)
  monthNameToNumber(monthName: string): number {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames.indexOf(monthName);
  }

  /**
   * Format date to YYYY-MM-DD formate
   * @param date - date to be formatted into YYYY-MM-DD format
   * @returns date formatted in YYYY-MM-DD format
   */
  async getFormattedDate(date: Date): Promise<string> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * This function is use to click on element if its visible
   * @param ElementLocator - Locator for the Element.
   */
  async clickElementIfVisible(elementLocator: string): Promise<void> {
    const isVisible = await this.page.locator(elementLocator).isVisible();
    if (isVisible) {
      await this.clickElement(elementLocator);
    }
  }

  /**
   * Scrolls to an element using a locator and optional filter text.
   * @param elementLocator - The selector string for the element(s).
   * @param filterText - (Optional) Text to filter the element by.
   */
  async scrollToElement(elementLocator: string, filterText?: string): Promise<void> {
    let element =  this.page.locator(elementLocator);

    if (filterText) {
      element = element.filter({
        has: this.page.locator(`text="${filterText}"`),
      });
    }

    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Returns the  element from a list of locators filtered by text.
   * @param locator - The locator for the element.
   * @param filterText - The visible text to match inside the element.
   */
  async getElementByText(locator: string, filterText: string): Promise<Locator> {
    await this.page
      .locator(locator)
      .filter({ has: this.page.locator(`text="${filterText}"`) })
      .waitFor({
        state: 'visible',
      });
      await this.page
      .locator(locator)
      .filter({ has: this.page.locator(`text="${filterText}"`) })
      .waitFor({
        state: 'attached',
      });
    const element = await this.page
      .locator(locator)
      .filter({ has: this.page.locator(`text="${filterText}"`) });

    if (!(await element.first().isVisible())) {
      throw new Error(`No element found with text: "${filterText}" inside: "${locator}"`);
    }

    return element.first();
  }

  /**
   * Clicks on the element filtered by text within the given locator.
   * @param locator - The base locator selector string.
   * @param filterText - The visible text to match inside the element.
   */
  async clickElementByText(locator: string, filterText: string): Promise<void> {
    await this.page
      .locator(locator)
      .filter({ has: this.page.locator(`text="${filterText}"`) })
      .waitFor({
        state: 'visible',
      });
    const element = this.page
      .locator(locator)
      .filter({ has: this.page.locator(`text="${filterText}"`) });
    if (!(await element.first().isVisible())) {
      throw new Error(
        `Cannot click: Element with text "${filterText}" not visible inside "${locator}"`
      );
    }
   await Promise.all([
  this.page.waitForLoadState('load'),
  element.first().click()
]);
    await this.page.waitForLoadState('load');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Returns the  element from a list of locators filtered by placeholder.
   * @param locator - The locator for the element.
   * @param placeholderText - The visible text to match inside the element.
  */
 async getElementByPlaceholder(placeholderText: string): Promise<Locator> {
  await this.page.waitForLoadState('domcontentloaded');

  const element = this.page.locator(`input[placeholder="${placeholderText}"]`);

  const isVisible = await element.isVisible();
  if (!isVisible) {
    throw new Error(`No input element found with placeholder: "${placeholderText}"`);
  }

  return element;
 }

 /**
   * Returns the  element from a list of locators filtered with has-Text.
   * @param locator - The locator for the element.
   * @param text - The visible text to match inside the element.
  */
 async getElementByPartialText(locator: string, partialText: string): Promise<Locator> {
  await this.page.waitForLoadState('domcontentloaded');

  const element = this.page.locator(locator).filter({
    hasText: partialText,
  });
  await element.waitFor({ state: 'visible'});

  if (!(await element.isVisible())) {
    throw new Error(`No element found with partial text: "${partialText}" inside: "${locator}"`);
  }
  return element;
}
  /**
   * @param selector - A string selector
   * @param timeout - Optional timeout in milliseconds (default: 5000)
   */
  async waitForVisibleElement(selector: string, timeout: number = 5000): Promise<void> {
    await this.page.locator(selector).first().waitFor({
      state: 'visible',
      timeout,
    });
  }

}
export { test, expect };