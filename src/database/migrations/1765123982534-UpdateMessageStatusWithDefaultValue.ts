import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMessageStatusWithDefaultValue1765123982534 implements MigrationInterface {
    name = 'UpdateMessageStatusWithDefaultValue1765123982534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_status" DROP CONSTRAINT "UQ_9d5142eafb263c5fec565b22e44"`);
        await queryRunner.query(`ALTER TABLE "message_status" ALTER COLUMN "status" SET DEFAULT 'sent'`);
        await queryRunner.query(`ALTER TABLE "message_status" ADD CONSTRAINT "UQ_9d5142eafb263c5fec565b22e44" UNIQUE ("messageId", "accountId", "status")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_status" DROP CONSTRAINT "UQ_9d5142eafb263c5fec565b22e44"`);
        await queryRunner.query(`ALTER TABLE "message_status" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "message_status" ADD CONSTRAINT "UQ_9d5142eafb263c5fec565b22e44" UNIQUE ("messageId", "accountId", "status")`);
    }

}
