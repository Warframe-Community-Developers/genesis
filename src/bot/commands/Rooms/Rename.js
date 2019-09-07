'use strict';

const Command = require('../../../models/Command');
const { isVulgarCheck } = require('../../../CommonFunctions');

/**
 * Rename user's temp room
 */
class Rename extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.rename', 'rename room', 'Rename user\'s temp room.');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');
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
        const newName = message.strippedContent.replace(this.call, '').replace(isVulgarCheck, '').trim(); // remove vulgar
        if (newName.length) {
          if (room.textChannel) {
            await room.textChannel.setName(newName.replace(/\s/ig, '-'), `New name for ${room.textChannel}.`);
          }
          if (room.voiceChannel) {
            await room.voiceChannel.setName(newName, `New name for ${room.textChannel}.`);
          }
          if (room.category) {
            await room.category.setName(newName, `New name for ${room.textChannel}.`);
          }
          await this.messageManager.reply(message, 'Done');
          return this.messageManager.statuses.SUCCESS;
        }
      }
      await this.messageManager.reply(message, `you haven't created a channel. Only the creator of a channel can modify a channel's name.\nUse \`${ctx.prefix}create\` to view channel creation syntax.`, true, true);
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Rename;
