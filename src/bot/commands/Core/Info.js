'use strict';

const Command = require('../../../models/Command');

/**
 * Sets the current guild's custom prefix
 */
class Info extends Command {
  constructor(bot) {
    super(bot, 'core.info', 'info', 'Information about the bot');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx     Message/command context
   * @returns {string} success status
   */
  async run(message, ctx) {
    this.messageManager.embed(message, {
      title: 'Cephalon Genesis',
      fields: [
        {
          name: '\u200B',
          value: 'Feel free to check out [Genesis here](https://discordbots.org/bot/genesis),'
            + '\nAs well as on the [help page](https://genesis.warframestat.us),'
            + '\nand come support Genesis, if you\'re interested, [on patreon](https://patreon.com/cephalongenesis).',
          inline: true,
        },
        {
          name: '\u200B',
          value: `For help information, type \`${ctx.prefix}help\``,
          inline: false,
        },
        {
          name: 'Authors',
          value: 'Tobiah/[TobiTenno](https://github.com/tobitenno) and [nspace](https://github.com/nspacestd)',
        },
        {
          name: 'About',
          value: 'Cephalon Genesis exists to help Discord Tenno find all the information they need about Warframe that you might',
        },
      ],
      footer: {
        text: 'Cephalon Genesis, now on more than 26,000 guilds!',
      },
    }, true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Info;
