'use strict';

const Command = require('../../../models/Command');
const EnableUsageEmbed = require('../../../embeds/EnableUsageEmbed.js');
const EnableInfoEmbed = require('../../../embeds/EnableInfoEmbed.js');
const {
  getChannels, getTarget, captures, createGroupedArray,
} = require('../../../CommonFunctions');

const commandIdRegex = /(\w*\.*\w*\.*\w*\*?)/ig;
const locationRegex = new RegExp(`(?:\\s+in\\s+(${captures.channel}|here|\\*))`, 'ig');
const appliesToRegex = new RegExp(`(?:\\s+for\\s(${captures.user}|${captures.role}|\\*))?`, 'ig');

class Disable extends Command {
  constructor(bot) {
    super(bot, 'settings.disable', 'disable', 'Disable a command.');
    this.usages = [
      { description: 'Disable a command for a role in a channel or channels', parameters: ['command id> in <channel> for <role|user'] },
    ];
    this.regex = new RegExp(
      `^${this.call}`,
      'i',
    );
    this.blacklistable = false;
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const commandIdResults = message.strippedContent.match(commandIdRegex)
      .filter(str => str && !(str === this.call) && str.trim().length);
    const commandIdResult = commandIdResults.length ? commandIdResults[0] : undefined;
    const channelResult = (message.strippedContent.match(locationRegex) || ['', 'here'])[0].replace('in', '').replace(/<#/g, '').replace(/>/g, '').trim();
    const t = message.strippedContent.match(appliesToRegex).filter(str => str.length);
    const targetResult = (t.length ? t : [message.guild.defaultRole.id])[0]
      .replace(/<@&?/g, '').replace(/>/g, '').replace('for', '').trim();
    const commands = this.getCommandsToEnable(commandIdResult).filter(command => command);
    let channels = [];

    channels = getChannels(message.mentions.channels.length > 0
      ? message.mentions.channels : channelResult, message);
    channels = channels.filter(channel => typeof channel !== 'undefined' && channel !== null);
    if (!channels.length) {
      channels = [message.channel];
    }

    // targets
    let target = {};
    target = getTarget(
      targetResult, message.mentions ? message.mentions.roles : [],
      message.mentions ? message.mentions.users : [], message,
    );

    if (!commands.length) {
      this.messageManager.embed(message, new EnableUsageEmbed(this.bot, [
        commandIdResult,
        channelResult,
        targetResult,
      ], 0), true, false);
      return this.messageManager.statuses.FAILURE;
    }

    const results = [];
    const toChange = {};
    // set the stuff
    commands.forEach((command) => {
      channels.forEach((channel) => {
        if (!channel) return;
        try {
          if (!toChange[channel.id]) {
            toChange[channel.id] = {
              roles: {},
              members: {},
            };
          }
          if (target.type === 'Role') {
            if (!toChange[channel.id].roles[target.id]) {
              toChange[channel.id].roles[target.id] = [];
            }
            toChange[channel.id].roles[target.id].push(command);
          } else {
            if (!toChange[channel.id].members[target.id]) {
              toChange[channel.id].members[target.id] = [];
            }
            toChange[channel.id].members[target.id].push(command);
          }
        } catch (error) {
          this.logger.error(error);
        }
      });
    });

    Object.keys(toChange).forEach((channelId) => {
      const channel = toChange[channelId];
      if (Object.keys(channel.roles).length) {
        Object.keys(channel.roles).forEach((roleId) => {
          const commandIds = channel.roles[roleId];
          const cmdIdGroups = createGroupedArray(commandIds, 50);
          cmdIdGroups.forEach((group) => {
            results.push(this.settings.setChannelPermissionForRole(channelId, roleId, group, 0));
          });
        });
      }

      if (Object.keys(channel.members).length) {
        Object.keys(channel.members).forEach((memberId) => {
          const commandIds = channel.members[memberId];
          const cmdIdGroups = createGroupedArray(commandIds, 50);
          cmdIdGroups.forEach((group) => {
            results.push(
              this.settings.setChannelPermissionForMember(channelId, memberId, group, 0),
            );
          });
        });
      }
    });

    await Promise.all(results);
    // notify info embed
    const infoEmbed = new EnableInfoEmbed(this.bot, 0, [commands, channels, target.toString()]);
    const respondToSettings = await this.settings
      .getChannelSetting(message.channel, 'respond_to_settings');
    if (respondToSettings) {
      this.messageManager.embed(message, infoEmbed, true, false);
    }
    return this.messageManager.statuses.SUCCESS;
  }

  /**
   * Get the list of commands based on input
   * @param {string} commandIdParam parameter for determining commands
   * @returns {Array<string>} command ids to enable
   */
  getCommandsToEnable(commandIdParam) {
    const commandsToEnable = [];
    const escapedId = commandIdParam.trim().replace('.', '\\.').replace('*', '.*');
    const commandRegex = new RegExp(escapedId, 'i');
    const commands = this.commandManager.commands
      .concat(this.commandManager.inlineCommands || [])
      .concat(this.commandManager.customCommands || []);
    commands.forEach((command) => {
      if (commandRegex.test(command.id) && command.blacklistable) {
        commandsToEnable.push(command.id);
      } else {
        this.logger.debug(`not including (${command.blacklistable ? '' : 'Not '}Blacklistable) ${command.id}`);
      }
    });
    return commandsToEnable;
  }
}

module.exports = Disable;
