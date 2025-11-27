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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReactivationTokenDto } from './dto/reactivation-token.dto';
import { CompleteSetupDto } from './dto/complete-setup.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Creates a new account and sends a verification code to the provided email.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Account created successfully. Please check your email for the verification code.',
  })
  @ApiBody({ type: SignupDto })
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return await this.authService.signup(signupDto);
  }

  @ApiOperation({
    summary: 'Verify account with OTP',
    description: 'Verifies the account using the OTP sent to the email.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Email verified successfully. Please complete your profile setup.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @Post('verify-account')
  @HttpCode(HttpStatus.OK)
  async verifyAccount(
    @Body() verifyAccountDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.verifyAccount(verifyAccountDto);
    return result;
  }

  @ApiOperation({
    summary: 'Authenticate with Google',
    description: 'Authenticate or register using Google OAuth.',
  })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: GoogleAuthDto })
  @Post('google')
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto, @Res() res: Response) {
    const result = await this.authService.googleAuth(googleAuthDto);

    const { refreshToken, ...response } = result;
    this.authService.sendCookie(res, 'refreshToken', refreshToken!);

    sendResponse(res, response);
  }

  @ApiOperation({
    summary: 'Login with email or username and password',
    description: 'Logs in the user and sets a refresh token cookie.',
  })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: LoginDto })
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

  @ApiOperation({
    summary: 'Refresh authentication token',
    description:
      'Refreshes the access token using the refresh token from cookies.',
  })
  @ApiResponse({ status: 200 })
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

  @ApiOperation({
    summary: 'Logout account and clear refresh token',
    description: 'Logs out the user and clears the refresh token cookie.',
  })
  @ApiResponse({ status: 204 })
  @ApiBearerAuth()
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

  @ApiOperation({
    summary: 'Change account password',
    description: 'Allows authenticated users to change their password.',
  })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: ChangePasswordDto })
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

  @ApiOperation({
    summary: 'Send forgot password email',
    description: "Sends a password reset code to the user's email.",
  })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: ForgotPasswordDto })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @ApiOperation({
    summary: 'Verify password reset token',
    description: "Verifies the password reset code sent to the user's email.",
  })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: VerifyOtpDto })
  @Post('verify-reset-password')
  @HttpCode(HttpStatus.OK)
  async verifyPasswordResetToken(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.authService.verifyResetPasswordToken(verifyOtpDto);
  }

  @ApiOperation({
    summary: 'Reset account password',
    description: "Resets the user's password using a valid reset token.",
  })
  @ApiResponse({ status: 200 })
  @ApiBody({ type: ResetPasswordDto })
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

  @ApiOperation({
    summary: 'Resend account verification email',
    description: "Resends the verification code to the user's email.",
  })
  @ApiResponse({
    status: 200,
  })
  @ApiBody({ type: ResendVerificationDto })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(
    @Body() resendVerificationDto: ResendVerificationDto
  ) {
    return await this.authService.resendVerificationEmail(
      resendVerificationDto.email
    );
  }

  @ApiOperation({
    summary: 'Reactivate a deactivated account',
    description:
      'Reactivates a deactivated account using the reactivation token and logs the user in.',
  })
  @ApiResponse({ status: 200 })
  @Post('reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivateAndLogin(
    @Body() reactivationTokenDto: ReactivationTokenDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.reactivateAndLogin(
      reactivationTokenDto.reactivationToken
    );
    const { refreshToken, ...response } = result;

    this.authService.sendCookie(res, 'refreshToken', refreshToken!);
    return response;
  }

  @Post('complete-setup')
  @HttpCode(HttpStatus.OK)
  async completeProfileSetup(
    @Body() completeSetupDto: CompleteSetupDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.completeSetup(completeSetupDto);
    const { refreshToken, ...response } = result;

    this.authService.sendCookie(res, 'refreshToken', refreshToken!);
    return response;
  }
}
