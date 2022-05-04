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

export class UserPermissionError extends UserError {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'UserPermissionError';
  }
}

export class BotPermissionError extends UserError {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'BotPermissionError';
  }
}

export class CommandArgumentError extends UserError {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'CommandArgumentError';
  }
}

export class ConflictError extends UserError {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'ConflictError';
  }
}

export class InvalidOptionError extends UserError {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'InvalidOptionError';
  }
}

export class InvalidSubCommandError extends CommandArgumentError {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'InvalidSubCommandError';
  }
}

export class NotFoundError extends UserError {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'NotFoundError';
  }
}

/**
 * If message is empty, react to the message with a question mark. Otherwise, send an error embed saying `Member not found: ${message}`
 */
export class MemberNotFoundError extends UserError {
  constructor(message = '', ...args: any[]) {
    super(...args);
    this.message = message;
    this.name = 'MemberNotFoundError';
  }
}
