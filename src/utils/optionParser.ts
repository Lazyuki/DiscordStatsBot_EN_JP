import { InvalidOptionError } from '@/errors';
import { CommandOption, ResolvedCommandOptions } from '@/types';

export function optionParser(
  content: string,
  options: CommandOption[]
): { restContent: string; resolvedOptions: ResolvedCommandOptions } {
  const names = options.map((o) => o.name);
  const shorts = options.map((o) => o.short);
  const words = content.split(/\s+/);
  const wordsIterator = words[Symbol.iterator]();
  const resolvedOptions: Record<string, boolean | string> = {};
  while (true) {
    const it = wordsIterator.next();
    if (it.done) {
      break;
    }
    const word = it.value;
    let selectedOption: CommandOption | null = null;
    if (word.startsWith('--')) {
      const name = word.slice(2);
      if (name.length === 0) continue;
      const nameIndex = names.indexOf(name);
      if (nameIndex !== -1) {
        selectedOption = options[nameIndex];
        content = content.replace(word, '');
      }
    } else if (word.startsWith('-')) {
      const short = word.slice(1);
      if (short.length === 1) {
        const shortIndex = shorts.indexOf(short as CommandOption['short']);
        if (shortIndex !== -1) {
          selectedOption = options[shortIndex];
          content = content.replace(word, '');
        }
      } else if (short.length > 1) {
        const boolOptions: CommandOption[] = [];
        for (const char of short) {
          const charIndex = shorts.indexOf(char as CommandOption['short']);
          if (charIndex !== -1) {
            const option = options[charIndex];
            if (!option.bool) {
              throw new InvalidOptionError(
                `The option \`${option.name}\` must have a value after the option. It cannot be bundled in other boolean options.`
              );
            }
            boolOptions.push(option);
          }
        }
        if (boolOptions.length === short.length) {
          content = content.replace(word, '');
          boolOptions.forEach((o) => (resolvedOptions[o.name] = true));
        }
      }
    }
    if (selectedOption) {
      if (selectedOption.bool) {
        resolvedOptions[selectedOption.name] = true;
      } else {
        const valueIt = wordsIterator.next();
        if (valueIt.done) {
          throw new InvalidOptionError(
            `The option \`${selectedOption.name}\` must have a value after the option.`
          );
        }
        const value = valueIt.value;
        if (selectedOption.name in resolvedOptions) {
          resolvedOptions[selectedOption.name] += ',' + value;
        } else {
          resolvedOptions[selectedOption.name] = value;
        }
        content = content.replace(value, '');
      }
    }
  }

  return {
    restContent: content.trim(),
    resolvedOptions,
  };
}
