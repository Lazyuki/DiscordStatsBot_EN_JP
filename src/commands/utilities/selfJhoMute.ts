import { BotCommand } from '@/types';
import { EJLX } from '@utils/constants';
import {
  getNormalCommandForRole,
  timedRoleCommandTemplate,
} from '@utils/timedRoleTemplate';

const command: BotCommand = {
  ...timedRoleCommandTemplate,
  name: 'selfNoJho',
  aliases: ['jm', 'nojho', 'snj'],
  allowedServers: [EJLX],
  description:
    'Mute just_hanging_out channels and japanese_study for some amount of time. The time can be specified with `d` for days, `h` for hours, `m` for minutes, and `s` for seconds. Use the `in` keyword to delay the mute',
  examples: ['jm 3h', 'jm 1d6h30m', 'jm 1d40m in 2h'],
  normalCommand: getNormalCommandForRole('1141472253599563857'),
};

export default command;
