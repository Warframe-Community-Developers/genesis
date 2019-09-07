'use strict';

const fetch = require('../../../tools/Fetcher');

const Command = require('../../../models/Command');
const WhatsinEmbed = require('../../../embeds/WhatsinEmbed');

const inProgressEmbed = { title: 'Processing search...', color: 0xF1C40F };
const noResultsEmbed = { title: 'No results for that query. Please refine your search.', color: 0xff6961 };
const relicBase = 'https://drops.warframestat.us/data/relics';

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Looks up locations of items
 */
class Whatsin extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.whatsin', 'whatsin', 'Find what\'s in a relic');
    this.regex = new RegExp('^whatsin(?:\\s+(axi|neo|meso|lith)\\s?(\\w\\d+))?', 'i');

    this.usages = [
      {
        description: 'Display what drops from a relic',
        parameters: ['relic'],
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
    let tier = message.strippedContent.match(this.regex)[1];
    let relicName = message.strippedContent.match(this.regex)[2];

    const sentMessage = await message.channel.send('', { embed: inProgressEmbed });
    if (!(tier && relicName)) {
      sentMessage.edit('', { embed: noResultsEmbed });
      return this.messageManager.statuses.FAILURE;
    }
    tier = toTitleCase(tier.trim());
    relicName = toTitleCase(relicName.trim());
    try {
      const relicData = await fetch(`${relicBase}/${tier}/${relicName}.json`);
      if (relicData) {
        sentMessage.edit('', { embed: new WhatsinEmbed(this.bot, relicData, tier, relicName) });
        return this.messageManager.statuses.SUCCESS;
      }
    } catch (error) {
      this.logger.error(error);
    }
    sentMessage.edit('', { embed: noResultsEmbed });
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Whatsin;
