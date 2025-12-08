import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateConversationsAndMessagesTables1764693338839 implements MigrationInterface {
    name = 'CreateConversationsAndMessagesTables1764693338839'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."conversations_type_enum" AS ENUM('direct', 'group')`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."conversations_type_enum" NOT NULL DEFAULT 'direct', "name" character varying(100), "avatar" character varying(255), "description" character varying(255), "createdById" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "lastMessageAt" TIMESTAMP, CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."messages_type_enum" AS ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker')`);
        await queryRunner.query(`CREATE TYPE "public"."messages_deletiontype_enum" AS ENUM('for_me', 'for_everyone')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."messages_type_enum" NOT NULL DEFAULT 'text', "content" text NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}', "senderId" integer NOT NULL, "conversationId" uuid NOT NULL, "replyToMessageId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "editedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "deletionType" "public"."messages_deletiontype_enum", "isForwarded" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."message_status_status_enum" AS ENUM('sent', 'delivered', 'read')`);
        await queryRunner.query(`CREATE TABLE "message_status" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "messageId" uuid NOT NULL, "accountId" integer NOT NULL, "status" "public"."message_status_status_enum" NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9d5142eafb263c5fec565b22e44" UNIQUE ("messageId", "accountId", "status"), CONSTRAINT "PK_fd8b82470959145fdf427784046" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message_reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "messageId" uuid NOT NULL, "accountId" integer NOT NULL, "emoji" character varying(10) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_588ea69ba274686cc1daafe5542" UNIQUE ("messageId", "accountId", "emoji"), CONSTRAINT "PK_654a9f0059ff93a8f156be66a5b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."conversation_participants_role_enum" AS ENUM('admin', 'member')`);
        await queryRunner.query(`CREATE TABLE "conversation_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."conversation_participants_role_enum" NOT NULL DEFAULT 'member', "clearedAt" TIMESTAMP DEFAULT now(), "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "leftAt" TIMESTAMP, "isMuted" boolean NOT NULL DEFAULT false, "mutedUntil" TIMESTAMP, "customNotifications" jsonb NOT NULL DEFAULT '{}', "isPinned" boolean NOT NULL DEFAULT false, "isArchived" boolean NOT NULL DEFAULT false, "lastReadAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "conversationId" uuid NOT NULL, "accountId" integer NOT NULL, CONSTRAINT "PK_61b51428ad9453f5921369fbe94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_73e0dec6b5702510402d210b3ac" FOREIGN KEY ("createdById") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_4e18c5bd9344f845152f61f5c53" FOREIGN KEY ("replyToMessageId") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_status" ADD CONSTRAINT "FK_59b45c4131fa39314db82f5fb5e" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_status" ADD CONSTRAINT "FK_e66971b0c4e194608778aab33aa" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_reactions" ADD CONSTRAINT "FK_7623d77216e8457a552490259e0" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_reactions" ADD CONSTRAINT "FK_6cc75fd7a2a7113c4098fb05546" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_4453e20858b14ab765a09ad728c" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_bcc5bf647afd53a8560a2742059" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_bcc5bf647afd53a8560a2742059"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_4453e20858b14ab765a09ad728c"`);
        await queryRunner.query(`ALTER TABLE "message_reactions" DROP CONSTRAINT "FK_6cc75fd7a2a7113c4098fb05546"`);
        await queryRunner.query(`ALTER TABLE "message_reactions" DROP CONSTRAINT "FK_7623d77216e8457a552490259e0"`);
        await queryRunner.query(`ALTER TABLE "message_status" DROP CONSTRAINT "FK_e66971b0c4e194608778aab33aa"`);
        await queryRunner.query(`ALTER TABLE "message_status" DROP CONSTRAINT "FK_59b45c4131fa39314db82f5fb5e"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_4e18c5bd9344f845152f61f5c53"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_73e0dec6b5702510402d210b3ac"`);
        await queryRunner.query(`DROP TABLE "conversation_participants"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_participants_role_enum"`);
        await queryRunner.query(`DROP TABLE "message_reactions"`);
        await queryRunner.query(`DROP TABLE "message_status"`);
        await queryRunner.query(`DROP TYPE "public"."message_status_status_enum"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_deletiontype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."messages_type_enum"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_type_enum"`);
    }

}
