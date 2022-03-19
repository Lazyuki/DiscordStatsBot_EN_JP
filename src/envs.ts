import { config } from 'dotenv';
import env from 'env-var';

config();

// Required env vars
export const DISCORD_TOKEN = env.get('DISCORD_TOKEN').required().asString();
export const APPLICATION_ID = env.get('APPLICATION_ID').required().asString();
export const OWNER_ID = env.get('OWNER_ID').required().asString();
export const DEFAULT_PREFIX = env.get('DEFAULT_PREFIX').required().asString();

// Optional env vars
export const DEBUG = env.get('DEBUG').default('true').asBool();
export const LINE_ID = env.get('LINE_ID').default('').asString();
