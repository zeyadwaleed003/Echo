import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSomeEnums1761566840281 implements MigrationInterface {
    name = 'UpdateSomeEnums1761566840281'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."refresh_tokens_revocationreason_enum" RENAME TO "refresh_tokens_revocationreason_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."refresh_tokens_revocationreason_enum" AS ENUM('rotation', 'reuse', 'logout', 'password_change', 'deactivation', 'deletion', 'security', 'other')`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "revocationReason" TYPE "public"."refresh_tokens_revocationreason_enum" USING "revocationReason"::"text"::"public"."refresh_tokens_revocationreason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."refresh_tokens_revocationreason_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."refresh_tokens_revocationreason_enum_old" AS ENUM('rotation', 'logout', 'session_logout', 'deactivation', 'deletion', 'security', 'other')`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "revocationReason" TYPE "public"."refresh_tokens_revocationreason_enum_old" USING "revocationReason"::"text"::"public"."refresh_tokens_revocationreason_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."refresh_tokens_revocationreason_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."refresh_tokens_revocationreason_enum_old" RENAME TO "refresh_tokens_revocationreason_enum"`);
    }

}
