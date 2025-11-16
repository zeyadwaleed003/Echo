import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAccountRelationshipsTableRelations1761861288533 implements MigrationInterface {
    name = 'UpdateAccountRelationshipsTableRelations1761861288533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."account_relationships_relationshiptype_enum" RENAME TO "account_relationships_relationshiptype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."account_relationships_relationshiptype_enum" AS ENUM('follow', 'block', 'mute', 'follow_request')`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ALTER COLUMN "relationshipType" TYPE "public"."account_relationships_relationshiptype_enum" USING "relationshipType"::"text"::"public"."account_relationships_relationshiptype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."account_relationships_relationshiptype_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."account_relationships_relationshiptype_enum_old" AS ENUM('follow', 'block', 'mute')`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ALTER COLUMN "relationshipType" TYPE "public"."account_relationships_relationshiptype_enum_old" USING "relationshipType"::"text"::"public"."account_relationships_relationshiptype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."account_relationships_relationshiptype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."account_relationships_relationshiptype_enum_old" RENAME TO "account_relationships_relationshiptype_enum"`);
    }

}
