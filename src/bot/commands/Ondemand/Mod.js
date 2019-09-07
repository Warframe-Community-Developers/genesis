'use strict';

const fetch = require('../../../tools/Fetcher');

const Command = require('../../../models/Command');
const BaseEmbed = require('../../../embeds/BaseEmbed.js');
const PatchnotesEmbed = require('../../../embeds/PatchnotesEmbed.js');
// eslint-disable-next-line object-curly-newline
const { setupPages, apiBase, createGroupedArray, emojify } = require('../../../CommonFunctions');

class ModEmbed extends BaseEmbed {
  constructor(bot, modData, query) {
    super();

    this.title = modData.name;
    this.color = 0xC0C0C0;
    this.description = `Mod result for ${query}\n\n${emojify(modData.description)}`;
    this.url = `https://warframe.wikia.com/wiki/${modData.name.replace(/\s/ig, '_')}`;
    this.image = {
      url: `https://cdn.warframestat.us/img/${modData.imageName}`,
    };
    this.fields = [{
      name: 'Polarity',
      value: emojify(modData.polarity.toLowerCase()),
      inline: true,
    }, {
      name: 'Max Rank',
      value: String(modData.fusionLimit),
      inline: true,
    }, {
      name: 'Type',
      value: String(modData.type),
      inline: true,
    }, {
      name: 'Rarity',
      value: modData.rarity,
      inline: true,
    }, {
      name: 'Base Drain',
      value: String(Math.abs(modData.baseDrain)),
      inline: true,
    }, {
      name: 'Tradeable',
      value: modData.tradable ? '✅' : '❌',
      inline: true,
    }];
  }
}

/**
 * Displays mods from the wiki
 */
class Mod extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.mod', 'mod', 'Search the Warframe Wiki for a mod\'s image');
    this.regex = new RegExp('^mod(.+)', 'i');
    this.noResultStr = '```haskell\nNo result for search, Operator. Attempt another search query.```';
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const query = this.regex.exec(message.strippedContent.match(this.regex)[0])[1];
    if (!query) {
      this.messageManager.reply(message, this.noResultStr, true, false);
      return this.messageManager.statuses.FAILURE;
    }

    try {
      const results = await fetch(`${apiBase}/mods/search/${query}`);
      if (results.length > 0) {
        const pages = [];
        results.forEach((result) => {
          pages.push(new ModEmbed(this.bot, result, query));
          if (result.patchlogs && result.patchlogs.length) {
            createGroupedArray(result.patchlogs, 4).forEach((patchGroup) => {
              pages.push(new PatchnotesEmbed(this.bot, patchGroup));
            });
          }
        });

        await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
        return this.messageManager.statuses.SUCCESS;
      }
      this.messageManager.reply(message, this.noResultStr, true, false);
      return this.messageManager.statuses.FAILURE;
    } catch (e) {
      this.logger.error(e);
      this.messageManager.reply(message, this.noResultStr, true, false);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = Mod;
