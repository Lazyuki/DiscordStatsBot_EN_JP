// Error with the user input
export class UserError extends Error {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'UserError';
  }
}

// Something went wrong with the bot
export class BotError extends Error {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'BotError';
  }
}

export class CommandArgumentError extends UserError {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'CommandArgumentError';
  }
}

export class NotFoundError extends UserError {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'NotFoundError';
  }
}
