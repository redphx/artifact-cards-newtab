var REMAINING_CARDS = [];
var NEXT_CARD_INDEX = 0;


// Preload image url
function preloadImage(url) {
  let preload = new Image();
  preload.src = 'https://steamcdn-a.akamaihd.net/apps/583950' + url;
}


// Pick random card and preload it
function prepareNextCard() {
  if (REMAINING_CARDS.length === 0) {
    REMAINING_CARDS = CARDS.slice()
  }

  // Make sure new card have a different index
  let next = NEXT_CARD_INDEX;
  while (next == NEXT_CARD_INDEX) {
    next = Math.floor(Math.random() * REMAINING_CARDS.length)
  }
  NEXT_CARD_INDEX = next;

  // Preload next card's images
  let nextCard = REMAINING_CARDS[NEXT_CARD_INDEX];
  preloadImage(nextCard['large_image']);
  if (nextCard['card_spell']) {
    preloadImage(nextCard['card_spell']['large_image']);
  }
}


// Return picked card
function getNextCard() {
  let nextCard = REMAINING_CARDS[NEXT_CARD_INDEX];
  // Remove card from database
  REMAINING_CARDS.splice(NEXT_CARD_INDEX, 1);

  return nextCard;
}


prepareNextCard();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.cmd) {
    case 'request_card':
      // Return picked card to new tab
      sendResponse(getNextCard());

      // Prepare next card
      prepareNextCard();
      break;
  }
});
