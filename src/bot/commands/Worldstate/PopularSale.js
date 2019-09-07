'use strict';

const Command = require('../../../models/Command');
const SalesEmbed = require('../../../embeds/SalesEmbed.js');
const { captures } = require('../../../CommonFunctions');

/**
 * Displays current popular sales
 */
class PopularDeal extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.populardeals', 'popular deal', 'Displays current featured deals');
    this.regex = new RegExp(`^popular\\s?deals?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const sales = (await this.ws.get('flashSales', platform, ctx.language))
      .filter(popularItem => popularItem.isPopular);
    await this.messageManager.embed(
      message,
      new SalesEmbed(this.bot, sales, platform), true, false,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = PopularDeal;
