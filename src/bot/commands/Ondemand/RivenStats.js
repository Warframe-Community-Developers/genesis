'use strict';

const fetch = require('../../../tools/Fetcher');

const RivenStatEmbed = require('../../../embeds/RivenStatEmbed');
const Command = require('../../../models/Command');
const { apiBase, setupPages } = require('../../../CommonFunctions');

/**
 * Displays the stats for a warframe
 */
class FrameStats extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.rivens', 'riven', 'Get current riven sales stats');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');
    this.usages = [
      {
        description: 'Get stats for a Weapon riven',
        parameters: ['riven name'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {CommandContext} ctx Command Context object, with settings, platform, locale, etc
   * @returns {string} success status
   */
  async run(message, ctx) {
    let weapon = message.strippedContent.match(this.regex)[1];

    if (weapon) {
      weapon = weapon.trim().toLowerCase();
      const results = await fetch(`${apiBase}/${ctx.platform}/rivens/search/${weapon}`);
      if (Object.keys(results).length > 0) {
        const pages = [];

        Object.keys(results).forEach((resultKey) => {
          pages.push(new RivenStatEmbed(this.bot, results[resultKey], resultKey, ctx.i18n));
        });

        await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
        return this.messageManager.statuses.SUCCESS;
      }
      this.messageManager.reply(message, `No results for ${weapon}`, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    this.messageManager.reply(message, 'No query specified', true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = FrameStats;
