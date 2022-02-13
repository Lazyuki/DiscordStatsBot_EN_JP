import { ServerConfig } from '../types';

declare module '../types' {
  interface ServerConfig {
    tempMuted: string[];
  }
}
