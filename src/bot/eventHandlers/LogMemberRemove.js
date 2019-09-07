'use strict';

const Handler = require('../../models/BaseEventHandler');
const LogEmbed = require('../../../embeds/LogEmbed');

/**
 * Describes a handler
 */
class LogMemberRemove extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.logMemberRemove', 'guildMemberRemove');
  }

  /**
   * @param {Discord.Message} message member that was remvoed, left, or kicked
   */
  async execute(...[member]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    let logChannel = await this.settings.getGuildSetting(member.guild, 'memberRemoveLog');
    if (member.guild.channels.has(logChannel)) {
      logChannel = member.guild.channels.get(logChannel);
    } else {
      logChannel = undefined;
    }
    if (logChannel && logChannel.type === 'text') {
      const log = new LogEmbed(this.bot, {
        color: 0xffa500,
        title: 'Member Left/Kicked',
        fields: [
          {
            name: 'Member',
            value: `${member} • ${member.id}`,
          },
        ],
      });
      await logChannel.send({ embed: log });
    }
  }
}

module.exports = LogMemberRemove;
