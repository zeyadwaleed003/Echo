import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBookmarkEntityIdToBeNumberType1763635968943 implements MigrationInterface {
    name = 'UpdateBookmarkEntityIdToBeNumberType1763635968943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "PK_7f976ef6cecd37a53bd11685f32"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "PK_7f976ef6cecd37a53bd11685f32" PRIMARY KEY ("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "PK_7f976ef6cecd37a53bd11685f32"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "PK_7f976ef6cecd37a53bd11685f32" PRIMARY KEY ("id")`);
    }

}
