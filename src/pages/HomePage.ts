import { BasePage } from './BasePage';
import { Page, Locator } from '@playwright/test';
import HomePageLocators from './HomePageLocators';

/**
 * HomePage - Actions only.
 * Locators are defined in HomePageLocators (strings) and consumed here.
 * This class exposes behavior-only methods; it does NOT expose Locator fields.
 *
 * Updated to actively use BasePage helper methods:
 * - clickElement
 * - fillInputByKeyBoardType
 * - waitForElementVisible
 * - handleNewTabAction
 * - selectElementByText
 */
export default class HomePage extends BasePage {
  private readonly locators: HomePageLocators;
  private readonly baseUrl: string;

  constructor(page: Page, baseUrl?: string) {
    super(page);
    this.locators = new HomePageLocators();
    this.baseUrl = baseUrl ?? process.env.BASE_URL ?? '';
  }

  // Internal getters that create Locator instances on demand (not exposed publicly)
  private heading(): Locator {
    return this.page.locator(this.locators.heading);
  }

  private moreInfoLink(): string {
    return this.locators.moreInfoLink;
  }

  private brandImg(): Locator {
    return this.page.locator(this.locators.brandImg);
  }

  private brandTextLocator(): Locator {
    return this.page.locator(this.locators.brandTextLocator);
  }

  private searchInput(): Locator {
    return this.page.locator(this.locators.searchInput);
  }

  private searchResults(): Locator {
    return this.page.locator(this.locators.searchResults);
  }

  private closeLoginButton(): string {
    return this.locators.closeLoginButton;
  }

  async goto(path = '/') {
    const url = this.baseUrl ? `${this.baseUrl}${path}` : path;
    await super.navigateTo(url);
    // ensure full load for tests that expect it
    await this.page.waitForLoadState('load');
  }

  async headingText() {
    return this.heading().textContent();
  }

  async brandText() {
    // try image alt first
    const img = this.brandImg();
    if ((await img.count()) > 0) {
      const alt = await img.first().getAttribute('alt');
      if (alt) return alt;
    }
    // fallback to visible text locator
    const textLoc = this.brandTextLocator();
    if ((await textLoc.count()) > 0) {
      return textLoc.first().textContent();
    }
    return null;
  }

  async clickMoreInfo() {
    // Use BasePage.clickElement which waits then clicks by selector string
    await this.clickElement(this.moreInfoLink());
  }

  /**
   * Close the common login modal if present (helper so tests don't need to access locators directly).
   * Uses BasePage.clickElementIfVisible to avoid exposing locators.
   */
  async closeLoginIfPresent() {
    await this.clickElementIfVisible(this.closeLoginButton());
    // allow any modal hide animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Perform a search using the site's search input and wait for results.
   * Uses BasePage.waitForElementVisible + fillInputByKeyBoardType to satisfy the helper usage request.
   * Updated to explicitly target the first matching input and be resilient to multiple inputs on the page.
   * Added defensive recovery: if site shows an error banner (transient E002), reload once and retry.
   */
  async search(term: string) {
    // Defensive helper: retry once if an error banner appears (site-side transient error)
    const hasErrorBanner = async () => {
      const err = this.page.locator('text=Something went wrong, text=Something went wrong!, text=E002');
      return (await err.count()) > 0;
    };

    // If error banner present, reload once and wait for load
    if (await hasErrorBanner()) {
      await this.page.reload({ waitUntil: 'load' }).catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    // Ensure any login modal is closed before attempting to find the search input
    await this.closeLoginIfPresent();

    // Attempt to find the search input using the primary locator, then progressively broader fallbacks.
    let inputs = this.searchInput();
    if ((await inputs.count()) === 0) {
      // Try one more time after a short wait (network may be slow in container)
      await this.page.waitForTimeout(1000);
      inputs = this.searchInput();

      // If still not found, probe several common fallback selectors used for search inputs across sites.
      if ((await inputs.count()) === 0) {
        const fallbackSelectors = [
          'input[role="search"]',
          'input[aria-label*="search"]',
          'input[placeholder*="Search"]',
          'input[type="search"]',
          'input' // last resort: any input on the page
        ];
        for (const sel of fallbackSelectors) {
          const candidate = this.page.locator(sel);
          if ((await candidate.count()) > 0) {
            inputs = candidate;
            break;
          }
        }
      }

      // Final check: if still nothing, throw an informative error.
      if ((await inputs.count()) === 0) {
        throw new Error('Search input not found on HomePage');
      }
    }

    // Use the first matching input to avoid strict-mode ambiguity
    const input = inputs.first();

    // Ensure input is visible and focused before typing
    await this.waitForElementVisible(input);
    await input.click();
    // Use keyboard typing helper
    await this.fillInputByKeyBoardType(term);
    // Press Enter and wait for navigation or results to load
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
      input.press('Enter'),
    ]);
    // small pause to allow results to render
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click the first search result which opens in a new tab / popup and return the new Page.
   * Uses BasePage.handleNewTabAction to centralize tab handling.
   */
  async openFirstResultInNewTab() {
    const results = this.searchResults();
    if ((await results.count()) === 0) {
      throw new Error('No search results found');
    }
    // Wait for results to be visible using BasePage helper
    await this.waitForElementVisible(results);
    const first = results.first();
    const newPage = await this.handleNewTabAction(() => first.click());
    if (!newPage) throw new Error('Failed to capture new page from search result');
    await newPage.waitForLoadState('load');
    return newPage;
  }

  /**
   * Select a search result by exact visible text (demonstrates selectElementByText usage).
   */
  async selectSearchResultByText(text: string) {
    const results = this.searchResults();
    await this.selectElementByText(results, text);
  }
}