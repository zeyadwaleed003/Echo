import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
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
import { HttpResponse, QueryString } from 'src/common/types/api.types';
import { InjectRepository } from '@nestjs/typeorm';
import ApiFeatures from 'src/common/utils/ApiFeatures';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';
import { RelationshipType } from '../accounts/accounts.enums';
import { CreateReplyDto } from './dto/create-reply.dto';
import { AiService, ContentClassification } from '../ai/ai.service';
import { Bookmark } from '../bookmarks/entities/bookmark.entity';
import { CreateRepostDto } from './dto/create-repost.dto';
import { RelationshipHelper } from 'src/common/helpers/relationship.helper';
import { SearchService } from '../search/search.service';
import { GroupedPostFile } from './posts.types';
import { I18nService } from 'nestjs-i18n';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notifications.enums';

@Injectable()
export class PostsService {
  private readonly i18nNamespace = 'messages.posts';

  constructor(
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly i18n: I18nService,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostFiles)
    private readonly postFilesRepository: Repository<PostFiles>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(AccountRelationships)
    private readonly accountRelationshipsRepository: Repository<AccountRelationships>,
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
    private readonly aiService: AiService,
    private readonly relationshipHelper: RelationshipHelper,
    @Inject(forwardRef(() => SearchService))
    private readonly searchService: SearchService,
    private readonly notificationsService: NotificationsService
  ) {}

  private containFiles(q: QueryString) {
    const queryString = { ...q };
    const fields = queryString.fields?.split(',');
    return fields?.includes('files');
  }

  private cleanFields(q: QueryString) {
    const queryString = { ...q };
    const fields = queryString.fields?.split(',');

    const validFields = fields!.filter((field: string) => field !== 'files');
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

  private async validateContentWithFiles(
    content: string,
    type: PostType,
    accountId: number,
    actionPostId?: number,
    files?: Express.Multer.File[]
  ) {
    if (content === '' && (!files || files.length === 0)) {
      if (type !== PostType.REPOST) {
        throw new BadRequestException(
          this.i18n.t(`${this.i18nNamespace}.postMustContainContent`)
        );
      }

      const id = actionPostId!;
      const [repost, files] = await Promise.all([
        this.postRepository.find({
          where: { type: PostType.REPOST, content: '', id, accountId },
        }),
        this.postFilesRepository.find({ where: { postId: id } }),
      ]);

      if (repost && !files)
        throw new BadRequestException(
          this.i18n.t(`${this.i18nNamespace}.alreadyReposted`)
        );
    }
  }

  private async create(
    content: string,
    type: PostType,
    account: Account,
    files?: Express.Multer.File[],
    actionPostId?: number
  ) {
    this.validateContentWithFiles(
      content,
      type,
      account.id,
      actionPostId,
      files
    );

    if (
      (type === PostType.REPLY || type === PostType.REPOST) &&
      !actionPostId
    ) {
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.originalPostRequired`)
      );
    }

    let accounts = null;
    if (actionPostId) {
      accounts = await this.relationshipHelper.validateActionPost(
        actionPostId,
        type
      );
      await this.relationshipHelper.checkRelationship(
        account,
        accounts.targetAccount,
        type
      );
    }

    if (
      (await this.aiService.classifyContent(content || '', files)) ===
      ContentClassification.DANGEROUS
    )
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nNamespace}.violatesGuidelines`, {
          args: { type },
        })
      );

    const [post, postFiles] = await this.dataSource.transaction(
      async (manager) => {
        const post = manager.create(Post, {
          content,
          type,
          accountId: account.id,
          actionPostId: actionPostId || null,
        });
        await manager.save(Post, post);

        let postFiles: PostFiles[] = [];

        if (files?.length)
          postFiles = await this.uploadFiles(manager, files, post.id);

        return [post, postFiles];
      }
    );

    post.account = account;
    this.searchService.createPostDocument(post);

    // Notify the user if his post was reposted or someone replied to his post
    if (type === PostType.REPLY || type === PostType.REPOST) {
      let notificationType = NotificationType.REPLY;
      if (type === PostType.REPOST) notificationType = NotificationType.REPOST;

      this.notificationsService.create({
        actorId: account.id,
        type: notificationType,
        postId: accounts!.actionPost.id,
        accountId: accounts!.actionPost.accountId,
        description: `@${account.username} ${type}ed your post`,
      });
    }

    return {
      message: this.i18n.t(`${this.i18nNamespace}.createdSuccessfully`, {
        args: { type },
      }),
      data: { ...post, postFiles },
    };
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

    const data = posts.map((post) => ({
      ...post,
      files: (!q.fields || containFiles) && (files[post.id] || []),
    }));

    return data;
  }

  async createPost(
    createPostDto: CreatePostDto,
    account: Account,
    files?: Express.Multer.File[]
  ) {
    return this.create(createPostDto.content, PostType.POST, account, files);
  }

  async findAllPosts(q: any) {
    const data = await this.findAll(q);
    const res: HttpResponse = {
      size: data.length,
      data,
    };

    return res;
  }

  async findUserPosts(account: Account, q: any) {
    const queryString = { ...q, accountId: account.id };

    return await this.findAll(queryString);
  }

  async findOne(id: number, account?: Account) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.notFound`)
      );

    const [author, files] = await Promise.all([
      this.accountsRepository.findOneBy({ id: post.accountId }),
      this.postFilesRepository.findBy({ postId: post.id }),
    ]);

    if (!author)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.authorNotFound`)
      );

    if (account) {
      await this.relationshipHelper.checkRelationship(account, author, 'view');
    }

    if (!author.isPrivate)
      return {
        data: { ...post, files },
      };

    if (!account)
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nNamespace}.privateAccountLogin`)
      );

    const res: HttpResponse = {
      data: { ...post, files },
    };

    return res;
  }

  async update(
    id: number,
    account: Account,
    updatePostDto: UpdatePostDto,
    files?: Express.Multer.File[]
  ): Promise<HttpResponse> {
    const post = await this.postRepository.findOneBy({ id });
    if (!post)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.notFound`)
      );

    if (account.id !== post.accountId)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nNamespace}.noPermissionToUpdate`)
      );

    if (
      (await this.aiService.classifyContent(
        updatePostDto.content || '',
        files
      )) === ContentClassification.DANGEROUS
    )
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nNamespace}.violatesGuidelines`, {
          args: { type: 'post' },
        })
      );

    const [updatedPost, postFiles] = await this.dataSource.transaction(
      async (manager) => {
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
            throw new ForbiddenException(
              this.i18n.t(`${this.i18nNamespace}.filesNotBelongToPost`, {})
            );

          await this.cloudinaryService.deleteMultipleFiles(
            filesToDelete.map((f) => f.url)
          );
          await postFilesRepository.remove(filesToDelete);
          remainingFilesCount -= filesToDelete.length;
        }

        // handle file uploads
        if (files?.length) {
          if (files.length + remainingFilesCount > 4)
            throw new ForbiddenException(
              this.i18n.t(`${this.i18nNamespace}.maxFilesExceeded`, {})
            );

          await this.uploadFiles(manager, files, post.id);
        }

        const updatedPost = await postRepository.findOne({
          where: { id },
          relations: ['account'],
        });
        const postFiles = await postFilesRepository.find({
          where: { postId: id },
        });

        return [updatedPost, postFiles];
      }
    );

    this.searchService.updatePostDocument(post);
    return {
      message: this.i18n.t(`${this.i18nNamespace}.updatedSuccessfully`, {}),
      data: {
        ...updatedPost,
        ...(postFiles.length > 0 && { files: postFiles }),
      },
    };
  }

  async remove(id: number, account: Account): Promise<HttpResponse> {
    const post = await this.postRepository.findOneBy({ id });
    if (!post)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.notFoundGeneric`)
      );

    const type = post.type;

    if (account.id !== post.accountId)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nNamespace}.noPermissionToDelete`, {
          args: { type },
        })
      );

    await this.dataSource.transaction(async (manager) => {
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
    });

    this.searchService.deletePostDocument(id);
    return {
      message: this.i18n.t(`${this.i18nNamespace}.deletedSuccessfully`, {
        args: { type },
      }),
    };
  }

  async findAccountPosts(accountId: number, q: QueryString, account?: Account) {
    const targetAccount = await this.accountsRepository.findOne({
      where: { id: accountId },
    });
    if (!targetAccount)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.accountNotFound`)
      );

    if (account?.id === accountId) {
      const queryString = { ...q, accountId };
      return await this.findAll(queryString);
    }

    // account is private
    if (targetAccount.isPrivate) {
      // user not logged in
      if (!account)
        throw new UnauthorizedException(
          this.i18n.t(`${this.i18nNamespace}.privateAccountLoginPosts`)
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
          this.i18n.t(`${this.i18nNamespace}.privateAccountFollow`, {
            args: { username: targetAccount.username },
          })
        );
    }
    const queryString = { ...q, accountId };

    return await this.findAll(queryString);
  }

  async pinPost(account: Account, id: number) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.notFound`)
      );

    if (post.accountId !== account.id)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nNamespace}.noPermissionToPin`)
      );

    if (post.pinned)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nNamespace}.alreadyPinned`)
      );

    return await this.dataSource.transaction(async (manager) => {
      const postRepository = manager.getRepository(Post);

      await postRepository.update(
        { accountId: account.id, pinned: true },
        { pinned: false }
      );

      await postRepository.update({ id }, { pinned: true });

      const res: HttpResponse = {
        message: this.i18n.t(`${this.i18nNamespace}.pinnedSuccessfully`),
      };
      return res;
    });
  }

  async createReply(
    account: Account,
    actionPostId: number,
    createReplyDto: CreateReplyDto,
    files?: Express.Multer.File[]
  ) {
    return await this.create(
      createReplyDto.content,
      PostType.REPLY,
      account,
      files,
      actionPostId
    );
  }

  async getPostReplies(
    actionPostId: number,
    q: QueryString,
    account?: Account
  ) {
    let queryString = {
      ...q,
      type: PostType.REPLY,
      actionPostId,
    };

    const allReplies = await this.findAll(queryString);
    if (!allReplies.length) {
      const res: HttpResponse = {
        size: 0,
        data: [],
      };
      return res;
    }

    const accountsIds = [
      ...new Set(allReplies.map((reply) => reply.accountId)),
    ];

    const privateAccounts = await this.accountsRepository.find({
      where: { id: In(accountsIds), isPrivate: true },
      select: ['id'],
    });
    const privateAccountsIds = new Set(privateAccounts.map((acc) => acc.id));

    // not logged in , only show the public replies
    if (!account) {
      const data = allReplies.filter(
        (reply) => !privateAccountsIds.has(reply.accountId)
      );
      const res: HttpResponse = {
        size: data.length,
        data,
      };
      return res;
    }

    const [privateFollowedAccounts, mutedOrBlockedAccounts, blockedByAccounts] =
      await Promise.all([
        // Only query if there are private accounts
        privateAccountsIds.size > 0
          ? this.accountRelationshipsRepository.find({
              select: ['targetId'],
              where: {
                actorId: account.id,
                targetId: In([...privateAccountsIds]),
                relationshipType: RelationshipType.FOLLOW,
              },
            })
          : [],
        this.accountRelationshipsRepository.find({
          select: ['targetId'],
          where: {
            targetId: In(accountsIds),
            actorId: account.id,
            relationshipType: In([
              RelationshipType.MUTE,
              RelationshipType.BLOCK,
            ]),
          },
        }),
        this.accountRelationshipsRepository.find({
          select: ['actorId'],
          where: {
            actorId: In(accountsIds),
            targetId: account.id,
            relationshipType: RelationshipType.BLOCK,
          },
        }),
      ]);

    const privateFollowedAccountsIds = new Set(
      privateFollowedAccounts.map((rel) => rel.targetId)
    );
    const mutedOrBlockedAccountsIds = new Set(
      mutedOrBlockedAccounts.map((rel) => rel.targetId)
    );
    const blockedByAccountsIds = new Set(
      blockedByAccounts.map((rel) => rel.actorId)
    );

    const visibleReplies = allReplies.filter((reply) => {
      const accountId = reply.accountId;

      if (
        mutedOrBlockedAccountsIds.has(accountId) ||
        blockedByAccountsIds.has(accountId)
      )
        return false;

      if (accountId === account.id || !privateAccountsIds.has(accountId))
        return true;

      return privateFollowedAccountsIds.has(accountId);
    });

    const res: HttpResponse = {
      size: visibleReplies.length,
      data: visibleReplies,
    };
    return res;
  }

  async getPostBookmarks(id: number) {
    const postExists = await this.postRepository.existsBy({ id });
    if (!postExists)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.notFound`)
      );

    const bookmarksNumber = await this.bookmarkRepository.count({
      where: { postId: id },
    });

    const res: HttpResponse = {
      data: {
        bookmarksNumber,
      },
    };
    return res;
  }

  async createRepost(
    account: Account,
    actionPostId: number,
    createRepostDto: CreateRepostDto,
    files?: Express.Multer.File[]
  ) {
    return await this.create(
      createRepostDto.content,
      PostType.REPOST,
      account,
      files,
      actionPostId
    );
  }

  async findPostFiles(postIds: number[]) {
    return (await this.postFilesRepository
      .createQueryBuilder('f')
      .select('f.postId', 'postId')
      .addSelect(
        "json_agg(json_build_object('id', f.id, 'url', f.url, 'createdAt', f.createdAt))",
        'files'
      )
      .where('f.postId IN (:...postIds)', { postIds })
      .groupBy('f.postId')
      .getRawMany()) as GroupedPostFile[];
  }
}
