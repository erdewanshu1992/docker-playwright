import { test, expect } from '@playwright/test';
import HomePage from '../src/pages/HomePage';
import { BasePage } from '../src/pages/BasePage';

function normalizePrice(p?: string | null) {
  if (!p) return '';
  return p.replace(/[^\d]/g, '');
}

test.describe('Flipkart smoke', () => {
  test('should load flipkart.com and validate brand', async ({ page }) => {
    const home = new HomePage(page, process.env.BASE_URL || 'https://www.flipkart.com');
    await home.goto('/');
    // close login modal if present
    const closeLogin = page.locator('button._2KpZ6l._2doB4z');
    if (await closeLogin.count()) await closeLogin.first().click();
    const brand = await home.brandText();
    expect(brand).toContain('Flipkart');
  });

  test('search item, open in new tab, add to cart and verify prices', async ({ page }) => {
  const home = new HomePage(page, process.env.BASE_URL || 'https://www.flipkart.com');
  await home.goto('/');

  // Close login modal if present
  const closeLogin = page.locator('button._2KpZ6l._2doB4z');
  if (await closeLogin.count()) await closeLogin.first().click();

  const searchTerm = 'smartphone';
  await home.search(searchTerm);

  // Open first result in a new tab
  const productLink = page.locator('.Nx9bqj._4b5DiR').first(); // corrected selector
  const basePage = new BasePage(page);
  const newTab = await basePage.handleNewTabAction(async () => {
    await productLink.click();
  });

  // Ensure product page is loaded
  await newTab.waitForLoadState('domcontentloaded');
  await expect(newTab).toHaveURL(/flipkart\.com\/.+/);

  // Extract product price
  const priceLocator = newTab.locator(`//div[contains(text(), '₹')]`);
  await expect(priceLocator.first()).toBeVisible({ timeout: 10000 });
  const productPriceText = await priceLocator.first().textContent() || '';

  // Add to cart
  const addToCartBtn = newTab.locator('button:has-text("ADD TO CART"), button:has-text("Add to cart"), button:has-text("Add to Cart")');
  if (await addToCartBtn.count()) {
    await addToCartBtn.first().click();
  } else {
    const buyNow = newTab.locator('button:has-text("BUY NOW"), button:has-text("Buy Now")');
    if (await buyNow.count()) {
      await buyNow.first().click();
    }
    await newTab.goto(`${process.env.BASE_URL || 'https://www.flipkart.com'}/cart`);
  }

  // Verify cart price
  const cartPriceLocator = newTab.locator(`//div[contains(text(), '₹')]`);
  await expect(cartPriceLocator.first()).toBeVisible({ timeout: 10000 });
  const cartPriceText = await cartPriceLocator.first().textContent() || '';

  // Normalize and compare
  const prodPriceNum = normalizePrice(productPriceText);
  const cartPriceNum = normalizePrice(cartPriceText);
  expect(cartPriceNum).toContain(prodPriceNum);
});

});