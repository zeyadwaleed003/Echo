import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateNotificationEntityAgain1764505950426 implements MigrationInterface {
    name = 'UpdateNotificationEntityAgain1764505950426'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_bebac9d02b1585385da21477466"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "actionPostId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ADD "actionPostId" integer`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_bebac9d02b1585385da21477466" FOREIGN KEY ("actionPostId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
