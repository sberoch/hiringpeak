import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../common/database/drizzle.module';
import { NotificationController } from './notification.controller';
import { NotificationFactory } from './notification-factory';
import { NotificationService } from './notification.service';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationFactory],
  exports: [NotificationFactory, NotificationService],
})
export class NotificationModule {}
