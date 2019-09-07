'use strict';

const Command = require('../../../models/Command');

/**
 * Change channel visibility
 */
class Show extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.lurk', 'lurk', 'Make room lurkable. Users can join, see, and listen, but not write.');
    this.regex = new RegExp(`^${this.call}$`, 'i');
    this.usages = [];
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx Command context for calling commands
   * @returns {string} success status
   */
  async run(message, ctx) {
    if (ctx.createPrivateChannel) {
      const userHasRoom = await this.settings.userHasRoom(message.member);
      if (userHasRoom) {
        const room = await this.settings.getUsersRoom(message.member);
        const everyone = message.guild.defaultRole;
        const options = {
          VIEW_CHANNEL: true, CONNECT: true, SPEAK: false, SEND_MESSAGES: false,
        };
        try {
          if (room.category) {
            room.category.updateOverwrite(everyone, options, `Room made lurkable by ${message.author.tag}`);
          }
          if (room.textChannel) {
            room.textChannel.updateOverwrite(everyone, options, `Room made lurkable by ${message.author.tag}`);
          }
          await room.voiceChannel.updateOverwrite(everyone, options, `Room made lurkable by ${message.author.tag}`);
          return this.messageManager.statuses.SUCCESS;
        } catch (e) {
          this.logger.error(e);
          await this.messageManager.reply(message, 'unable to make the channel visible. Please either try again or review your command to ensure it is valid.', true, true);
          return this.messageManager.statuses.FAILURE;
        }
      }
      await this.messageManager.reply(message, `you haven't created a channel. Only the creator of a channel can change the status of a channel.\nUse \`${ctx.prefix}create\` to view channel creation syntax.`, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Show;
