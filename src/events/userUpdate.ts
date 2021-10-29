import { ServerSettings } from '../types';

declare module '../types' {
  interface ServerSettings {
    tempMuted: string[];
  }
}
