export class Error {
  constructor(errorObject) {
    this.message = 'Unknown error';
    if (typeof errorObject !== 'undefined') {
      this.errorObject = errorObject;
    } else {
      this.errorObject = null;
    }
  }
}

export class ServerUnknownError extends Error {
  constructor() {
    super();
    this.message = 'Server error';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super();
    this.message = 'User not found';
  }
}

export class UsernameAlreadyExistsError extends Error {
  constructor() {
    super();
    this.message = 'Username already exists';
  }
}

export class NeedTOTPTokenError extends Error {
  constructor() {
    super();
    this.message = 'Need TOTP token';
  }
}

export class DisconnectedError extends Error {
  constructor() {
    super();
    this.message = 'You are disconnected';
  }
}

export class InvalidSignatureError extends Error {
  constructor() {
    super();
    this.message = 'Invalid signature';
  }
}

export class DontHaveSecretError extends Error {
  constructor() {
    super();
    this.message = 'You don\'t have this secret';
  }
}

export class FolderNotFoundError extends Error {
  constructor() {
    super();
    this.message = 'Folder not found';
  }
}

export class FolderInItselfError extends Error {
  constructor() {
    super();
    this.message = 'You can\'t put this folder in itself.';
  }
}

export class LocalStorageUnavailableError extends Error {
  constructor() {
    super();
    this.message = 'LocalStorage unavailable';
  }
}

export class InvalidPasswordError extends Error {
  constructor() {
    super();
    this.message = 'Invalid password';
  }
}

export class CantEditSecretError extends Error {
  constructor() {
    super();
    this.message = 'You can\'t edit this secret';
  }
}

export class CantShareSecretError extends Error {
  constructor() {
    super();
    this.message = 'You can\'t share this secret';
  }
}

export class CantUnshareSecretError extends Error {
  constructor() {
    super();
    this.message = 'You can\'t unshare this secret';
  }
}

export class CantUnshareWithYourselfError extends Error {
  constructor() {
    super();
    this.message = 'You can\'t unshare with yourself';
  }
}

export class CantShareWithYourselfError extends Error {
  constructor() {
    super();
    this.message = 'You can\'t share with yourself';
  }
}

export class SecretAlreadyExistsError extends Error {
  constructor() {
    super();
    this.message = 'Wow you are unlucky ! SecretID already exists';
  }
}

export class SecretNotFoundError extends Error {
  constructor() {
    super();
    this.message = 'Secret not found';
  }
}

export class CantGenerateNewKeyError extends Error {
  constructor() {
    super();
    this.message = 'You can\'t generate new key for this secret';
  }
}

export class NotSharedWithUserError extends Error {
  constructor() {
    super();
    this.message = 'Secret not shared with this user';
  }
}

export class FriendNotFoundError extends Error {
  constructor() {
    super();
    this.message = 'Friend not found';
  }
}

export class OfflineError extends Error {
  constructor() {
    super();
    this.message = 'Offline';
  }
}

export class NotAvailableError extends Error {
  constructor() {
    super();
    this.message = 'Not available in standalone mode';
  }
}

export class WrappingError {
  constructor(error) {
    if (error.constructor !== String) {
      this.error = error;
    } else if (error === 'Unknown error') {
      this.error = new ServerUnknownError();
    } else if (error === 'User not found') {
      this.error = new UserNotFoundError();
    } else if (error === 'Username already exists') {
      this.error = new UsernameAlreadyExistsError();
    } else if (error === 'Need TOTP token') {
      this.error = new NeedTOTPTokenError();
    } else if (error === 'You are disconnected') {
      this.error = new DisconnectedError();
    } else if (error === 'Invalid signature') {
      this.error = new InvalidSignatureError();
    } else if (error === 'You don\'t have this secret') {
      this.error = new DontHaveSecretError();
    } else if (error === 'Folder not found') {
      this.error = new FolderNotFoundError();
    } else if (error === 'You can\'t put this folder in itself.') {
      this.error = new FolderInItselfError();
    } else if (error === 'LocalStorage unavailable') {
      this.error = new LocalStorageUnavailableError();
    } else if (error === 'Invalid Password') {
      this.error = new InvalidPasswordError();
    } else if (error === 'You can\'t edit this secret') {
      this.error = new CantEditSecretError();
    } else if (error === 'You can\'t share this secret') {
      this.error = new CantShareSecretError();
    } else if (error === 'You can\'t unshare this secret') {
      this.error = new CantUnshareSecretError();
    } else if (error === 'You can\'t unshare with yourself') {
      this.error = new CantUnshareWithYourselfError();
    } else if (error === 'You can\'t share with yourself') {
      this.error = new CantShareWithYourselfError();
    } else if (error === 'Secret already exists') {
      this.error = new SecretAlreadyExistsError();
    } else if (error === 'Secret not found') {
      this.error = new SecretNotFoundError();
    } else if (error === 'You can\'t generate new key for this secret') {
      this.error = new CantGenerateNewKeyError();
    } else if (error === 'Secret not shared with this user') {
      this.error = new NotSharedWithUserError();
    } else if (error === 'Friend not found') {
      this.error = new FriendNotFoundError();
    } else if (error === 'Offline') {
      this.error = new OfflineError();
    } else if (error === 'Not available in standalone mode') {
      this.error = new NotAvailableError();
    } else {
      this.error = new Error(error);
    }
  }
}

const Errors = {
  Error,
  ServerUnknownError,
  UserNotFoundError,
  UsernameAlreadyExistsError,
  NeedTOTPTokenError,
  DisconnectedError,
  InvalidSignatureError,
  DontHaveSecretError,
  FolderNotFoundError,
  FolderInItselfError,
  LocalStorageUnavailableError,
  WrappingError,
  InvalidPasswordError,
  CantEditSecretError,
  CantShareSecretError,
  CantUnshareSecretError,
  CantUnshareWithYourselfError,
  CantShareWithYourselfError,
  SecretAlreadyExistsError,
  SecretNotFoundError,
  CantGenerateNewKeyError,
  NotSharedWithUserError,
  FriendNotFoundError,
  OfflineError,
  NotAvailableError,
};

export default Errors;
