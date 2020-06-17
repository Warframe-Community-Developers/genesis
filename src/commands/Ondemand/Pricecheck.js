'use strict';

const Command = require('../../models/Command.js');
const PriceCheckEmbed = require('../../embeds/PriceCheckEmbed.js');

const inProgressEmbed = { title: 'Processing search...' };

/**
 * Looks up items from Nexus-stats.com
 */
class PriceCheck extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.pricecheck', 'pricecheck', 'pricecheck', 'WARFRAME');
    this.regex = new RegExp('^p(?:rice)?\\s?c(?:heck)?(?:\\s+([\\w+\\s]+))?', 'i');

    this.usages = [
      {
        description: 'Display an items worth from nexus-stats.com',
        parameters: ['item'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {CommandContext} ctx Command context for calling commands
   * @returns {string} success status
   */
  async run(message, ctx) {
    try {
      const item = message.strippedContent.match(this.regex)[1];
      if (item.length > 16 || item.length < 2) {
        await message.reply('Search has a 16 character limit.');
        return this.messageManager.statuses.FAILURE;
      }

      const sentMessage = await message.channel.send('', { embed: inProgressEmbed });

      const result = await this.ws.pricecheck(item, { platform: ctx.platform });
      if (!result[0]) {
        sentMessage.edit({
          embed: {
            title: 'Pricechecks Temporarily Disabled',
            description: 'There\'s an issue with our upstream data provider. Please check back for prices later.',
          },
        });
        return this.messageManager.statuses.FAILURE;
      }
      const embed = new PriceCheckEmbed(this.bot, result, item);
      sentMessage.edit({ embed });
      return embed.color === 0xff55ff
        ? this.messageManager.statuses.FAILURE : this.messageManager.statuses.SUCCESS;
    } catch (error) {
      this.logger.error(error);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = PriceCheck;
