const BASE_IMAGE_URL = 'https://steamcdn-a.akamaihd.net/apps/583950';

var cardElm;
var cardSpellElm;


// Firefox doesn't allow to use innerHTML so we have to create elements manually
function createElement(nodeName, props) {
  let elm = document.createElement(nodeName);

  props = props || {};
  if (typeof props === 'object') {
    for (let key in props) {
      if (key === 'style') {
        let styles = props[key];
        for (let styleName in styles) {
          if (!styles.hasOwnProperty(styleName)) {
            continue;
          }
          elm.style[styleName] = styles[styleName];
        }
      } else if (props.hasOwnProperty(key) && !elm.hasOwnProperty(key)) {
        let value = props[key];
        elm[key] = value;
      }
    }
  } else {
    elm.textContent = props;
  }

  for (let i = 2, size = arguments.length; i < size; i++) {
    if (arguments[i]) {
      elm.appendChild(arguments[i]);
    }
  }

  return elm;
}

// Tilt cards based on mouse movement
function trackMouseMovement() {
  const MAX_DEGREE = 35;

  document.addEventListener('mousemove', e => {
    let x = e.pageX / document.documentElement.clientWidth;
    let y = e.pageY / document.documentElement.clientHeight;

    let tiltX = - (y * MAX_DEGREE - MAX_DEGREE / 2).toFixed(2);
    let tiltY = - (MAX_DEGREE / 2 - x * MAX_DEGREE).toFixed(2);

    let transform = 'rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) ';

    cardElm.style.transform = transform;
    if (cardSpellElm) {
      cardSpellElm.style.transform = transform;
    }
  });
}


// Show card's image
function displayCardImage(elm, imageUrl) {
  elm.style.backgroundImage = 'url("' + BASE_IMAGE_URL + imageUrl + '")';
  elm.style.display = 'inline-block';
}


// Render card's abilities
function renderCardAbilities(card) {
  if (!card['card_abilities']) {
    return;
  }

  let ce = createElement;
  let abilitiesElm = document.querySelector('.abilities');

  card['card_abilities'].forEach(ability => {
    let abilityElm = ce('div', { className: 'ability' },
        ce('div', { className: 'ability-info' },
          ce('div', { className: 'ability-name', textContent: ability['name'] }),
          ce('div', { className: 'ability-type', textContent: ability['type'] }),
          ce('div', { className: 'ability-text', textContent: ability['text'] }),
        )
    );

    abilitiesElm.appendChild(abilityElm);
  });
}


// Centering card container
function centeringCardContainer() {
  let container = document.querySelector('.card-container');
  let centerX = Math.round(container.clientHeight / 2);
  let centerY = Math.round(container.clientWidth / 2);

  container.style.margin = '-' + centerX + 'px 0 0 -' + centerY + 'px';
}

function renderCard(card) {
  console.log(card);

  cardElm = document.querySelector('.card');
  displayCardImage(cardElm, card['large_image']);

  if (card['card_spell']) {
    cardSpellElm = document.querySelector('.card-spell');
    displayCardImage(cardSpellElm, card['card_spell']['large_image']);
  }

  renderCardAbilities(card);
  centeringCardContainer();
  trackMouseMovement();
}


// Request card to display
chrome.runtime.sendMessage({
  cmd: 'request_card'
}, function(card) {
  renderCard(card);
})
