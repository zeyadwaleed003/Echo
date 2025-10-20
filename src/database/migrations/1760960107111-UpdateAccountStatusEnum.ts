import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAccountStatusEnum1760960107111 implements MigrationInterface {
    name = 'UpdateAccountStatusEnum1760960107111'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."accounts_status_enum" RENAME TO "accounts_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_status_enum" AS ENUM('activated', 'inactivated', 'pending', 'deactivated', 'suspended')`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "status" TYPE "public"."accounts_status_enum" USING "status"::"text"::"public"."accounts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."accounts_status_enum_old" AS ENUM('activated', 'inactivated', 'deactivated', 'suspended')`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "status" TYPE "public"."accounts_status_enum_old" USING "status"::"text"::"public"."accounts_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."accounts_status_enum_old" RENAME TO "accounts_status_enum"`);
    }

}
