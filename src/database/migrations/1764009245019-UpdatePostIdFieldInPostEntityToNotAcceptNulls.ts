import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePostIdFieldInPostEntityToNotAcceptNulls1764009245019 implements MigrationInterface {
    name = 'UpdatePostIdFieldInPostEntityToNotAcceptNulls1764009245019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_files" DROP CONSTRAINT "FK_a12706e0fd90132ab2ffa9b0b1e"`);
        await queryRunner.query(`ALTER TABLE "post_files" ALTER COLUMN "postId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "PK_d00535d42298816f656de189901"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "PK_d00535d42298816f656de189901" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "post_files" ADD CONSTRAINT "FK_a12706e0fd90132ab2ffa9b0b1e" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_files" DROP CONSTRAINT "FK_a12706e0fd90132ab2ffa9b0b1e"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "PK_d00535d42298816f656de189901"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "PK_d00535d42298816f656de189901" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "post_files" ALTER COLUMN "postId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post_files" ADD CONSTRAINT "FK_a12706e0fd90132ab2ffa9b0b1e" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
