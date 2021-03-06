'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const { emojify } = require('../CommonFunctions.js');

const dispositions = ['\\⚫\\⚫\\⚫\\⚫\\⚫', '\\⚪\\⚫\\⚫\\⚫\\⚫', '\\⚪\\⚪\\⚫\\⚫\\⚫', '\\⚪\\⚪\\⚪\\⚫\\⚫', '\\⚪\\⚪\\⚪\\⚪\\⚫', '\\⚪\\⚪\\⚪\\⚪\\⚪'];

/**
 * Generates enemy embeds
 */
class WeaponEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesisad
   * @param {Enhancement} weapon - The enhancement to send info on
   */
  constructor(bot, weapon) {
    super();
    if (weapon && typeof weapon !== 'undefined') {
      this.title = weapon.name;
      this.url = weapon.wikiaUrl || '';
      this.thumbnail = { url: weapon.wikiaThumbnail || '' };
      this.description = `${weapon.type} • ${weapon.masteryReq} ${emojify('mastery_rank')}`;
      this.color = weapon.color || 0x7C0A02;
      this.fields = [];

      if (weapon.color) {
        this.color = weapon.color;
      }

      if (weapon.primary) {
        this.fields.push({
          name: 'Primary Fire',
          value: `**Trigger:** ${weapon.primary.trigger}\n`
          + `**Projectile:** ${weapon.primary.projectile}\n`
          + `**Rate:** ${weapon.primary.rate} ammo\\s\n`
          + `**Flight:**: ${weapon.primary.flight || '-'} m\\s\n`
          + `**Noise:** ${weapon.primary.noise || '-'}\n`
          + `**Accuracy:** ${weapon.primary.accuracy || '-'}\n`
          + `**Reload:** ${weapon.primary.reload || '-'}s\n`
          + `**Damage:** ${emojify(weapon.primary.damage) || '-'}\n`
          + `**Impact:** ${emojify(weapon.primary.impact) || '-'}\n`
          + `**Puncture:** ${emojify(weapon.primary.puncture) || '-'}\n`
          + `**Slash:** ${emojify(weapon.primary.slash) || '-'}\n`
          + `**Critical Chance:** ${((weapon.primary.crit_chance || 0) * 100).toFixed(2) || '-'}%\n`
          + `**Critical Multiplier:** ${(weapon.primary.crit_mult || 0).toFixed(2) || '-'}x\n`
          + `**Status Chance:** ${((weapon.primary.status_chance || 0) * 100).toFixed(2) || '-'}%`,
          inline: true,
        });
      } else {
        const things = [{
          name: 'Rate',
          value: `${String((weapon.fireRate).toFixed(0) || '-')} unit\\s`,
          inline: true,
        },
        {
          name: 'Damage',
          value: emojify(weapon.damage || '-'),
          inline: true,
        },
        {
          name: 'Critical Chance',
          value: `${((weapon.criticalChance) * 100).toFixed(2) || '-'}%`,
          inline: true,
        },
        {
          name: 'Critical Multiplier',
          value: `${(weapon.criticalMultiplier || 0).toFixed(2) || '-'}x`,
          inline: true,
        },
        {
          name: 'Status Chance',
          value: `${((weapon.procChance || 0) * 100).toFixed(2) || '-'}%`,
          inline: true,
        },
        {
          name: 'Polarities',
          value: emojify(weapon.polarities && weapon.polarities.length ? weapon.polarities.join(' ') : '-'),
          inline: true,
        }];
        this.fields.push(...things);
        if (weapon.stancePolarity) {
          this.fields.push({
            name: 'Stance Polarity',
            value: emojify(weapon.stancePolarity || '-'),
            inline: true,
          });
        }
      }

      if (weapon.secondary) {
        const values = [];
        if (weapon.secondary.trigger) {
          values.push(`**Trigger:** ${weapon.secondary.trigger || '-'}`);
        }
        if (weapon.secondary.shot_type) {
          values.push(`**Projectile:** ${weapon.secondary.shot_type}`);
        }
        if (weapon.secondary.rate) {
          values.push(`**Rate:** ${weapon.secondary.rate}`);
        }
        if (weapon.secondary.flight) {
          values.push(`**Flight:**: ${weapon.secondary.flight}m\\s`);
        }
        if (weapon.secondary.noise) {
          values.push(`**Noise:** ${weapon.secondary.noise}`);
        }
        if (weapon.secondary.accuracy) {
          values.push(`**Accuracy:** ${weapon.secondary.accuracy}`);
        }
        if (weapon.secondary.reload) {
          values.push(`**Reload:** ${weapon.secondary.reload}`);
        }
        if (weapon.secondary.damage) {
          values.push(`**Damage:** ${emojify(weapon.secondary.damage || '-')}`);
        }
        if (weapon.secondary.impact) {
          values.push(`**Impact:** ${weapon.secondary.impact}`);
        }
        if (weapon.secondary.puncture) {
          values.push(`**Puncture:** ${weapon.secondary.puncture}`);
        }
        if (weapon.secondary.slash) {
          values.push(`**Slash:** ${weapon.secondary.slash}`);
        }
        if (weapon.secondary.crit_chance) {
          values.push(`**Critical Chance:** ${(weapon.secondary.crit_chance || 0).toFixed(2) || '-'}%`);
        }
        if (weapon.secondary.crit_mult) {
          values.push(`**Critical Multiplier:** ${(weapon.secondary.crit_mult || 0).toFixed(2) || '-'}x`);
        }
        if (weapon.secondary.status_chance) {
          values.push(`**Status Chance:** ${((weapon.secondary.status_chance || 0) * 100).toFixed(2) || '-'}%`);
        }

        this.fields.push({
          name: weapon.secondary.name || 'Secondary Fire',
          value: values.join('\n') || '--',
          inline: true,
        });
      }

      if (weapon.noise) {
        this.fields.push({
          name: 'Noise Level',
          value: String(weapon.noise),
          inline: true,
        });
      }

      if (weapon.projectile) {
        this.fields.push({
          name: 'Projectile',
          value: String(weapon.projectile),
          inline: true,
        });
      }
      if (weapon.trigger) {
        this.fields.push({
          name: 'Trigger Type',
          value: weapon.trigger,
          inline: true,
        });
      }

      if (weapon.damageTypes
        && (weapon.damageTypes.impact || weapon.damageTypes.puncture || weapon.damageTypes.slash)) {
        this.fields.push({
          name: 'IPS Damage Distribution',
          value: emojify(`impact ${String(weapon.damageTypes.impact || '-')}\npuncture ${String(weapon.damageTypes.puncture || '-')}\nslash ${String(weapon.damageTypes.slash || '-')}`),
          inline: true,
        });
      }

      if (weapon.flight) {
        this.fields.push({
          name: 'Flight Speed',
          value: `${weapon.flight || '0'}m\\s`,
          inline: true,
        });
      }
      if (weapon.magazineSize) {
        this.fields.push({
          name: 'Magazine Size',
          value: String(weapon.magazineSize),
          inline: true,
        });
      }
      if (weapon.ammo) {
        this.fields.push({
          name: 'Ammo Max',
          value: String(weapon.ammo),
          inline: true,
        });
      }
      if (weapon.accuracy) {
        this.fields.push({
          name: 'Accuracy',
          value: String(weapon.accuracy),
          inline: true,
        });
      }
      if (weapon.reload) {
        this.fields.push({
          name: 'Reload Speed',
          value: `${(weapon.reloadTime || 0).toFixed(1) || '-'}s`,
          inline: true,
        });
      }
      if (weapon.disposition) {
        this.fields.push({
          name: 'Riven Disposition',
          value: `${dispositions[weapon.disposition]} (${Number(weapon.omegaAttenuation).toFixed(2)})`,
          inline: true,
        });
      }
    } else {
      this.title = 'Invalid Query';
      this.color = 0xff6961;
      this.footer = undefined;
    }
  }
}

module.exports = WeaponEmbed;
