'use strict';

const Command = require('../../../models/Command');
const JoinableRole = require('../../../models/JoinableRole.js');

/**
 * Get a role from the matching string
 * @param  {string} string      String to use to search for role
 * @param  {Message} message    originating message
 * @returns {Role|null}         Role
 */
function getRoleForString(string, message) {
  const trimmedString = string.trim();
  const roleFromId = message.guild.roles.get(trimmedString);
  let roleFromName;
  if (typeof roleFromId === 'undefined') {
    roleFromName = message.guild.roles
      .find(item => item.name.toLowerCase() === trimmedString.toLowerCase());
  }
  return roleFromId || roleFromName || null;
}

const createRegex = new RegExp('--create', 'ig');
const mentionableRegex = new RegExp('--mentionable', 'ig');
const leaveableRegex = new RegExp('--leaveable (on|off)', 'ig');
const reqRoleRegex = new RegExp('--requires (?:<@&)?(\\d{15,20})(>)?', 'ig');

/**
 * Add a joinable role
 */
class AddRole extends Command {
  constructor(bot) {
    super(bot, 'settings.addRole', 'add role');
    this.usages = [
      { description: 'Show instructions for adding joinable roles', parameters: [] },
      { description: 'Add a role', parameters: ['Role/Role id to add', '--create', '--mentionable', '--leavable (on | off)', '--requires @Role Mention'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.*)?\\s?(--create)?\\s?(--mentionable)?`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const create = createRegex.test(message.strippedContent);
    const mentionable = mentionableRegex.test(message.strippedContent);
    const stringRole = message.strippedContent
      .replace(`${this.call} `, '')
      .replace('--create', '')
      .replace('--mentionable', '')
      .replace(leaveableRegex, '')
      .replace(reqRoleRegex, '')
      .trim();
    if (!stringRole) {
      await this.sendInstructionEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }
    let role = getRoleForString(stringRole, message);
    if (create && message.guild.me.hasPermission('MANAGE_ROLES')) {
      role = await message.guild.roles.create({
        data: {
          name: stringRole,
          permissions: 0,
          mentionable,
        },
      }, 'Add Role Command with create flag');
    } else if (!role) {
      await this.sendInstructionEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }

    const roles = await this.settings.getRolesForGuild(message.guild);
    const filteredRoles = roles.filter(storedRole => role.id === storedRole.id);

    if (filteredRoles.length > 0) {
      await this.sendAlreadyAddedEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }

    const rolesToCommit = roles.map(innerRole => innerRole.getSimple());
    const newRole = new JoinableRole(role);

    if (reqRoleRegex.test(message.strippedContent)) {
      const reqRoleRes = message.strippedContent.match(reqRoleRegex)[0]
        .replace('--requires ', '').replace('<@&', '').replace('>', '').trim();

      newRole.requiredRole = reqRoleRes ? message.guild.roles.get(reqRoleRes) : undefined;
    }

    if (leaveableRegex.test(message.strippedContent)
      && message.strippedContent.match(leaveableRegex).length) {
      const isLeaveable = message.strippedContent.match(leaveableRegex)[0].trim() === 'on';
      newRole.isLeaveable = isLeaveable;
    }
    rolesToCommit.push(newRole.getSimple());
    await this.addAndCommitRole(message, rolesToCommit, role.name);
    return this.messageManager.statuses.SUCCESS;
  }

  async addAndCommitRole(message, roles, newRole) {
    await this.settings.setRolesForGuild(
      message.guild,
      roles.map(role => JSON.stringify(role)),
    );
    await this.messageManager.embed(message, {
      title: 'Added role to joinable list',
      type: 'rich',
      color: 0x779ECB,
      description: newRole,
    }, true, true);
  }

  async sendAlreadyAddedEmbed(message) {
    await this.messageManager.embed(message, {
      title: 'Invalid Role',
      type: 'rich',
      color: 0x779ECB,
      description: 'That role is already joinable.',
    }, true, true);
  }

  async sendInstructionEmbed(message) {
    const prefix = await this.settings.getGuildSetting(message.guild, 'prefix');
    this.messageManager.embed(message, {
      title: 'Usage',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: `${prefix}${this.call} <role or role id>`,
          value: 'Role or role id to be allowed for self-role.',
        },
        {
          name: 'Possible values:',
          value: '\u200B',
        },
        {
          name: '**Roles:**',
          value: message.guild.roles.map(r => r.name).join('; '),
          inline: true,
        },
      ],
    }, true, true);
  }
}

module.exports = AddRole;
