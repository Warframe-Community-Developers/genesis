'use strict';

const Command = require('../../../models/Command');
const WhereisEmbed = require('../../../embeds/WhereisEmbed.js');
const { createGroupedArray, createPageCollector } = require('../../../CommonFunctions.js');

const inProgressEmbed = { title: 'Processing search...', color: 0xF1C40F };
const noResultsEmbed = { title: 'No results for that query. Please refine your search.', description: 'This is either due to the item being vaulted or an invalid search. Sorry.', color: 0xff6961 };

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Looks up locations of items
 */
class Whereis extends Command {
  constructor(bot) {
    super(bot, 'warframe.misc.whereis', 'whereis', 'Find where something drops');
    this.regex = new RegExp('^where\\s?(?:is\\s?)?(.+)?', 'i');

    this.usages = [
      {
        description: 'Display where something drops from',
        parameters: ['item'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    let query = message.strippedContent.match(this.regex)[1];
    const sentMessage = await message.channel.send('', { embed: inProgressEmbed });
    if (!query) {
      await sentMessage.edit('', { embed: noResultsEmbed });
      return this.messageManager.statuses.FAILURE;
    }
    try {
      query = query.trim().toLowerCase();
      const queryWReplaces = query.replace(/prime/ig, 'p.').replace(/blueprint/ig, 'bp');
      let results = await this.ws.search('drops', queryWReplaces);

      results = results.map(result => ({
        item: result.item,
        rarity: result.rarity,
        chance: `${String(parseFloat(result.chance).toFixed(2)).padEnd(5, '0')}%`,
        place: result.place
          .replace('Level ', '')
          .replace('Orb Vallis Bounty', 'Bounty')
          .replace('Cetus Bounty', 'Bounty')
          .trim(),
      }));

      const longestName = results.length ? results.map(result => result.item)
        .reduce((a, b) => (a.length > b.length ? a : b)) : '';
      const longestRelic = results.length ? results.map(result => result.place)
        .reduce((a, b) => (a.length > b.length ? a : b)) : '';
      query = toTitleCase(query.trim());
      const embeds = [];
      createGroupedArray(results, 20).forEach((group, index) => {
        const embed = new WhereisEmbed(
          this.bot, createGroupedArray(group, 10),
          query, longestName.length, longestRelic.length,
        );
        embeds.push(embed);
        if (index === 0) {
          sentMessage.edit({ embed });
        }
      });
      await createPageCollector(sentMessage, embeds, message.author);
      if (results.length > 0) {
        return this.messageManager.statuses.SUCCESS;
      }
    } catch (error) {
      this.logger.error(error);
    }
    await sentMessage.edit('', { embed: noResultsEmbed });
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Whereis;
