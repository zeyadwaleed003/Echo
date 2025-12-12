# Features

## API

- [x] **Implement the API Features class** IMPORTANT TO DO FROM THE BEGINNING!!!!!!!
- [x] **Global exception handling**
- [x] **Swagger**

## Auth

- [x] **Sign up**: using google or normal signup process
- [x] **Verify Account**
- [x] **Google Auth**
- [x] **Auth Guard**
- [x] **Login**
- [x] **Refresh Token**
- [x] **Change Password**
- [x] **Forgot Password**
- [x] **Reset Password**
- [x] **Logout**: from all devices
- [x] **Resend Verification Email**
- [x] **Swagger**

### Cron Jobs

- [x] Delete revoked refresh tokens older than 30 days
- [x] Delete Deactivated accounts not active for 30 days

## accounts

- [x] **Create account**: [Admin]
- [x] **Get all accounts**: [Admin]
- [x] **Get account by id**
- [x] **Delete account**: [Admin]
- [x] **Update account**: [Admin]
- [x] **Get current account**
- [x] **Update current account**
- [x] **Follow Account**
- [x] **View Current User Followers**
- [x] **View Current User Followings**
- [x] **View User Followers By Id**
- [x] **View User Followings By Id**
- [x] **Accept Follow Request**
- [x] **Refuse Follow Request**
- [x] **View All Current User Follow Requests**
- [x] **Unfollow Account**
- [x] **Remove Follower**
- [x] **Block Account**: The 2 users can't message each other directly
- [x] **Unblock Account**
- [x] **View current User blocked accounts**
- [x] **Deactivate Account**
- [x] **Delete Account**
- [x] **Reactivate Account When Login**
- [x] **Finish Profile Setup**
- [x] **Swagger**

## Posts

- [x] **Basic CRUD**
- [x] **Get all posts & reposts for an account**
- [x] **Create a reply** (normal post but with parentPostId provided)
- [x] **Get all replies for a post**
- [x] **Pin a post**: user can only pin one of his posts
- [x] **AI content moderation control before creating a new post/reply**
- [x] **Get number of bookmarks for a post**
- [x] **Swagger**

## Bookmarks

- [x] **Bookmark a post**
- [x] **Remove a bookmark**
- [x] **Get bookmark by id**
- [x] **Get current user bookmarks**: api features required
- [x] **Get bookmarks**: api features required [Admin]
- [x] **Swagger**

## Repost

- [x] **Basic CRUD** (No update needed)
- [x] **Swagger**

## Likes

- [x] **Basic CRUD** (No update needed)
- [x] **Get all likes for a post** (account name, account username, account profile picture)
- [x] **Swagger**

## Notifications

- [x] **Create notification service**
  - [x] Follow
  - [x] Follow Request Acceptance
  - [x] Reply
  - [x] Repost
  - [x] Like

- [x] **Find all notifications** with Api Features [Admin]
- [x] **Find all current account notifications** with Api Features
- [x] **Get number of unread notifications**
- [x] **Swagger**

## Search

- [x] **Use Elastic Search**
  - docker image
  - nestjs elasticsearch module
- [x] **Use cursor based pagination**
- [x] **Search through posts (most recent, best)**
- [x] **Search through users accounts**
- [x] **Swagger**

## Block Words

- [x] **Block a word**
- [x] **Unblock a word**
- [x] **Get all blocked words**
- [x] **Push New Migrations**
- [x] **Swagger**

## Multi-Language Support

- [x] **Exceptions**
- [x] **Response messages**
- [x] **Validation messages**

## Chat

- [x] **Handle sockets auth**: Don't use Guards, not suitable with sockets in nestjs (opinionated)

### Conversations

**Sockets**:

- [x] **Join and Leave conversation**

**Http**:

- [x] **Create a new conversation**: Direct or Group conversation
- [ ] **Get conversation by id**: TODO: unread messages number, last message
- [ ] **Get current user conversation list**: sort by the last sent message, unread messages number and the last message. Pagination needed (Cursor or Offset idk)
- [x] **Update a group conversation**: Only the admin of the group can do this
- [x] **Add members to group conversation**
- [x] **Remove members from group conversation**
- [x] **Leave Group**: need to promot the oldest user that haven't left the group to be the admin, only if there was no other admin
- [x] **Make a normal member an admin**
- [x] **Pin/Unpin conversation**
- [x] **Archive/Unarchive conversation**
- [x] **Mute/Unmute conversation**

### Messages

**Sockets**:

- [x] **Send Message**
- [x] **React to a message**
- [x] **Delete reaction**
- [x] **Mark a message as read for a user**
- [x] **Mark a message as delivered for a user**
- [x] **Edit Message**
- [x] **Typing Indication**
- [x] **Delete message for all**
- [x] **Delete message for me**

**Http**:

- [ ] **Search for conversations**
- [ ] **Search for messages in a conversation**

## Future

- [ ] Message Queues
