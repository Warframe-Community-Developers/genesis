'use strict';

const Command = require('../../models/Command.js');

/**
 * Get a role from the matching string
 * @param  {string} string      String to use to search for role
 * @param  {Message} message    originating message
 * @returns {Role|null}         Role
 */
const getRoleForString = (string, message) => {
  const trimmedString = string.trim();
  const roleFromId = message.guild.roles.cache.get(trimmedString);
  let roleFromName;
  if (typeof roleFromId === 'undefined') {
    roleFromName = message.guild.roles.cache
      .find(item => item.name.toLowerCase() === trimmedString.toLowerCase());
  }
  return roleFromId || roleFromName || null;
};

/**
 * Determine the reason a user can't leave a role
 * @param  {boolean}  userDoesntHaveRole   whether or not a user has the specified role
 * @param  {boolean} leaveable       whether or not the user has the minimum role
 * @returns {string}                       description to use on the embed
 */
const determineDescription = (userDoesntHaveRole, leaveable) => {
  if (userDoesntHaveRole) {
    return 'You aren\'t in that role.';
  }
  if (!leaveable) {
    return 'The role can\'t be left.';
  }
  return 'You can\'t join that role.';
};

/**
 * Add a joinable role
 */
class LeaveRole extends Command {
  constructor(bot) {
    super(bot, 'settings.leaveRole', 'leave', 'Leave a role', 'UTIL');
    this.usages = [
      { description: 'Show instructions for leaving roles', parameters: [] },
      { description: 'Leave a role', parameters: ['Role/Role id to leave'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.*)?`, 'i');
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const stringRole = message.strippedContent.replace(`${this.call} `, '');
    if (!stringRole) {
      await this.sendInstructionEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }
    const role = getRoleForString(stringRole, message);
    if (!role) {
      await this.sendInstructionEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }
    const roles = await this.settings.getRolesForGuild(message.guild);
    const filteredRoles = roles.filter(storedRole => role.id === storedRole.id);
    const botIsHigher = message.guild.me.roles.highest.comparePositionTo(role);
    const roleRemoveable = filteredRoles.length > 0
          && message.member.roles.cache.get(role.id)
          && message.channel.permissionsFor(this.bot.client.user.id).has('MANAGE_ROLES')
          && botIsHigher
          && filteredRoles[0].leaveable;
    const userDoesntHaveRole = filteredRoles.length > 0
          && message.channel.permissionsFor(this.bot.client.user.id).has('MANAGE_ROLES')
          && !message.member.roles.cache.get(role.id);
    if (!botIsHigher) {
      await this.sendBotRoleLow(message);
      return this.messageManager.statuses.FAILURE;
    }
    if (roleRemoveable && filteredRoles[0].leaveable) {
      await message.member.roles.remove(role.id);
      await this.sendLeft(message, role);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.sendCantLeave(
      message,
      userDoesntHaveRole,
      filteredRoles[0] && filteredRoles[0].leaveable,
    );
    return this.messageManager.statuses.FAILURE;
  }

  async sendLeft(message, role) {
    await this.messageManager.embed(message, {
      title: 'Left Role',
      type: 'rich',
      color: 0x779ECB,
      description: role ? role.name : 'No such role.',
    }, true, true);
  }

  async sendCantLeave(message, userDoesntHaveRole, leaveable) {
    await this.messageManager.embed(message, {
      title: 'Can\'t Leave',
      description: determineDescription(userDoesntHaveRole, leaveable),
      type: 'rich',
      color: 0x779ECB,
    }, true, true);
  }

  async sendBotRoleLow(message) {
    await this.messageManager.embed(message, {
      title: 'Can\'t Assign Role',
      description: 'Bot\'s role is too low.\nEnsure it is above role to be added.',
      type: 'rich',
      color: 0x779ECB,
    }, true, true);
  }

  async sendInstructionEmbed(message) {
    const embed = {
      title: 'Usage',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: '\u200B',
          value: 'Role or role id to join.',
        },
        {
          name: 'Possible role values:',
          value: '\u200B',
        },
      ],
    };
    const prefix = await this.settings.getGuildSetting(message.guild, 'prefix');
    embed.fields[0].name = `${prefix}${this.call} <role or role id>`;
    const roles = await this.settings.getRolesForGuild(message.guild);
    embed.fields[1].value = roles.map(role => role.guildRole.name).join('; ') || 'No roles.';
    this.messageManager.embed(message, embed, true, false);
  }
}

module.exports = LeaveRole;
