'use strict';

const Command = require('../../../models/Command');
const { createGroupedArray, setupPages } = require('../../../CommonFunctions.js');

class ListCustomCommand extends Command {
  constructor(bot) {
    super(bot, 'settings.cc.list', 'list cc', 'List custom commands for this guild');
    this.requiresAuth = false;
    this.allowDM = false;
  }

  async run(message) {
    const ccs = [];
    const gcc = await this.settings.getCustomCommandsForGuild(message.guild);
    gcc.forEach((cc) => {
      if (cc.response.length > 1024) {
        ccs.push({ name: cc.call, value: decodeURIComponent(cc.response.substring(0, 1020)) });
        ccs.push({ name: '\u200B', value: decodeURIComponent(cc.response.substring(1021)) });
      } else {
        ccs.push({ name: cc.call, value: decodeURIComponent(cc.response) });
      }
    });
    const metaGroups = createGroupedArray(ccs, 10);
    const pages = [];
    metaGroups.forEach((metaGroup) => {
      pages.push({ color: 0x301934, fields: metaGroup, title: 'Custom Commands' });
    });
    if (pages.length) {
      await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
    } else {
      await this.messageManager.embed(message, { color: 0x301934, description: 'No Custom Commands', title: 'Custom Commands' }, true, true);
    }

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ListCustomCommand;
