import { IsNotEmpty, IsString, Length, Matches } from "class-validator";
import { MessageDto } from "./message.dto";

export class MessageReactDto extends MessageDto {
  @IsNotEmpty({
    message: "Emoji cannot be empty",
  })
  @IsString({
    message: "Emoji must be a valid string value",
  })
  @Length(1, 10, {
    message: "Emoji length must be between 1 and 10 characters",
  })
  @Matches(/^[\p{Emoji}\p{Emoji_Component}]+$/u, {
    message: "Invalid emoji format",
  })
  emoji: string;
}
