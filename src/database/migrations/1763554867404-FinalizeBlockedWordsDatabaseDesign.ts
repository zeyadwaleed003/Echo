import { MigrationInterface, QueryRunner } from "typeorm";

export class FinalizeBlockedWordsDatabaseDesign1763554867404 implements MigrationInterface {
    name = 'FinalizeBlockedWordsDatabaseDesign1763554867404'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "word_relationships" DROP CONSTRAINT "FK_01181d1b00c6f60e63a2a99e579"`);
        await queryRunner.query(`ALTER TABLE "word_relationships" ADD CONSTRAINT "FK_01181d1b00c6f60e63a2a99e579" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "word_relationships" DROP CONSTRAINT "FK_01181d1b00c6f60e63a2a99e579"`);
        await queryRunner.query(`ALTER TABLE "word_relationships" ADD CONSTRAINT "FK_01181d1b00c6f60e63a2a99e579" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
