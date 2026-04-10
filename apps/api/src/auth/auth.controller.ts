import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { FeatureFlag } from '../feature-flag/feature-flag.enum';
import { FeatureFlagGuard } from '../feature-flag/feature-flag.guard';
import { RequireFeatureFlags } from '../feature-flag/feature-flag.decorator';
import { Public } from './auth.decorators';
import { CurrentUser } from './auth.decorators';
import { AuthService } from './auth.service';
import { AuthzService } from './authz/authz.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private authService: AuthService,
    private authzService: AuthzService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FeatureFlagGuard)
  @RequireFeatureFlags([FeatureFlag.LOGIN_ENABLED], 'all')
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login request received via ${loginDto.origin ?? 'web'}`);
    return this.authService.loginWithOrigin(loginDto);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FeatureFlagGuard)
  @RequireFeatureFlags([FeatureFlag.LOGIN_ENABLED, FeatureFlag.GOOGLE_LOGIN_ENABLED], 'all')
  async google(@Body() body: GoogleLoginDto) {
    return this.authService.loginWithGoogle(body.id_token);
  }

  @ApiBearerAuth()
  @ApiOkResponse()
  @Get('me/permissions')
  async getMePermissions(
    @CurrentUser() user: { id: number },
  ) {
    const userId = typeof user.id === 'string' ? parseInt(String(user.id), 10) : user.id;
    return this.authzService.getMePermissions(userId);
  }
}
