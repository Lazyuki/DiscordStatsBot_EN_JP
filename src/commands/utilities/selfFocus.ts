import { BotCommand } from '@/types';
import { EJLX } from '@utils/constants';
import {
  getNormalCommandForRole,
  timedRoleCommandTemplate,
} from '@utils/timedRoleTemplate';

const command: BotCommand = {
  ...timedRoleCommandTemplate,
  name: 'selfFocused',
  aliases: ['focus', 'sf'],
  allowedServers: [EJLX],
  description:
    'Mute most channels except for study-heavy channels. This highly limits your interation with the server.',
  examples: ['focus 3h', 'focus 1d6h30m', 'focus 1d40m in 2h'],
  normalCommand: getNormalCommandForRole('903825140779982909'),
};

export default command;
