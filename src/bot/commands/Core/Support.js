'use strict';

const Command = require('../../../models/Command');

/**
 * Sets the current guild's custom prefix
 */
class Untrack extends Command {
  constructor(bot) {
    super(bot, 'core.support', 'support', 'Support info about the bot');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    this.messageManager.embed(message, {
      title: 'Cephalon Genesis',
      fields: [
        {
          name: '\u200B',
          value: 'Genesis is an open-source and freely provided bot and service,'
            + '\nbut any help towards subsidizing development and server costs helps out.'
            + '\nCome support Genesis [on patreon](https://patreon.com/cephalongenesis) if you\'re interested.'
            + '\nWe also love and welcome direct [Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2SHK99GUPGRFS)'
            + ' and [Bitcoin](bitcoin:1HU6BtbsJu3ttbc2qKGFGR2hQpou9JSkjB) support,\nbecause we know one way doesn\'t fit all.',
          inline: true,
        },
        {
          name: 'Authors',
          value: 'Tobiah/[aliasfalse](https://github.com/aliasfalse) and [nspace](https://github.com/nspacestd)',
        },
      ],
      footer: {
        icon_url: 'https://cdn.discordapp.com/avatars/123591822579597315/f95aad1bc1eefcf7514649209fde9d97.png',
        text: 'Cephalon Genesis, on more than 12600 guilds!',
      },
    }, true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Untrack;
