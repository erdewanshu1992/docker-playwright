import { test as base, expect as baseExpect } from '@playwright/test';
import HomePage from '../src/pages/HomePage';

type Fixtures = {
  homePage: HomePage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    const home = new HomePage(page, process.env.BASE_URL || '');
    await use(home);
  }
});

export const expect = baseExpect;