'use strict';

const Command = require('../../../models/Command');

/**
 * Rename user's temp room
 */
class Destroy extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.destry', 'destroy room', 'Destry user\'s temp room.');
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
        if (room.textChannel && room.textChannel.deletable) {
          this.logger.debug(`Deleting text channel... ${room.textChannel.id}`);
          await room.textChannel.delete();
        }
        if (room.voiceChannel && room.voiceChannel.deletable) {
          this.logger.debug(`Deleting voice channel... ${room.voiceChannel.id}`);
          await room.voiceChannel.delete();
        }
        if (room.category && room.category.deletable) {
          this.logger.debug(`Deleting category... ${room.category.id}`);
          await room.category.delete();
        }
        await this.settings.deletePrivateRoom(room);
        if (!message.channel.deleted) {
          await this.messageManager.reply(message, 'done.', true, true);
        }
        return this.messageManager.statuses.SUCCESS;
      }
      await this.messageManager.reply(message, `you haven't created a room. Only the creator of a room can destroy a room.\nUse \`${ctx.prefix}create\` to view channel creation syntax.`, true, true);
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Destroy;
