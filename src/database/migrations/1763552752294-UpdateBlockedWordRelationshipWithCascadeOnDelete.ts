import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBlockedWordRelationshipWithCascadeOnDelete1763552752294 implements MigrationInterface {
    name = 'UpdateBlockedWordRelationshipWithCascadeOnDelete1763552752294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "word_relationships" DROP CONSTRAINT "FK_c1b36c1a30538b4316de93204e8"`);
        await queryRunner.query(`ALTER TABLE "word_relationships" ADD CONSTRAINT "FK_c1b36c1a30538b4316de93204e8" FOREIGN KEY ("blockedWordId") REFERENCES "blocked_words"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "word_relationships" DROP CONSTRAINT "FK_c1b36c1a30538b4316de93204e8"`);
        await queryRunner.query(`ALTER TABLE "word_relationships" ADD CONSTRAINT "FK_c1b36c1a30538b4316de93204e8" FOREIGN KEY ("blockedWordId") REFERENCES "blocked_words"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
