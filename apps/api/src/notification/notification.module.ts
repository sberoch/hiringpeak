import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../common/database/drizzle.module';
import { DeadlineSweepScheduler } from './deadline-sweep.scheduler';
import { NotificationController } from './notification.controller';
import { NotificationFactory } from './notification-factory';
import { NotificationService } from './notification.service';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationFactory, DeadlineSweepScheduler],
  exports: [NotificationFactory, NotificationService],
})
export class NotificationModule {}
