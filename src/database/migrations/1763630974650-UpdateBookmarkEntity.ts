import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBookmarkEntity1763630974650 implements MigrationInterface {
    name = 'UpdateBookmarkEntity1763630974650'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_3ebd7584cc44272534fc359efa3"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP COLUMN "bookmarkedBy"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD "bookmarkedById" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_d9ac3ea6a30d3913860fbe5f281"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_18c2f0aee2214d1c9094804573c"`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "accountId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "actionPostId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_6e8d0bb8ca2d66f9a6bdd6aa645"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ALTER COLUMN "postId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_d9ac3ea6a30d3913860fbe5f281" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_18c2f0aee2214d1c9094804573c" FOREIGN KEY ("actionPostId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_6e8d0bb8ca2d66f9a6bdd6aa645" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_863dff5bab7ad7d8dcd4223289a" FOREIGN KEY ("bookmarkedById") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_863dff5bab7ad7d8dcd4223289a"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_6e8d0bb8ca2d66f9a6bdd6aa645"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_18c2f0aee2214d1c9094804573c"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_d9ac3ea6a30d3913860fbe5f281"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ALTER COLUMN "postId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_6e8d0bb8ca2d66f9a6bdd6aa645" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "actionPostId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "accountId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_18c2f0aee2214d1c9094804573c" FOREIGN KEY ("actionPostId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_d9ac3ea6a30d3913860fbe5f281" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP COLUMN "bookmarkedById"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD "bookmarkedBy" integer`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_3ebd7584cc44272534fc359efa3" FOREIGN KEY ("bookmarkedBy") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
