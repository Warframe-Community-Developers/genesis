'use strict';

const Command = require('../../../models/Command');
const { getUsersForCall } = require('../../../CommonFunctions');

/**
 * Invite people to temp voice/text/category
 */
class Invite extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.invite', 'invite', 'Invite user to temp room');
    this.regex = new RegExp(`^${this.call}`, 'i');
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
        const users = getUsersForCall(message, true);
        const permOverwrite = {
          VIEW_CHANNEL: true,
          SEND_MESSAGES: true,
          CONNECT: true,
          SPEAK: true,
          USE_VAD: true,
          MANAGE_CHANNELS: false,
        };
        try {
          if (room.category) {
            await Promise.all(users.map(async user => room.category.updateOverwrite(user, permOverwrite, `Invitation from ${message.author.tag}`)));
          }
          if (room.voiceChannel) {
            await Promise.all(users.map(async user => room.voiceChannel.updateOverwrite(user, permOverwrite, `Invitation from ${message.author.tag}`)));
          }
          if (room.textChannel) {
            await Promise.all(users.map(async user => room.textChannel.updateOverwrite(user, permOverwrite, `Invitation from ${message.author.tag}`)));
          }
          // send users invite link to new rooms
          this.sendInvites(room.voiceChannel, users, message.author);
          return this.messageManager.statuses.SUCCESS;
        } catch (e) {
          this.logger.error(e);
          await this.messageManager.reply(message, 'unable to invite desired users. Please either try again or review your invitations to ensure they are valid users.', true, true);
          return this.messageManager.statuses.FAILURE;
        }
      }
      await this.messageManager.reply(message, `you haven't created a channel. Only the creator of a channel can invite.\nUse \`${ctx.prefix}create\` to view channel creation syntax.`, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.FAILURE;
  }

  /**
   * Send channel invites to users who were tagged in message
   * @param {VoiceChannel} voiceChannel Voice channel to create invites for
   * @param {Array.<User>} users Array of users to send invites to
   * @param {User} author Calling user who sends message
   */
  async sendInvites(voiceChannel, users, author) {
    try {
      if (voiceChannel.permissionsFor(this.bot.client.user).has('CREATE_INSTANT_INVITE')) {
        const invite = await voiceChannel.createInvite({ maxUses: users.length });
        for (const user of users) {
          this.messageManager.sendDirectMessageToUser(user, `Invite for ${voiceChannel.name} from ${author}: ${invite}`, false);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
}

module.exports = Invite;
