'use strict';

const Handler = require('../../models/BaseEventHandler');
const { isVulgarCheck, getRandomWelcome } = require('../../CommonFunctions');

class WelcomeHandler extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.welcome', 'guildMemberAdd');
  }

  /**
   * Run the handle
   * @param {GuildMember} member guildMember to welcome
   */
  async execute(...[member]) {
    this.logger.debug(`Running ${this.id} for ${this.event}`);

    this.logger.debug(`Handling 'guildMemberAdd' for ${member.id} on ${member.guild.name}`);

    const isVulgar = isVulgarCheck.test(member.displayName)
      || isVulgarCheck.test(member.user.username);
    if (!isVulgar) {
      const welcomes = await this.settings.getWelcomes(member.guild);
      welcomes.forEach((welcome) => {
        if (welcome.message.trim() === 'random') {
          welcome.message = getRandomWelcome(); // eslint-disable-line no-param-reassign
        }
        if (welcome.isDm === '1') {
          this.messageManager.sendDirectMessageToUser(member, welcome.message
            .replace(/\$username/ig, member.displayName)
            .replace(/\$usermention/ig, member)
            .replace(/\$timestamp/ig, new Date().toLocaleString()));
        } else {
          this.messageManager
            .sendMessage(
              { channel: welcome.channel }, welcome.message
                .replace(/\$username/ig, member.displayName)
                .replace(/\$usermention/ig, member)
                .replace(/\$timestamp/ig, new Date().toLocaleString()),
              false, false,
            );
        }
      });
    }
  }
}

module.exports = WelcomeHandler;
