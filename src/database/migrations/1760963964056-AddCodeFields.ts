import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCodeFields1760963964056 implements MigrationInterface {
    name = 'AddCodeFields1760963964056'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ADD "verificationCode" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "verificationCodeExpiresAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "passwordResetCode" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "passwordResetCodeExpiresAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "passwordResetCodeExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "passwordResetCode"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "verificationCodeExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "verificationCode"`);
    }

}
