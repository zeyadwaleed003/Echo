import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAccountRelationshipsTableWithIdAsPrimaryKey1761988988808 implements MigrationInterface {
    name = 'UpdateAccountRelationshipsTableWithIdAsPrimaryKey1761988988808'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "PK_3b4b39a046e8a6c101da5b1375e"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "PK_76ae8223b45a6b713cd629e7f73" PRIMARY KEY ("actorId", "targetId", "id")`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "FK_be3e8dd7a63ef3c9581cc71b229"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "FK_b13388f43bc28bf0722a81d84b1"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "PK_76ae8223b45a6b713cd629e7f73"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "PK_99b627f6c97f6ba7642a73152d0" PRIMARY KEY ("targetId", "id")`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "PK_99b627f6c97f6ba7642a73152d0"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "PK_d00535d42298816f656de189901" PRIMARY KEY ("id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3b4b39a046e8a6c101da5b1375" ON "account_relationships" ("actorId", "targetId") `);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "FK_be3e8dd7a63ef3c9581cc71b229" FOREIGN KEY ("actorId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "FK_b13388f43bc28bf0722a81d84b1" FOREIGN KEY ("targetId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "FK_b13388f43bc28bf0722a81d84b1"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "FK_be3e8dd7a63ef3c9581cc71b229"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b4b39a046e8a6c101da5b1375"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "PK_d00535d42298816f656de189901"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "PK_99b627f6c97f6ba7642a73152d0" PRIMARY KEY ("targetId", "id")`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "PK_99b627f6c97f6ba7642a73152d0"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "PK_76ae8223b45a6b713cd629e7f73" PRIMARY KEY ("actorId", "targetId", "id")`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "FK_b13388f43bc28bf0722a81d84b1" FOREIGN KEY ("targetId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "FK_be3e8dd7a63ef3c9581cc71b229" FOREIGN KEY ("actorId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "PK_76ae8223b45a6b713cd629e7f73"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "PK_3b4b39a046e8a6c101da5b1375e" PRIMARY KEY ("actorId", "targetId")`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP COLUMN "id"`);
    }

}
