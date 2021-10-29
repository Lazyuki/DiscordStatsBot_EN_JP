import { REGEX_URL, REGEX_ID, REGEX_JPN, REGEX_ENG } from './regex';

export const LANG = {
  ENG: 1,
  JPN: 1 << 1,
  OTH: 1 << 2,
  ESC: 1 << 3,
} as const;

const checkLang = (content: string) => {
  let jpCount = 0;
  let enCount = 0;
  let other = 0;
  let result = 0;
  content = content.replace(REGEX_URL, '');
  content = content.replace(REGEX_ID, '');
  content = content.replace(/o.o/i, '');
  for (const l of content) {
    if (l === '*' || l === '＊') {
      result |= LANG.ESC;
    }
    if (REGEX_JPN.test(l)) {
      jpCount++;
    } else if (REGEX_ENG.test(l)) {
      enCount++;
    } else if (!/[\sw]/i.test(l)) {
      other++;
    }
  }
  if (jpCount === enCount) {
    return result | LANG.OTH;
  }

  if (jpCount < 3 && enCount < 3 && other > 0) return result | LANG.OTH; // it's probably a face
  return jpCount * 1.7 > enCount ? result | LANG.JPN : result | LANG.ENG;
};

export default checkLang;
