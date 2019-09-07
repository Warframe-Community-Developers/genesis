'use strict';

const { Permissions } = require('discord.js');
const Command = require('../../../models/Command');
const { getUsersForCall, isVulgarCheck } = require('../../../CommonFunctions');

/**
 * Array of useable channel values
 * @type {Array.<String>}
 */
const useable = ['room', 'raid', 'team', 'chat'];

/**
 * Regex describing custom channel names
 * @type {RegExp}
 */
const channelNameRegex = new RegExp('-n\\s+(.+)', 'ig');
/**
 * Regex describing no text being desired
 * @type {RegExp}
 */
const noTextRegex = new RegExp('--no-text', 'ig');
/**
 * Regex describing a public channel
 * @type {RegExp}
 */
const publicRegex = new RegExp('--public', 'ig');

/**
 * Regex describing a locked channel
 * @type {RegExp}
 */
const lockedRegex = new RegExp('--locked', 'ig');

/**
 * Regex describing text being desired
 * @type {RegExp}
 */
const textRegex = new RegExp('--text', 'ig');

/**
 * Regex describing channels being hidden
 * @type {RegExp}
 */
const hiddenRegex = new RegExp('--hidden', 'ig');

/**
 * Regex describing channels being shown
 * @type {RegExp}
 */
const shownRegex = new RegExp('--shown', 'ig');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class Create extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.create', 'create', 'Create a temporary room.');
    this.regex = new RegExp(`^${this.call}\\s?(room|raid|team|chat)?(\\w|-)?(?:-n(.+))?(--no-text)?(--public)?(--text)?(--hidden)?(--shown)?`, 'i');

    this.usages = [
      { description: 'Display instructions for creating temporary rooms', parameters: [] },
      {
        description: 'Create temporary text and voice channels for the calling user.',
        parameters: ['room | raid | team'],
      },
      {
        description: 'Create temporary text and voice channels for the calling user and any mentioned users/roles.',
        parameters: ['room | raid | team', 'users and/or role'],
      },
      {
        description: 'Create temporary text and voice channels for the calling user and any mentioned users/roles, with a custom name',
        parameters: ['room | raid | team', 'users and/or role', '-n name', '--no-text', '--public', '--text', '--locked'],
      },
    ];

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
    let isPublic;
    if (lockedRegex.test(message.strippedContent)) {
      isPublic = false;
    } else if (publicRegex.test(message.strippedContent)) {
      isPublic = true;
    } else {
      isPublic = !ctx.defaultRoomsLocked;
    }

    let useText;
    if (textRegex.test(message.strippedContent)) {
      useText = true;
    } else if (noTextRegex.test(message.strippedContent)) {
      useText = false;
    } else {
      useText = !ctx.defaultNoText;
    }

    let shown = false;
    if (shownRegex.test(message.strippedContent)) {
      shown = true;
    } else if (hiddenRegex.test(message.strippedContent)) {
      shown = false;
    } else {
      shown = ctx.defaultShown;
    }

    const modRole = message.guild.roles.get(await this.settings.getGuildSetting(message.guild, 'modRole'));
    const useModRole = modRole && modRole.id ? message.guild.roles.has(modRole.id) : false;

    if (ctx.tempCategory || (message.guild && message.guild.channels.has(ctx.tempCategory))) {
      useText = false;
    }

    const type = message.strippedContent.match(this.regex)[1];
    const namingResults = message.strippedContent.match(channelNameRegex);
    const userHasRoom = await this.settings.userHasRoom(message.member);

    let optName = (namingResults ? namingResults[0] : '')
      .replace('-n ', '').replace('--public', '')
      .replace('--locked', '').replace('--no-text', '')
      .replace('--text', '')
      .replace('--shown', '')
      .replace('--hidden', '')
      .trim();
    optName = optName.replace(isVulgarCheck, ''); // remove vulgar

    if (ctx.createPrivateChannel) {
      if (userHasRoom) {
        await this.messageManager.reply(message, `you already have a private room registered. If this is in error, please log a bug report with \`${ctx.prefix}bug\`.`, true, true);
        return this.messageManager.statuses.FAILURE;
      }
      if (type) {
        const roomType = type.trim();
        if (useable.includes(roomType)) {
          const users = getUsersForCall(message);
          const name = optName || `${type}-${message.member.displayName}`.toLowerCase();
          if (users.length < 11 && !message.guild.channels.find(channel => channel.name === name)) {
            const overwrites = this.createOverwrites({
              users,
              everyone: message.guild.defaultRole,
              author: message.author,
              isPublic,
              useModRole,
              modRole,
              shown,
            });
            let category;
            if (!ctx.tempCategory
              || !(message.guild && message.guild.channels.has(ctx.tempCategory.id))) {
              category = await message.guild.channels.create(name, {
                name,
                type: 'category',
                permissionOverwrites: overwrites,
              });
            } else {
              category = ctx.tempCategory;
            }

            let textChannel;
            if (useText) {
              textChannel = await message.guild.channels.create(name.replace(/[^\w|-]/ig, ''), {
                name: name.replace(/[^\w|-]/ig, ''),
                type: 'text',
                parent: category.id,
                permissionOverwrites: overwrites,
              });
            }

            const voiceChannel = await message.guild.channels.create(name, {
              name,
              type: 'voice',
              parent: category.id,
              permissionOverwrites: overwrites,
            });

            // add channel to listenedChannels
            await this.settings
              .addPrivateRoom(
                message.guild, textChannel, voiceChannel,
                category === ctx.tempCategory ? { id: 0 } : category, message.member,
              );
            // send users invite link to new rooms
            this.sendInvites(voiceChannel, users, message.author);
            // set room limits
            this.setLimits(voiceChannel, roomType);
            this.makeInteractable(textChannel, message);
            this.messageManager.embed(message, {
              title: 'Channels created',
              fields: [{
                name: '\u200B',
                value: `Voice Channel: ${voiceChannel.name}${
                  textChannel ? `\nText Channel: ${textChannel}` : ''}`,
              }],
            }, false, false);
            return this.messageManager.statuses.SUCCESS;
          }
          let msg = '';
          if (users.length > 10) {
            // notify caller that there's too many users if role is more than 10 people.
            msg = 'you are trying to send an invite to too many people, please keep the total number under 10';
          } else {
            msg = 'that room already exists.';
          }
          await this.messageManager.reply(message, msg, true, true);
          return this.messageManager.statuses.FAILURE;
        }
      } else {
        await this.messageManager.reply(
          message, '```haskell\n'
            + 'Sorry, you need to specify what you want to create. Right now these are available to create:'
            + `\n* ${useable.join('\n* ')}\n\`\`\``,
          true, false,
        );
        return this.messageManager.statuses.FAILURE;
      }
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
    if (voiceChannel.permissionsFor(this.bot.client.user).has('CREATE_INSTANT_INVITE')) {
      const invite = await voiceChannel.createInvite({ maxUses: users.length });
      for (const user of users) {
        this.messageManager.sendDirectMessageToUser(user, `Invite for ${voiceChannel.name} from ${author}: ${invite}`, false);
      }
    }
  }

  /**
   * Create an array of permissions overwrites for the channel
   * @param {Array.<User>} users            Array of users for whom to allow into channels
   * @param {RoleResolvable} everyone   RoleResolvable for the @everyone role
   * @param {User} author                   User object for creator of room
   * @param {boolean} isPublic              Whether or not this channel will be public
   * @param {boolean} shown                 Whether or not this channel will be visible
   * @param {boolean} useModRole            Whether or not to leverage the mod role
   * @param {boolean} modRole               Moderator role that can manage the channel
   * @returns {Array.<PermissionsOVerwrites>}
   */
  createOverwrites({
    users, everyone, author, isPublic, shown, useModRole, modRole,
  }) {
    // create overwrites
    const overwrites = [];
    // this still doesn't work, need to figure out why
    this.logger.debug(`creating overwrites: ${isPublic} | ${shown}`);
    if (!isPublic) {
      const evOverwrites = [Permissions.FLAGS.CONNECT];
      if (!shown) {
        evOverwrites.push(Permissions.FLAGS.CONNECT);
      }
      overwrites.push({
        id: everyone,
        deny: evOverwrites,
        type: 'role',
      });
      overwrites.push({
        allow: [
          Permissions.FLAGS.VIEW_CHANNEL,
          Permissions.FLAGS.SEND_MESSAGES,
          Permissions.FLAGS.CONNECT,
          Permissions.FLAGS.MUTE_MEMBERS,
          Permissions.FLAGS.DEAFEN_MEMBERS,
          Permissions.FLAGS.MOVE_MEMBERS,
          Permissions.FLAGS.MANAGE_ROLES,
          Permissions.FLAGS.MANAGE_CHANNELS,
        ],
        id: this.bot.client.user.id,
        type: 'user',
      });
      // set up overwrites per-user
      users.forEach((user) => {
        overwrites.push({
          id: user.id,
          allow: [
            Permissions.FLAGS.VIEW_CHANNEL,
            Permissions.FLAGS.SEND_MESSAGES,
            Permissions.FLAGS.CONNECT,
            Permissions.FLAGS.SPEAK,
            Permissions.FLAGS.USE_VAD,
          ],
          type: 'user',
        });
      });
      overwrites.push({
        id: author.id,
        allow: [
          Permissions.FLAGS.VIEW_CHANNEL,
          Permissions.FLAGS.SEND_MESSAGES,
          Permissions.FLAGS.CONNECT,
          Permissions.FLAGS.SPEAK,
          Permissions.FLAGS.USE_VAD,
          Permissions.FLAGS.MANAGE_MESSAGES,
        ],
        type: 'user',
      });
      // Add mod role overwrites if one is present
      if (useModRole) {
        overwrites.push({
          id: modRole.id,
          allow: [
            Permissions.FLAGS.VIEW_CHANNEL,
            Permissions.FLAGS.SEND_MESSAGES,
            Permissions.FLAGS.CONNECT,
            Permissions.FLAGS.SPEAK,
            Permissions.FLAGS.USE_VAD,
            Permissions.FLAGS.MANAGE_MESSAGES,
            Permissions.FLAGS.DEAFEN_MEMBERS,
            Permissions.FLAGS.MOVE_MEMBERS,
          ],
          type: 'role',
        });
      }
    } else {
      overwrites.push({
        id: everyone,
        allow: [
          Permissions.FLAGS.VIEW_CHANNEL,
          Permissions.FLAGS.CONNECT,
        ],
        type: 'role',
      });
    }
    return overwrites;
  }

  /**
   * Set user limit for channel
   * @param  {Discord.VoiceChannel}  voiceChannel voice channel to mutate limit
   * @param  {string}  type         level of voice channel, determines limit
   */
  async setLimits(voiceChannel, type) {
    let limit;
    switch (type) {
      case 'team':
        limit = 4;
        break;
      case 'raid':
        limit = 8;
        break;
      case 'chat':
      case 'room':
      default:
        break;
    }
    if (limit) {
      await voiceChannel.setUserLimit(limit);
    }
    this.logger.debug(`User limit set to ${limit || 'none'} for ${voiceChannel.name}`);
  }

  /**
   * Allows the creator of the channel to call room commands in the text channel,
   *  if one exits
   * @param  {Discord.VoiceChannel}  textChannel text channel to allow commands in
   * @param  {Discord.Message}  message     message to copy and use to call command
   */
  async makeInteractable(textChannel, message) {
    if (!textChannel) return;
    const allowCmd = await this.bot.commandManager
      .loadCommand(this.bot.commandManager.commands
        .find(cmd => cmd.id === 'settings.allowprivateroom'));

    const msgClone = Object.assign({}, message);
    msgClone.strippedContent = `${allowCmd.call} on`;
    msgClone.channel = textChannel;
    msgClone.guild = message.guild;
    await allowCmd.run(msgClone);
  }
}

module.exports = Create;
