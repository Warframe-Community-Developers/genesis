'use strict';

const Handler = require('../../models/BaseEventHandler');

class JoinNotify extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.server.join', 'guildCreate');
  }

  /**
   * Run the handle
   * @param {GuildMember} member guildMember to welcome
   */
  async execute(...[guild]) {
    this.logger.debug(`Running ${this.id} for ${this.event}. Params: ${guild}`);
    const bots = guild.members.filter(member => member.user.bot);

    const tokens = [
      `${guild.name} (${guild.id})`,
      `**Owner:** ${guild.owner.user.username}#${guild.owner.user.discriminator} (${guild.ownerID})`,
      `**Members:** ${guild.memberCount}`,
      `**Bots:** ${bots.size}`,
      `**Percent:** ${((bots.size / (guild.memberCount)) * 100).toFixed(2)}%`,
      `**Created:** ${guild.createdAt.toLocaleString('en-US', { timeZone: 'America/Chicago' })}`,
    ];
    try {
      this.bot.controlHook.send({
        embeds: [{
          color: 0x00d62e,
          title: 'Joined Server',
          description: tokens.join('\n'),
          thumbnail: {
            url: guild.iconURL(),
          },
          footer: {
            text: guild.id,
          },
          timestamp: new Date(),
        }],
      });
    } catch (e) {
      this.bot.logger.error(e);
    }
  }
}

module.exports = JoinNotify;
