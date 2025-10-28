import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFieldsToAcceptNullValues1761137733258 implements MigrationInterface {
    name = 'UpdateFieldsToAcceptNullValues1761137733258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "username" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "password" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "birthDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "gender" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "directMessaging" SET DEFAULT 'none'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "directMessaging" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "gender" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "birthDate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "username" SET NOT NULL`);
    }

}
