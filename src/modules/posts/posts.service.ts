import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { DataSource } from 'typeorm';
import { PostFiles } from './entities/post-file.entity';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { PostType } from './posts.enums';
import { Account } from '../accounts/entities/account.entity';
// import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostsService {
  constructor(
    private readonly dataSource: DataSource,
    // @InjectRepository(Post)
    // private readonly postRepository: Repository<Post>,
    private readonly cloudinaryService: CloudinaryService
  ) {}

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
      return { ...post, postFiles };
    });
  }

  async findAll() {
    const posts = await this.dataSource
      .getRepository(Post)
      .createQueryBuilder('post')
      .leftJoinAndMapMany(
        'post.files',
        PostFiles,
        'postFiles',
        'postFiles.postId = post.id'
      )
      .addSelect(['postFiles.url'])
      .getMany();

    return posts;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
