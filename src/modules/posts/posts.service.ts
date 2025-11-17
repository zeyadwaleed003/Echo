import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { PostFiles } from './entities/post-file.entity';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { PostType } from './posts.enums';
import { Account } from '../accounts/entities/account.entity';
import { APIResponse } from 'src/common/types/api.types';
import { InjectRepository } from '@nestjs/typeorm';
import ApiFeatures from 'src/common/utils/ApiFeatures';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';
import { RelationshipType } from '../accounts/accounts.enums';

@Injectable()
export class PostsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostFiles)
    private readonly postFilesRepository: Repository<PostFiles>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(AccountRelationships)
    private readonly accountRelationshipsRepository: Repository<AccountRelationships>
  ) {}

  private containFiles(q: any) {
    const queryString = { ...q };
    const fields = queryString.fields?.split(',');
    return fields?.includes('files');
  }

  private cleanFields(q: any) {
    const queryString = { ...q };
    const fields = queryString.fields?.split(',');

    const validFields = fields.filter((field: string) => field !== 'files');
    return { ...queryString, fields: validFields.join(',') };
  }

  private async uploadFiles(
    manager: EntityManager,
    files: Express.Multer.File[],
    postId: number
  ) {
    let postFiles = [];
    const uploadedFiles =
      await this.cloudinaryService.uploadMultipleFiles(files);
    postFiles = uploadedFiles.map((file) =>
      manager.create(PostFiles, {
        url: file.secure_url,
        postId,
      })
    );
    await manager.save(PostFiles, postFiles);
    return postFiles;
  }

  async create(
    createPostDto: CreatePostDto,
    account: Account,
    files?: Express.Multer.File[]
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const post = manager.create(Post, {
        ...createPostDto,
        type: PostType.POST,
        accountId: account.id,
      });
      await manager.save(Post, post);

      let postFiles: PostFiles[] = [];

      if (files?.length)
        postFiles = await this.uploadFiles(manager, files, post.id);

      const res: APIResponse = {
        message: 'Post created successfully',
        data: { ...post, postFiles },
      };
      return res;
    });
  }

  async findAll(q: any) {
    let queryString = { ...q };

    const containFiles = this.containFiles(q);
    if (containFiles) queryString = this.cleanFields(q);

    const posts = await new ApiFeatures<Post>(this.postRepository, queryString)
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .exec();

    if (q.fields && !containFiles) return { data: posts };

    const postsIds = posts.map((post) => post.id);

    const files = (
      await this.postFilesRepository.find({
        where: { postId: In(postsIds) },
      })
    ).reduce(
      (acc, file) => {
        if (file.postId !== null) {
          acc[file.postId] = acc[file.postId] || [];
          acc[file.postId]!.push(file);
        }
        return acc;
      },
      {} as Record<number, PostFiles[]>
    );

    const res: APIResponse = {
      data: posts.map((post) => ({
        ...post,
        files: (!q.fields || containFiles) && (files[post.id] || []),
      })),
    };

    return res;
  }

  async findUserPosts(account: Account, q: any) {
    const queryString = { ...q, accountId: account.id };

    return await this.findAll(queryString);
  }

  async findOne(id: number, account?: Account) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) throw new NotFoundException('No post found with this id');

    const [author, files] = await Promise.all([
      this.accountsRepository.findOneBy({ id: post.accountId }),
      this.postFilesRepository.findBy({ postId: post.id }),
    ]);

    if (!author) throw new NotFoundException('Post author not found');
    if (!author.isPrivate)
      return {
        data: { ...post, files },
      };

    if (!account)
      throw new UnauthorizedException(
        'This post is from a private account. Please log in to view it.'
      );

    const isFollowing =
      (
        await this.accountRelationshipsRepository.findOneBy({
          actorId: account!.id,
          targetId: author.id,
        })
      )?.relationshipType === RelationshipType.FOLLOW;

    if (account.role !== 'admin' && account.id !== author.id && !isFollowing)
      throw new UnauthorizedException(
        `Follow @${author.username} to see the post`
      );

    const res: APIResponse = {
      data: { ...post, files },
    };

    return res;
  }

  async update(
    id: number,
    account: Account,
    updatePostDto: UpdatePostDto,
    files?: Express.Multer.File[]
  ) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) throw new NotFoundException('No post found with this id');

    if (account.id !== post.accountId)
      throw new ForbiddenException(
        'You do not have permission to update this post'
      );

    return await this.dataSource.transaction(async (manager) => {
      const postRepository = manager.getRepository(Post);
      const postFilesRepository = manager.getRepository(PostFiles);

      const { deleteFileIds, content } = updatePostDto;

      // update content
      if (content) await postRepository.update(id, { content });

      let remainingFilesCount = (
        await postFilesRepository.find({
          where: { postId: post.id },
        })
      ).length;

      // handle file deletion
      if (deleteFileIds) {
        const filesToDelete = await postFilesRepository.find({
          where: { id: In(deleteFileIds) },
        });

        const invalidFiles = filesToDelete.filter(
          (file) => file.postId !== post.id
        );
        if (
          invalidFiles.length ||
          filesToDelete.length !== deleteFileIds.length
        )
          throw new ForbiddenException('Some files do not belong to this post');

        await this.cloudinaryService.deleteMultipleFiles(
          filesToDelete.map((f) => f.url)
        );
        await postFilesRepository.remove(filesToDelete);
        remainingFilesCount -= filesToDelete.length;
      }

      // handle file uploads
      if (files?.length) {
        if (files.length + remainingFilesCount > 4)
          throw new ForbiddenException('Maximum of 4 files allowed per post');

        await this.uploadFiles(manager, files, post.id);
      }

      const updatedPost = await postRepository.findOneBy({ id });
      const postFiles = await postFilesRepository.find({
        where: { postId: id },
      });

      const res: APIResponse = {
        message: 'Post updated successfully',
        data: {
          ...updatedPost,
          ...(postFiles.length > 0 && { files: postFiles }),
        },
      };

      return res;
    });
  }

  async remove(id: number, account: Account) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) throw new NotFoundException('No post found with this id');

    if (account.id !== post.accountId)
      throw new ForbiddenException(
        'You do not have permission to delete this post'
      );

    return await this.dataSource.transaction(async (manager) => {
      const postRepository = manager.getRepository(Post);
      const postFilesRepository = manager.getRepository(PostFiles);

      const postFiles = await manager.find(PostFiles, {
        where: { postId: id },
      });
      if (postFiles.length)
        await this.cloudinaryService.deleteMultipleFiles(
          postFiles.map((f) => f.url)
        );

      await postFilesRepository.delete({ postId: id });
      await postRepository.delete({ id });

      const res: APIResponse = {
        message: 'Post deleted successfully',
      };
      return res;
    });
  }

  async findAccountPosts(accountId: number, q: any, account?: Account) {
    const targetAccount = await this.accountsRepository.findOne({
      where: { id: accountId },
    });
    if (!targetAccount)
      throw new NotFoundException('No account found with this id');

    if (account?.id === accountId) {
      const queryString = { ...q, accountId };
      return await this.findAll(queryString);
    }

    // account is private
    if (targetAccount.isPrivate) {
      // user not logged in
      if (!account)
        throw new UnauthorizedException(
          'This account is private. Please log in to view their posts.'
        );

      // user logged in, find the relation
      const relation = (
        await this.accountRelationshipsRepository.findOne({
          where: { actorId: account.id, targetId: accountId },
        })
      )?.relationshipType;

      // user does not follow them
      if (relation !== RelationshipType.FOLLOW)
        throw new ForbiddenException(
          `This account is private. Follow @${targetAccount.username} to view their posts.`
        );
    }
    const queryString = { ...q, accountId };

    return await this.findAll(queryString);
  }
}
