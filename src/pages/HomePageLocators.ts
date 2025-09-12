export default class HomePageLocators {
  public readonly heading = 'h1';
  public readonly moreInfoLink = 'a[href]';
  public readonly brandImg = 'img[alt*="Flipkart"], img[alt*="flipkart"]';
  public readonly brandTextLocator = 'text=Flipkart';
  public readonly searchInput = 'input[name="q"], input[type="search"]';
  public readonly searchResults = 'a[href*="/p/"], a[class*="_1fQZEK"], a[class*="s1Q9rs"]';
  // optional helper selector used in tests
  public readonly closeLoginButton = 'button._2KpZ6l._2doB4z';
}