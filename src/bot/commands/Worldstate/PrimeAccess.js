'use strict';

const Command = require('../../../models/Command');
const PrimeAccessEmbed = require('../../../embeds/NewsEmbed.js');
const { captures } = require('../../../CommonFunctions');

/**
 * Displays the currently active warframe prime access news
 */
class PrimeAccess extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.primeaccess', 'primeaccess', 'Display the currently active prime access news');
    this.regex = new RegExp(`^prime\\s?access(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const news = (this.ws.get('news', platform, ctx.language)).filter(n => n.primeAccess && n.translations.en);
    await this.messageManager.embed(message, new PrimeAccessEmbed(this.bot, news, 'primeaccess', platform), true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = PrimeAccess;
