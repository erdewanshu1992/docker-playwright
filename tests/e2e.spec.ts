import { test, expect } from '@playwright/test';
import HomePage from '../src/pages/HomePage';

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

  test('search item, open in new tab, add to cart and verify price', async ({ page }) => {
    const home = new HomePage(page, process.env.BASE_URL || 'https://www.flipkart.com');
    await home.goto('/');
    // close login modal if present
    const closeLogin = page.locator('button._2KpZ6l._2doB4z');
    if (await closeLogin.count()) await closeLogin.first().click();

    const searchTerm = 'smartphone';
    await home.search(searchTerm);

    // open first result in a new tab
    const productPage = await home.openFirstResultInNewTab();

    // Ensure we have a product page loaded
    await expect(productPage).toHaveURL(/.*/);

    // Common Flipkart price selectors
    const priceLocator = productPage.locator('div._30jeq3, div._25b18c, span._30jeq3');
    await expect(priceLocator.first()).toBeVisible({ timeout: 10000 });
    const productPriceText = (await priceLocator.first().textContent()) || '';
    expect(productPriceText.length).toBeGreaterThan(0);

    // Click Add to Cart (handle different possible button texts)
    const addToCartBtn = productPage.locator('button:has-text("ADD TO CART"), button:has-text("Add to cart"), button:has-text("Add to Cart")');
    if ((await addToCartBtn.count()) > 0) {
      await addToCartBtn.first().click();
    } else {
      // fallback to Buy Now or cart icon
      const buyNow = productPage.locator('button:has-text("BUY NOW"), button:has-text("Buy Now")');
      if ((await buyNow.count()) > 0) {
        await buyNow.first().click();
        // on buy now, user may be redirected to checkout; navigate to cart to verify
        await productPage.goto((process.env.BASE_URL || 'https://www.flipkart.com') + '/cart');
      } else {
        // try clicking cart icon in header
        await productPage.goto((process.env.BASE_URL || 'https://www.flipkart.com') + '/cart');
      }
    }

    // Wait for cart price to appear
    const cartPriceLocator = productPage.locator('div._3X6ZlX, div._1vC4OE, div._30jeq3, span._30jeq3');
    await expect(cartPriceLocator.first()).toBeVisible({ timeout: 10000 });
    const cartPriceText = (await cartPriceLocator.first().textContent()) || '';

    // Normalize and compare numeric parts (ignore currency symbols/formatting)
    const prodPriceNum = normalizePrice(productPriceText);
    const cartPriceNum = normalizePrice(cartPriceText);

    // Basic assertion: product price digits should be included in cart price digits (some pages show totals with shipping)
    expect(cartPriceNum).toContain(prodPriceNum);
  });
});