import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndices1765495786003 implements MigrationInterface {
    name = 'AddIndices1765495786003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3b4b39a046e8a6c101da5b1375"`);
        await queryRunner.query(`CREATE INDEX "IDX_d9ac3ea6a30d3913860fbe5f28" ON "posts" ("accountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a12706e0fd90132ab2ffa9b0b1" ON "post_files" ("postId") `);
        await queryRunner.query(`CREATE INDEX "IDX_86163e406510569ce7d6d4e9e8" ON "conversation_participants" ("conversationId", "accountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6e8d0bb8ca2d66f9a6bdd6aa64" ON "bookmarks" ("postId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0579a04fbd619cc9424b9a4a37" ON "refresh_tokens" ("accountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b25a58a00578bd1b7a01623d2d" ON "refresh_tokens" ("sessionId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bcea76f58f3048f8a0987fd6e2" ON "account_relationships" ("actorId", "targetId", "relationshipType") `);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "UQ_3b4b39a046e8a6c101da5b1375e" UNIQUE ("actorId", "targetId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "UQ_3b4b39a046e8a6c101da5b1375e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bcea76f58f3048f8a0987fd6e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b25a58a00578bd1b7a01623d2d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0579a04fbd619cc9424b9a4a37"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6e8d0bb8ca2d66f9a6bdd6aa64"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_86163e406510569ce7d6d4e9e8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a12706e0fd90132ab2ffa9b0b1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d9ac3ea6a30d3913860fbe5f28"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3b4b39a046e8a6c101da5b1375" ON "account_relationships" ("actorId", "targetId") `);
    }

}
