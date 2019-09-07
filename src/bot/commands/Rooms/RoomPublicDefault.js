'use strict';

const Command = require('../../../models/Command');

class RoomUnlockedDefault extends Command {
  constructor(bot) {
    super(bot, 'settings.defaultroomsunlocked', 'set rooms unlocked', 'Set whether or not to the bot should default rooms to being unlocked (public).');
    this.usages = [
      { description: 'Change if the bot should create unlocked channels by default (defaults to off)', parameters: ['private rooms defaulted'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(on|off)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx Command context for calling commands
   * @returns {string} success status
   */
  async run(message) {
    let enable = message.strippedContent.match(this.regex)[1];
    if (!enable) {
      return this.sendToggleUsage(message);
    }
    enable = enable.trim();
    await this.settings.setGuildSetting(message.guild, 'defaultRoomsLocked', enable !== 'on');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = RoomUnlockedDefault;
