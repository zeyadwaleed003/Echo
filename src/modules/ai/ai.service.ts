import { google } from '@ai-sdk/google';
import { Injectable } from '@nestjs/common';
import { generateObject, ModelMessage } from 'ai';

export enum ContentClassification {
  SAFE = 'safe',
  SUSPICIOUS = 'suspicious',
  DANGEROUS = 'dangerous',
}

@Injectable()
export class AiService {
  private readonly model = google('gemini-2.0-flash');

  async classifyContent(
    text: string,
    files?: Express.Multer.File[]
  ): Promise<ContentClassification> {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text,
          },
        ],
      },
    ];

    if (files) {
      files.forEach((f) =>
        messages.push({
          role: 'user',
          content: [
            {
              type: 'image',
              image: f.buffer,
            },
          ],
        })
      );
    }

    const { object } = await generateObject({
      model: this.model,
      output: 'enum',
      enum: [
        ContentClassification.SAFE,
        ContentClassification.SUSPICIOUS,
        ContentClassification.DANGEROUS,
      ],
      messages,
      system:
        `You are a content moderation AI assistant ` +
        `Your task is to classify the content into one of three categories: ` +
        `SAFE, SUSPICIOUS, or DANGEROUS`,
    });

    return object;
  }
}
