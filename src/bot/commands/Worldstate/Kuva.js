'use strict';

const Command = require('../../../models/Command');
const KuvaEmbed = require('../../../embeds/KuvaEmbed.js');
const { captures } = require('../../../CommonFunctions');

/**
 * Displays the currently active kuva missions
 */
class Kuva extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.kuva', 'kuva', 'Display the currently active kuva missions');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(captures.platforms, 'ig'));
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const kuva = (await this.ws.get('kuva', platform, ctx.language));

    if (!kuva.length) {
      this.messageManager.reply(message, ctx.i18n`No Kuva Missions Active`, true, true);
    }

    await this.messageManager
      .embed(message, new KuvaEmbed(this.bot, kuva, platform, ctx.i18n), true, true);

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Kuva;
