'use strict';

const Command = require('../../../models/Command');

const { safeMatch, getMessage } = require('../../../CommonFunctions');

const leaveableRegex = new RegExp('--leaveable (on|off)', 'ig');
const reqRoleRegex = new RegExp('--requires (?:<@&)?(\\d{15,20})(>)?', 'ig');

/**
 * Add a joinable role
 */
class AddRole extends Command {
  constructor(bot) {
    super(bot, 'settings.reactions.addRole', 'radd');
    this.usages = [
      { description: 'Show instructions for adding reaction role', parameters: [] },
      { description: 'Add a role with an emote', parameters: ['Role/Role id to add', '--create', '--mentionable', '--leavable (on | off)', '--requires @Role Mention'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.*)?\\s?(--create)?\\s?(--mentionable)?`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;

    this.enabled = false;
  }

  parseArgs(content) {
    const tuples = content.replace(`${this.call} `, '')
      .replace('--create', '')
      .replace('--mentionable', '')
      .replace('--remove', '')
      .replace(leaveableRegex, '')
      .replace(reqRoleRegex, '')
      .trim()
      .split(',')
      .map((inst) => {
        const tokens = inst.split(' ');
        if (tokens.length > 2) {
          return {
            msgId: tokens[0],
            // need to handle custom w/ role id as well as non-custom >.<
            emoji: tokens[1].replace(/.*(\d){15,20}.*/g, '$1'),
            roleDisp: tokens.splice(2).join(' '),
          };
        }
        return {
          emoji: tokens[0],
          roleDisp: tokens.splice(1).join(' '),
        };
      });

    return {
      create: /--create/ig.test(content),
      mentionable: /--mentionable/ig.test(content),
      leaveable: (safeMatch(content, leaveableRegex)[0] || '').trim() === 'on',
      tuples,
      action: /--remove/ig.test(content) ? 'remove' : 'add',
    };
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Context} ctx    Command & Channel context
   * @param {Object} ctx.args Arguments to the command
   * @returns {string} success status
   */
  /* eslint-disable no-unused-vars */
  async run(message, {
    args: {
      create, mentionable, leaveable, tuples, requires,
    },
  }) {
    this.logger.debug(JSON.stringify(tuples));

    const failed = [];

    const mappedTuples = (await Promise.all(
      tuples.map(async ({ msgId, emoji, roleDisp }, index) => {
        const msg = await getMessage(message, msgId);
        const emojiObj = this.bot.client.emoji.get(emoji);
        const role = await this.mmessage.guild.roles.get(roleDisp)
        || await this.mmessage.guild.roles.find(r => r.name.includes(roleDisp));
        const fReasons = [];
        if (msg && emojiObj && role) {
          return {
            msg,
            emoji: emojiObj,
            role,
          };
        }
        if (!msg) {
          fReasons.push(`\`${msgId}\` could not be resolved to a valid message Id.`);
        }

        if (!emojiObj) {
          fReasons.push(`\`${emoji}\` could not be resolved to a valid emoji.`);
        }

        if (!role) {
          fReasons.push(`\`${roleDisp}\` could not be resolved to a valid role.`);
        }

        if (fReasons.length) {
          failed.push({
            index,
            reasons: fReasons,
          });
        }

        return undefined;
      }),
    )).filter(tuple => tuple);

    if (failed.length) {
      const content = failed.map((failure) => {
        const reasons = failure.reasons.map(reason => `:white_small_square: ${reason}`);
        return `**Entry ${failure.index + 1} failled due to:**\n\n${reasons.join('\n')}`;
      }).join('\n\n');

      this.messageManager.sendMessage(message, content, true, true);
    }

    // TODO: parse out args for each. if it's valid, save it to the db.
    // if not, push it to a "failed" array with reason, and reply to user
    return this.messageManager.statuses.FAILURE;
  }
  /* eslint-enable no-unused-vars */
}

module.exports = AddRole;
