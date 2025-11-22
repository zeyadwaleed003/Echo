import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBlockedWordsUniqueness1763549716950 implements MigrationInterface {
    name = 'UpdateBlockedWordsUniqueness1763549716950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blocked_words" ADD CONSTRAINT "UQ_9b1635528fce0cbd5d76425a208" UNIQUE ("text")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blocked_words" DROP CONSTRAINT "UQ_9b1635528fce0cbd5d76425a208"`);
    }

}
