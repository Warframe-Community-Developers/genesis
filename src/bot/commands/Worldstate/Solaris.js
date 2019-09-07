'use strict';

const Command = require('../../../models/Command');
const SolarisEmbed = require('../../../embeds/SolarisEmbed');
const { captures } = require('../../../CommonFunctions');

class Solaris extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.solaris', 'solaris', 'Display the currently active Solaris bounties');
    this.regex = new RegExp(`^${this.call}s?\\s?(?:on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(/[pcsxb14]{2,3}/ig);
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const solaris = (await this.ws.get('syndicateMissions', platform, ctx.language)).filter(m => m.syndicate === 'Solaris United');
    const vallis = await this.ws.get('vallisCycle', platform, ctx.language);
    if (solaris && solaris.length) {
      [vallis.bounty] = solaris;
    }

    // make the embed
    this.messageManager.embed(message, new SolarisEmbed(this.bot, vallis), true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Solaris;
