'use strict';

const Command = require('../../../models/Command');
const { captures } = require('../../../CommonFunctions');

class AddDefaultRole extends Command {
  constructor(bot) {
    super(bot, 'settings.addDefaultRole', 'add default role');
    this.usages = [
      { description: 'Add a new default role for persons joining the server.', parameters: ['role id'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?${captures.roles}?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const roleId = message.strippedContent.match(this.regex)[1];
    if (roleId && message.guild.roles.has(roleId.trim())) {
      const roles = JSON.parse(await this.settings.getGuildSetting(message.guild, 'defaultRoles') || '[]');
      if (!roles.includes(roleId)) {
        roles.push(roleId);
        await this.settings.setGuildSetting(message.guild, 'defaultRoles', JSON.stringify(roles));
        this.messageManager.notifySettingsChange(message, true, true);
        return this.messageManager.statuses.SUCCESS;
      }
    }
    await this.messageManager.reply(message, 'you must provide a valid role id that doesn\'t correspond to a role that is already added.');
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = AddDefaultRole;
