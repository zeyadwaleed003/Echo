import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import type { Response } from 'express';
import sendReponse from 'src/common/utils/sendReponse';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return await this.authService.signup(signupDto);
  }

  @Post('verify-account')
  async verifyAccount(@Body() verifyAccountDto: VerifyAccountDto) {
    return await this.authService.verifyAccount(verifyAccountDto);
  }

  @Post('google')
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto, @Res() res: Response) {
    const result = await this.authService.googleAuth(googleAuthDto);
    sendReponse(res, result);
  }
}
