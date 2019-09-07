'use strict';

const Command = require('../../../models/InlineCommand.js');
const VoidTraderEmbed = require('../../../embeds/VoidTraderEmbed.js');

const { createGroupedArray } = require('../../../CommonFunctions');

/**
 * Displays the currently active Invasions
 */
class Baro extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'borko', 'when borko', 'Display the current status of the Void Trader');
    this.regex = new RegExp('(?:where|when|whe|why|which).*(?:borko|baro|bimjo|bonko|bilbo|bermo|barmo|bruno|borso|borneo|bosnia|beerr?ow)', 'ig');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const embed = new VoidTraderEmbed(this.bot, await this.ws.get('voidTrader', platform, ctx.language), platform);
    if (embed.fields.length > 25) {
      const fields = createGroupedArray(embed.fields, 15);
      fields.forEach(async (fieldGroup) => {
        const tembed = Object.assign({}, embed);
        tembed.fields = fieldGroup;
        await this.messageManager.embed(message, tembed, false, true);
        await this.broadcaster.broadcast(tembed, platform, 'baro', null);
      });
    } else {
      await this.messageManager.embed(message, embed, false, true);
    }
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Baro;
