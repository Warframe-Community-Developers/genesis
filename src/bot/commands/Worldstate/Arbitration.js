'use strict';

const Command = require('../../../models/Command');
const ArbitrationEmbed = require('../../../embeds/ArbitrationEmbed.js');
const { captures } = require('../../../CommonFunctions');

/**
 * Displays the currently active alerts
 */
class Arbitration extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.arbitration', 'arbi', 'Display the currently active arbitration');
    this.regex = new RegExp(`^${this.call}(?:tration)?$`);
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(captures.platforms, 'ig'));
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const arbi = (await this.ws.get('arbitration', platform, ctx.language));

    if (!arbi) {
      this.messageManager.reply(message, ctx.i18n`No Arbitration Mission Active`, true, true);
    }

    await this.messageManager
      .embed(message, new ArbitrationEmbed(this.bot, arbi, platform, ctx.i18n), true, true);

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Arbitration;
