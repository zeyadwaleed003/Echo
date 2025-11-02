import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { DataSource, In, Repository } from 'typeorm';
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

      if (files?.length) {
        const uploadedFiles =
          await this.cloudinaryService.uploadMultipleFiles(files);
        postFiles = uploadedFiles.map((file) =>
          manager.create(PostFiles, {
            url: file.secure_url,
            postId: post.id,
          })
        );
        await manager.save(PostFiles, postFiles);
      }

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
    if (!post) throw new BadRequestException('No post found with this id');

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

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
