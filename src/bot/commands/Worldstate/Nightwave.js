'use strict';

const Command = require('../../../models/Command');
const NightwaveEmbed = require('../../../embeds/NightwaveEmbed.js');
const { captures } = require('../../../CommonFunctions');

/**
 * Displays the currently active alerts
 */
class Nightwave extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.nightwave', 'nightwave', 'Display the currently active nightwave season');
    this.regex = new RegExp(`^${this.call}s?\\s?(?:on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(captures.platforms, 'ig'));
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    await this.messageManager
      .embed(message, new NightwaveEmbed(this.bot, await this.ws.get('nightwave', platform, ctx.language), platform, ctx.i18n), true, true);

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Nightwave;
