import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FeatureFlag } from '../feature-flag/feature-flag.enum';
import { FeatureFlagGuard } from '../feature-flag/feature-flag.guard';
import { RequireFeatureFlags } from '../feature-flag/feature-flag.decorator';
import { Public } from './auth.decorators';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FeatureFlagGuard)
  @RequireFeatureFlags([FeatureFlag.LOGIN_ENABLED], 'all')
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`loginDto: ${JSON.stringify(loginDto)}`);
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
}
