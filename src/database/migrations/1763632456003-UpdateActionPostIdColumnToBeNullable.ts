import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateActionPostIdColumnToBeNullable1763632456003 implements MigrationInterface {
    name = 'UpdateActionPostIdColumnToBeNullable1763632456003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_18c2f0aee2214d1c9094804573c"`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "actionPostId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_18c2f0aee2214d1c9094804573c" FOREIGN KEY ("actionPostId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_18c2f0aee2214d1c9094804573c"`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "actionPostId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_18c2f0aee2214d1c9094804573c" FOREIGN KEY ("actionPostId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
