'use strict';

const Command = require('../../../models/Command');
const DarvoEmbed = require('../../../embeds/DarvoEmbed.js');
const { captures } = require('../../../CommonFunctions');

/**
 * Displays today's Darvo deal
 */
class Darvo extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.darvo', 'darvo', 'Displays today\'s Darvo deal');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    await this.messageManager.embed(message, new DarvoEmbed(this.bot,
      (await this.ws.get('dailyDeals'))[0], platform, ctx.language), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Darvo;
