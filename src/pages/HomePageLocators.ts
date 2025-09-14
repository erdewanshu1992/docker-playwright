export default class HomePageLocators {
  public readonly heading = 'h1';
  public readonly moreInfoLink = 'a[href]';
  public readonly brandImg = 'img[alt*="Flipkart"], img[alt*="flipkart"]';
  public readonly brandTextLocator = 'text=Flipkart';
  // Expanded search input selector list to be more resilient across variations of Flipkart's DOM
  public readonly searchInput =
    'input[name="q"], input[type="search"], input[title*="Search"], input[placeholder*="Search"], input._3704LK, input[class*="LM6RPg"]';
  // Expanded search results selectors to catch multiple result list patterns (cards, links, quick results)
  public readonly searchResults =
    'a[href*="/p/"], a[class*="_1fQZEK"], a[class*="_2rpwqI"], a[class*="s1Q9rs"], div._2kHMtA a[href]';
  // optional helper selector used in tests
  public readonly closeLoginButton = 'button._2KpZ6l._2doB4z';
}