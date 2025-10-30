export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum AccountStatus {
  ACTIVATED = 'activated',
  INACTIVATED = 'inactivated',
  PENDING = 'pending',
  DEACTIVATED = 'deactivated',
  SUSPENDED = 'suspended',
}

export enum DirectMessagingStatus {
  NONE = 'none',
  VERIFIED = 'verified',
  EVERYONE = 'everyone',
}

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}

export enum RelationshipType {
  FOLLOW = 'follow',
  BLOCK = 'block',
  MUTE = 'mute',
  FOLLOW_REQUEST = 'follow_request',
}
