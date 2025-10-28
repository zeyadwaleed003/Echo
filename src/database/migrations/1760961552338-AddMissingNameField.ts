import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingNameField1760961552338 implements MigrationInterface {
    name = 'AddMissingNameField1760961552338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ADD "name" character varying(100) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "name"`);
    }

}
