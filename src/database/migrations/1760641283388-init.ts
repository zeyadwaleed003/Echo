import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1760641283388 implements MigrationInterface {
    name = 'Init1760641283388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."accounts_gender_enum" AS ENUM('male', 'female')`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_status_enum" AS ENUM('activated', 'inactivated', 'deactivated', 'suspended')`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_directmessaging_enum" AS ENUM('none', 'verified', 'everyone')`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" SERIAL NOT NULL, "username" character varying(50) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "bio" character varying(160), "location" character varying(30), "phone" character varying(25), "getNotifications" boolean NOT NULL DEFAULT true, "isVerified" boolean NOT NULL DEFAULT false, "verifiedAt" TIMESTAMP, "birthDate" date NOT NULL, "appLanguage" character varying(50) NOT NULL DEFAULT 'english', "countryCreated" character varying(50) NOT NULL, "countryCurrent" character varying(50) NOT NULL, "gender" "public"."accounts_gender_enum" NOT NULL, "isPrivate" boolean NOT NULL DEFAULT false, "status" "public"."accounts_status_enum" NOT NULL, "taggable" boolean NOT NULL DEFAULT true, "displaySensitiveContent" boolean NOT NULL DEFAULT false, "directMessaging" "public"."accounts_directmessaging_enum" NOT NULL, "profilePicture" text, "header" text, "role" "public"."accounts_role_enum" NOT NULL DEFAULT 'user', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_477e3187cedfb5a3ac121e899c9" UNIQUE ("username"), CONSTRAINT "UQ_ee66de6cdc53993296d1ceb8aa0" UNIQUE ("email"), CONSTRAINT "UQ_41704a57004fc60242d7996bd85" UNIQUE ("phone"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."posts_type_enum" AS ENUM('post', 'reply', 'repost')`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" SERIAL NOT NULL, "content" text, "pinned" boolean NOT NULL DEFAULT false, "type" "public"."posts_type_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "accountId" integer, "actionPostId" integer, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post_files" ("id" SERIAL NOT NULL, "url" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "postId" integer, CONSTRAINT "PK_3a75ee290763a3bfa3597f05f3e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('reply', 'repost', 'follow', 'like', 'mention', 'system')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "description" character varying NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "accountId" integer, "actorId" integer, "postId" integer, "actionPostId" integer, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "likes" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "postId" integer, "accountId" integer, CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bookmarks" ("id" BIGSERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "postId" integer, "bookmarkedBy" integer, CONSTRAINT "PK_7f976ef6cecd37a53bd11685f32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blocked_words" ("id" SERIAL NOT NULL, "text" text NOT NULL, CONSTRAINT "PK_70c77899a42da1f3ce3bfc82aa7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "word_relationships" ("accountId" integer NOT NULL, "blockedWordId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_97d5c658537a473f819881a4445" PRIMARY KEY ("accountId", "blockedWordId"))`);
        await queryRunner.query(`CREATE TYPE "public"."refresh_tokens_revocationreason_enum" AS ENUM('rotation', 'logout', 'session_logout', 'deactivation', 'deletion', 'security', 'other')`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "sessionId" uuid NOT NULL, "revocationReason" "public"."refresh_tokens_revocationreason_enum", "revokedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP NOT NULL, "accountId" integer NOT NULL, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."account_relationships_relationshiptype_enum" AS ENUM('follow', 'block', 'mute')`);
        await queryRunner.query(`CREATE TABLE "account_relationships" ("actorId" integer NOT NULL, "targetId" integer NOT NULL, "relationshipType" "public"."account_relationships_relationshiptype_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3b4b39a046e8a6c101da5b1375e" PRIMARY KEY ("actorId", "targetId"))`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_d9ac3ea6a30d3913860fbe5f281" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_18c2f0aee2214d1c9094804573c" FOREIGN KEY ("actionPostId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_files" ADD CONSTRAINT "FK_a12706e0fd90132ab2ffa9b0b1e" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_8da0a4cd8d74c9fdcbe94afc701" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_44412a2d6f162ff4dc1697d0db7" FOREIGN KEY ("actorId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_93c464aaf70fb0720dc500e93c8" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_bebac9d02b1585385da21477466" FOREIGN KEY ("actionPostId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_e2fe567ad8d305fefc918d44f50" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_43803874b893a4db63d857f38bb" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_6e8d0bb8ca2d66f9a6bdd6aa645" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_3ebd7584cc44272534fc359efa3" FOREIGN KEY ("bookmarkedBy") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "word_relationships" ADD CONSTRAINT "FK_01181d1b00c6f60e63a2a99e579" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "word_relationships" ADD CONSTRAINT "FK_c1b36c1a30538b4316de93204e8" FOREIGN KEY ("blockedWordId") REFERENCES "blocked_words"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_0579a04fbd619cc9424b9a4a377" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "FK_be3e8dd7a63ef3c9581cc71b229" FOREIGN KEY ("actorId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_relationships" ADD CONSTRAINT "FK_b13388f43bc28bf0722a81d84b1" FOREIGN KEY ("targetId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "FK_b13388f43bc28bf0722a81d84b1"`);
        await queryRunner.query(`ALTER TABLE "account_relationships" DROP CONSTRAINT "FK_be3e8dd7a63ef3c9581cc71b229"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_0579a04fbd619cc9424b9a4a377"`);
        await queryRunner.query(`ALTER TABLE "word_relationships" DROP CONSTRAINT "FK_c1b36c1a30538b4316de93204e8"`);
        await queryRunner.query(`ALTER TABLE "word_relationships" DROP CONSTRAINT "FK_01181d1b00c6f60e63a2a99e579"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_3ebd7584cc44272534fc359efa3"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_6e8d0bb8ca2d66f9a6bdd6aa645"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_43803874b893a4db63d857f38bb"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_e2fe567ad8d305fefc918d44f50"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_bebac9d02b1585385da21477466"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_93c464aaf70fb0720dc500e93c8"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_44412a2d6f162ff4dc1697d0db7"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_8da0a4cd8d74c9fdcbe94afc701"`);
        await queryRunner.query(`ALTER TABLE "post_files" DROP CONSTRAINT "FK_a12706e0fd90132ab2ffa9b0b1e"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_18c2f0aee2214d1c9094804573c"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_d9ac3ea6a30d3913860fbe5f281"`);
        await queryRunner.query(`DROP TABLE "account_relationships"`);
        await queryRunner.query(`DROP TYPE "public"."account_relationships_relationshiptype_enum"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."refresh_tokens_revocationreason_enum"`);
        await queryRunner.query(`DROP TABLE "word_relationships"`);
        await queryRunner.query(`DROP TABLE "blocked_words"`);
        await queryRunner.query(`DROP TABLE "bookmarks"`);
        await queryRunner.query(`DROP TABLE "likes"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "post_files"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TYPE "public"."posts_type_enum"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_directmessaging_enum"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_gender_enum"`);
    }

}
