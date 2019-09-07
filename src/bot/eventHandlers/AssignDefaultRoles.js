'use strict';

const Handler = require('../../models/BaseEventHandler');

/**
 * Describes a handler
 */
class AssignDefaultRolesHandle extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.assignDefaultRoles', 'guildMemberAdd');
  }

  /**
   * add the guild to teh Database
   * @param {Discord.member} member member to add roles to
   */
  async execute(...[member]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    const defaultRoles = JSON.parse(await this.settings.getGuildSetting(member.guild, 'defaultRoles') || '[]')
      .map(roleId => member.guild.roles.get(roleId)).filter(role => role);
    if (defaultRoles.length) {
      await member.roles.add(defaultRoles, `Default role assignment for ${member.user.tag}`);
    }
  }
}

module.exports = AssignDefaultRolesHandle;
