import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../common/database/drizzle.module';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [PreferencesController],
  providers: [PreferencesService],
  exports: [PreferencesService],
})
export class PreferencesModule {}
