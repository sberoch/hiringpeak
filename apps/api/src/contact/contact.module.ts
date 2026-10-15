import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
