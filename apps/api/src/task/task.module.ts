import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../common/database/drizzle.module';
import { NotificationModule } from '../notification/notification.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [DrizzleModule, AuthModule, NotificationModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
