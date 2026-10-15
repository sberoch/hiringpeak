import { Module } from '@nestjs/common';
import { ContactSourceController } from './contactsource.controller';
import { ContactSourceService } from './contactsource.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [ContactSourceController],
  providers: [ContactSourceService],
  exports: [ContactSourceService],
})
export class ContactSourceModule {}
