'use strict';

const locales = {};

require('../resources/locales.json').forEach((locale) => {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  locales[locale] = require(`../resources/locales/${locale}.json`);
});

const typeInfoRegex = /^:([a-z])(\((.+)\))?/;

// e.g. I18n._buildKey(['', ' has ', ':c in the']) == '{0} has {1} in the bank'
const buildKey = (strings) => {
  const stripType = s => s.replace(typeInfoRegex, '');
  const lastPartialKey = stripType(strings[strings.length - 1]);
  const prependPartialKey = (memo, curr, i) => `${stripType(curr)}{${i}}${memo}`;

  return strings.slice(0, -1).reduceRight(prependPartialKey, lastPartialKey);
};

// e.g. I18n._formatStrings('{0} {1}!', 'hello', 'world') == 'hello world!'
const buildMessage = (str, ...values) => str.replace(/{(\d)}/g, (_, index) => values[Number(index)]);

const extractTypeInfo = (str) => {
  const match = typeInfoRegex.exec(str);
  if (match) {
    return { type: match[1], options: match[3] };
  }
  return { type: 's', options: '' };
};

/**
 * Implementation and refactor of https://jaysoo.ca/2014/03/20/i18n-with-es2015-template-literals/
 * all credit to original author
 */
class I18n {
  constructor(locale) {
    if (locales[locale]) {
      this.locale = locale;
      this.bundle = locales[locale];
    } else {
      this.locale = 'en';
      this.bundle = locales[this.locale];
    }

    this.localizers = {
      s /* string */: v => v.toLocaleString(this.locale),
      n /* number */: (v, fractionalDigits) => (
        v.toLocaleString(this.locale, {
          minimumFractionDigits: fractionalDigits,
          maximumFractionDigits: fractionalDigits,
        })
      ),
    };
  }

  translate(strings, ...values) {
    const translationKey = buildKey(strings);
    const translationString = this.bundle[translationKey];

    if (translationString) {
      const typeInfoForValues = strings.slice(1).map(extractTypeInfo);
      const localizedValues = values.map((v, i) => this.localize(v, typeInfoForValues[i]));
      return buildMessage(translationString, ...localizedValues);
    }
    return buildMessage(translationKey, ...values);
  }

  localize(value, { type, options }) {
    return this.localizers[type](value, options);
  }
}

module.exports = {
  use(locale) {
    const i18n = new I18n(locale);
    return i18n.translate.bind(i18n);
  },
};
