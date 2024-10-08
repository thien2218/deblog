## Core Features:

[x] Log in/sign up with email + password

[x] CRUD operations on blog posts

[x] CRUD operations on drafts (posts that are not published)

[x] CRUD operations on comments

[x] CRUD operations on profiles

[x] Create/update/delete series

[x] Add tags to posts

[ ] React to a post/comment

[ ] Reply to comments

[ ] OAuth & Passkeys

[ ] Confirm/change email, reset/change password, change username

[ ] Sort by relevance or recency for public posts and relevance, most/least recency or alphabet for their posts (draft/saved/published)

[ ] Upload images for their profile, post's thumbnail

[ ] Search & search parsing

## Pipelined tasks:

[x] Implement tagging feature

[ ] Implement reaction feature

[ ] Implement reply feature

[ ] Add KV as config cache

[ ] Write a DB adapter for Lucia

[ ] Add message queue to listen to events

## Add-ons:

-  Receive email when their subscribed user publish a new post
-  Receive in-app notification:
   -  when their comment/reply is replied
   -  when their report is handled
   -  when another user react to their post/comment
   -  when another user subscribe to them
-  Blacklist another user (block comment writing from blacklisted user)
