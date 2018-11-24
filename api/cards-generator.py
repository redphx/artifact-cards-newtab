#!/usr/bin/env python
#
# Generate cards database (extension/db/cards.js) from Artifact API
# Artifact API: https://github.com/ValveSoftware/ArtifactDeckCode/

import requests
import json
import re

# Current availale card sets
CARD_SETS = ['00', '01']

# Ignore Pathing & Ancient cards
BLACKLISTED_CARD = [1000, 1001, 1002, 1003, 1004, 1005, 1007]


# Get JSON from URL
def get_json(url):
    r = requests.get(url)
    return r.json()


# Get Card set's url from API
def get_card_set_url(cardset):
    json_obj = get_json("https://playartifact.com/cardset/" + cardset)
    return json_obj['cdn_root'] + json_obj['url']


def add_if_key_exists(from_obj, from_key, to_obj, to_key):
    if from_key in from_obj:
        to_obj[to_key] = from_obj[from_key]


# Remove html tags from text
def strip_html_tags(text):
    return re.sub('<[^<]+?>', '', text)


# Read card set data from API
def get_card_set(url):
    print "Getting Card set {}".format(url)

    # Get JSON data
    json_obj = get_json(url)

    cards = {}

    for card in json_obj['card_set']['card_list']:
        # Use only needed data
        simple_card = {
            'card_id': card['card_id'],
            'card_name': card['card_name']['english'],
        }

        if card['card_type'] == 'Hero':
            simple_card['references'] = card['references']

        if card['card_type'] in ['Ability', 'Passive Ability']:
            simple_card['card_type'] = card['card_type']
            simple_card['card_text'] = strip_html_tags(card['card_text']['english'])

        add_if_key_exists(card['large_image'], 'default', simple_card, 'large_image')

        if 'large_image' in simple_card:
            simple_card['large_image'] = re.sub('https://steamcdn-a.akamaihd.net/apps/583950', '', simple_card['large_image'])

        cards[simple_card['card_id']] = simple_card

    return cards


# Merge spell & ability cards to its parent
def update_card_references(cards):
    for card_id in cards.keys():
        if card_id not in cards:
            continue

        card = cards[card_id]
        if 'references' not in card:
            continue

        for reference in card['references']:
            ref_type = reference['ref_type']
            if ref_type == 'references':
                continue

            ref_card_id = reference['card_id']

            ref_card = cards.get(ref_card_id)

            if ref_type == 'includes':
                card['card_spell'] = {
                    'card_id': ref_card['card_id'],
                    'card_name': ref_card['card_name'],
                    'large_image': ref_card['large_image']
                }
            elif ref_type in ['active_ability', 'passive_ability']:
                if 'card_abilities' not in card:
                    card['card_abilities'] = []

                ability = {
                    'name': ref_card['card_name'],
                    'type': ref_card['card_type'],
                    'text': ref_card['card_text'],
                }

                card['card_abilities'].append(ability)

            # Remove reference card from the set
            cards.pop(ref_card_id, None)

        card.pop('references', None)


# Save cards data into cards.js for the extension
def save_cards_to_file(cards):
    with open("extension/db/cards.js", "w") as f:
        cards_json = json.dumps(cards)
        f.write('var CARDS = ' + cards_json)


def main():
    all_cards = []

    for card_set_id in CARD_SETS:
        url = get_card_set_url(card_set_id)
        cards = get_card_set(url)

        # Merge spell & ability cards to its parent
        update_card_references(cards)

        # Store cards into a list
        for card_id, card in cards.iteritems():
            # Ignore blacklisted cards
            if card_id in BLACKLISTED_CARD:
                continue

            # Ignore cards without image
            if 'large_image' not in card:
                continue

            all_cards.append(card)

    # Save to file
    save_cards_to_file(all_cards)

    print "Saved {} cards.".format(len(all_cards))


if __name__ == "__main__":
    main()
