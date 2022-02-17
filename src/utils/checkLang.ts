import { LangType } from '@/types';
import { REGEX_URL, REGEX_ID, REGEX_JPN, REGEX_ENG } from './regex';

const checkLang = (content: string): { lang: LangType; escaped: boolean } => {
  let jpCount = 0;
  let enCount = 0;
  let olCount = 0;
  let escaped = false;

  content = content
    .replace(REGEX_URL, '')
    .replace(REGEX_ID, '')
    .replace(/o.o/i, '');

  for (const l of content) {
    if (l === '*' || l === '＊') {
      escaped = !escaped; // even number of * = markdown syntax
    }
    if (REGEX_JPN.test(l)) {
      jpCount++;
    } else if (REGEX_ENG.test(l)) {
      enCount++;
    } else if (!/[\swｗ]/i.test(l)) {
      // space and w ignored
      olCount++;
    }
  }
  if (jpCount === enCount) {
    return { lang: 'OL', escaped };
  }

  if (jpCount < 3 && enCount < 3 && olCount > 0) return { lang: 'OL', escaped }; // it's probably a face
  return jpCount * 1.7 > enCount
    ? { lang: 'JP', escaped }
    : { lang: 'EN', escaped };
};

export default checkLang;
