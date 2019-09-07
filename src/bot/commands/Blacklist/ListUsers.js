'use strict';

const { MessageEmbed } = require('discord.js');

const Command = require('../../../models/Command');
const { createGroupedArray, embedDefaults, setupPages } = require('../../../CommonFunctions');

class ListUsers extends Command {
  constructor(bot) {
    super(bot, 'core.blacklist.list', 'bl ls', 'List users in the blacklist');
    this.regex = new RegExp(`^(?:${this.call}?|bl list)`);
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx     Message/command context
   * @returns {string} success status
   */
  async run(message, ctx) {
    const global = /--?g(?:lobal)?/ig.test(message.strippedContent) && ctx.isOwner;

    if (message.guild) {
      const users = await this.settings.getBlacklisted(message.guild.id, global);
      const groupedUsers = createGroupedArray(users, 10);
      const pages = [];
      if (groupedUsers.length) {
        groupedUsers.forEach((userGroup) => {
          const page = new MessageEmbed(embedDefaults);
          page.setTitle(`Blacklisted Users${global ? ' (Global Incl.)' : ''}`);
          page.setDescription(userGroup.map(user => `${user} (${user.id})`).join('\n'));
          pages.push(page);
        });
      } else {
        const noDataPage = new MessageEmbed(embedDefaults);
        noDataPage.setTitle('No Blacklisted Users');
        pages.push(noDataPage);
      }
      setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
      return this.messageManager.statuses.SUCCESS;
    }
    this.messageManager.reply(message, 'Must be in a guild.', true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = ListUsers;
