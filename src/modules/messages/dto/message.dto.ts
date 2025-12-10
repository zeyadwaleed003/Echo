import { PickType } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";
import { CreateMessageDto } from "./create-message.dto";

export class MessageDto extends PickType(CreateMessageDto, ["tempId"]) {
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
