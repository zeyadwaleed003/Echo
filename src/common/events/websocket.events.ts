export enum EVENTS {
  // Message events
  MESSAGE_SEND = 'message:send',
  MESSAGE_SENT = 'message:sent',
  MESSAGE_DELIVER = 'message:deliver',
  MESSAGE_DELIVERED = 'message:delivered',
  MESSAGE_READ = 'message:read',
  MESSAGE_REACT = 'message:react',
  MESSAGE_REACTED = 'message:reacted',
  MESSAGE_EDIT = 'message:edit',
  MESSAGE_EDITED = 'message:edited',
  MESSAGE_REACT_DELETE = 'message:react:delete',
  MESSAGE_REACT_DELETED = 'message:react:deleted',
  MESSAGE_DELETE_FOR_ME = 'message:delete:for:me',
  MESSAGE_DELETE_FOR_ALL = 'message:delete:for:all',
  MESSAGE_DELETED_FOR_ALL = 'message:deleted:for:all',

  // Conversation events
  CONVERSATION_JOIN = 'conversation:join',
  CONVERSATION_LEAVE = 'conversation:leave',

  // Typing events
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
}
