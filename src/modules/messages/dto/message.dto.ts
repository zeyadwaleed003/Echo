import { IsNotEmpty, IsUUID } from "class-validator";

export class MessageDto {
  @IsUUID("4", {
    message: "Message ID must be a valid UUID",
  })
  @IsNotEmpty({
    message: "Message ID is required",
  })
  messageId: string;

  @IsUUID("4", {
    message: "Conversation ID must be a valid UUID",
  })
  @IsNotEmpty({
    message: "Conversation ID is required",
  })
  conversationId: string;
}
