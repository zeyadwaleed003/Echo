import { Logger } from '@nestjs/common';
import dataSource from '../data-source';
import { PostType } from '../../modules/posts/posts.enums';
import { Post } from '../../modules/posts/entities/post.entity';
import { Account } from '../../modules/accounts/entities/account.entity';

const logger = new Logger('CreatePostsSeeder');

const postContents = [
  'Just had an amazing coffee',
  'Working on something exciting today!',
  'Beautiful sunset view from my window',
  'Anyone else love rainy days?',
  'New blog post coming soon! Stay tuned',
  'This book is absolutely mind-blowing',
  'Weekend vibes are the best!',
  'Cooking something delicious tonight',
  "Can't believe it's already Friday!",
  'Just finished a great workout',
  'Travel plans loading...',
  'Monday motivation: You got this!',
  'Coffee before talkie',
  'Living my best life right now',
  'Nature therapy is the best therapy',
  'Pizza night is the best night',
  'Grateful for the little things today',
  'Music on, world off',
  'Adventure awaits!',
  'Home is where the heart is',
  'Learning something new every day',
  "Smile, it's contagious!",
  'Tech enthusiast checking in',
  'Art is life',
  'Movie marathon mode activated',
  'Fitness journey continues',
  'Good vibes only',
  'Late night thoughts hitting different',
  'Productivity level: maximum',
  'Self care Sunday',
];

async function createTestPosts() {
  await dataSource.initialize();

  const postRepo = dataSource.getRepository(Post);
  const accountRepo = dataSource.getRepository(Account);

  // Get all accounts to randomly assign posts
  const accounts = await accountRepo.find();

  if (accounts.length === 0) {
    logger.log('No accounts found. Please create accounts first.');
    await dataSource.destroy();
    return;
  }

  const posts: Partial<Post>[] = [];

  // Create 50 posts
  for (let i = 0; i < 50; i++) {
    const randomAccount =
      accounts[Math.floor(Math.random() * accounts.length)]!;

    // Determine post type distribution
    let postType: PostType;
    const typeRoll = Math.random();

    if (typeRoll < 0.7) {
      // 70% original posts
      postType = PostType.POST;
    } else if (typeRoll < 0.85) {
      // 15% reposts
      postType = PostType.REPOST;
    } else {
      // 5% replies
      postType = PostType.REPLY;
    }

    const post: Partial<Post> = {
      accountId: randomAccount.id,
      content: postContents[i % postContents.length]!,
      type: postType,
      pinned: i % 20 === 0, // 5% pinned posts
    };

    // For reposts and replies, reference an existing post
    if (postType !== PostType.POST && posts.length > 0) {
      const randomExistingPost =
        posts[Math.floor(Math.random() * posts.length)];
      post.actionPostId = randomExistingPost?.id ?? null;
    }

    // Reposts don't have their own content
    if (postType === PostType.REPOST) {
      post.content = null;
    }

    posts.push(post);
  }

  try {
    // Save posts in batches to handle actionPostId references
    const savedPosts: Post[] = [];

    for (const postData of posts) {
      // If post references another post, make sure it exists in DB
      if (postData.actionPostId) {
        const existingPost = savedPosts.find(
          (p) => p.id === postData.actionPostId
        );
        if (existingPost) {
          postData.actionPostId = existingPost.id;
        } else {
          postData.actionPostId = null;
        }
      }

      const postEntity = postRepo.create(postData);
      const saved = await postRepo.save(postEntity);
      savedPosts.push(saved);
    }

    logger.log(`Created ${savedPosts.length} test posts`);
  } catch (error) {
    logger.error('Error creating posts:', error);
  }

  await dataSource.destroy();
}

createTestPosts().catch(logger.error);
