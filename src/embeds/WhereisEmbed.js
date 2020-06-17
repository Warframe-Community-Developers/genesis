'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class WhereisEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Object} resultsGroups details to derive data from
   * @param {string} query The query that this search corresponds to
   * @param {number} nameWidth Spacing for Names
   * @param {number} relicWidth Spacing for relics
   */
  constructor(bot, resultsGroups, query, nameWidth, relicWidth) {
    super();
    this.fields = [];

    resultsGroups.forEach((results, index) => {
      const mappedResults = results.map((result) => {
        const item = result.item.padEnd(nameWidth, '\u2003');
        const place = (result.place.split('/')[1] || result.place).padEnd(relicWidth, '\u2003');
        const chance = `${result.rarity.charAt(0)}@${result.chance}`;
        return `\`${item} | ${place} | ${chance}\``;
      });

      const value = mappedResults.join('\n');
      if (index > 0) {
        this.fields.push({ name: '\u200B', value });
      } else {
        this.description = value;
      }
    });

    this.title = `${query}`;
    this.color = 0x3498db;
    this.type = 'rich';
  }
}

module.exports = WhereisEmbed;
