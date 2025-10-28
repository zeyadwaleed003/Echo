import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAndUpdateCountryFields1761153097213 implements MigrationInterface {
    name = 'RemoveAndUpdateCountryFields1761153097213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "countryCreated"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "countryCurrent"`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "currentCountry" character varying(50)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "currentCountry"`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "countryCurrent" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "countryCreated" character varying(50) NOT NULL`);
    }

}
