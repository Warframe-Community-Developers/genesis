'use strict';

const Handler = require('../../models/BaseEventHandler');
const LogEmbed = require('../../embeds/LogEmbed');

/**
 * Describes a handler
 */
class LogMessageDelete extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.logMessageDeleteBulk', 'messageDeleteBulk');
  }

  /**
   * add the guild to teh Database
   * @param {Discord.Collection<Message>} messages member to add roles to
   */
  async execute(...[messages]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    const first = messages.first();
    let logChannel = this.settings.getGuildSetting(messages.first().guild, 'messageDeleteLog');
    if (first.guild.channels.has(logChannel)) {
      logChannel = first.guild.channels.get(logChannel);
    } else {
      logChannel = undefined;
    }
    if (logChannel && logChannel.type === 'text') {
      const log = new LogEmbed(this.bot, {
        color: 0xFF5A36,
        title: 'Message Deleted',
        fields: [
          {
            name: 'Channel',
            value: `${first.channel} • ${first.channel.id}`,
          },
          {
            name: 'Number Deleted',
            value: messages.size,
          },
        ],
      });
      await logChannel.send({ embed: log });
    }
  }
}

module.exports = LogMessageDelete;
