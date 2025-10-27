import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { VerifyOtpDto } from './dto/verify-account.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import type { Request, Response } from 'express';
import { sendResponse } from 'src/common/utils/functions';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return await this.authService.signup(signupDto);
  }

  @Post('verify-account')
  @HttpCode(HttpStatus.OK)
  async verifyAccount(
    @Body() verifyAccountDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.verifyAccount(verifyAccountDto);
    const { refreshToken, ...response } = result;

    this.authService.sendCookie(res, 'refreshToken', refreshToken!);
    return response;
  }

  @Post('google')
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto, @Res() res: Response) {
    const result = await this.authService.googleAuth(googleAuthDto);

    const { refreshToken, ...response } = result;
    this.authService.sendCookie(res, 'refreshToken', refreshToken!);

    sendResponse(res, response);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(loginDto);
    const { refreshToken, ...response } = result;

    this.authService.sendCookie(res, 'refreshToken', refreshToken!);
    return response;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    if (!('refreshToken' in req.cookies))
      throw new UnauthorizedException('Refresh token not found in cookies');

    const result = await this.authService.refreshToken(
      req.cookies.refreshToken
    );

    const { refreshToken, ...response } = result;
    this.authService.sendCookie(res, 'refreshToken', refreshToken!);

    return response;
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!('refreshToken' in req.cookies))
      throw new UnauthorizedException('Refresh token not found in cookies');

    const result = await this.authService.logout(req.cookies.refreshToken);
    res.clearCookie('refreshToken');

    return result;
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.changePassword(
      changePasswordDto,
      req.account!
    );

    res.clearCookie('refreshToken');
    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('verify-reset-password')
  @HttpCode(HttpStatus.OK)
  async verifyPasswordResetToken(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.authService.verifyResetPasswordToken(verifyOtpDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPassword: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.resetPassword(resetPassword);

    res.clearCookie('refreshToken');
    return result;
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(
    @Body() resendVerificationDto: ResendVerificationDto
  ) {
    return await this.authService.resendVerificationEmail(
      resendVerificationDto.email
    );
  }
}
