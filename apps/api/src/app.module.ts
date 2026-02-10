import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './common/database/drizzle.module';
import { ClsModule } from 'nestjs-cls';
import { LoggerMiddleware } from './common/logger/logger.middleware';
import { JwtAuthGuard } from './auth/jwt/jwt.guard';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AreaModule } from './area/area.module';
import { IndustryModule } from './industry/industry.module';
import { SeniorityModule } from './seniority/seniority.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { VacancyStatusModule } from './vacancystatus/vacancystatus.module';
import { CandidateVacancyStatusModule } from './candidatevacancystatus/candidatevacancystatus.module';
import { CandidateSourceModule } from './candidatesource/candidatesource.module';
import { CandidateFileModule } from './candidatefile/candidatefile.module';
import { CandidateModule } from './candidate/candidate.module';
import { CommentModule } from './comment/comment.module';
import { BlacklistModule } from './blacklist/blacklist.module';
import { VacancyModule } from './vacancy/vacancy.module';
import { CandidateVacancyModule } from './candidatevacancy/candidatevacancy.module';
import { CompanyModule } from './company/company.module';
import { OrganizationModule } from './organization/organization.module';
import { OnboardModule } from './onboard/onboard.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    DrizzleModule,
    UserModule,
    AuthModule,
    CandidateModule,
    VacancyModule,
    CandidateVacancyModule,
    CompanyModule,
    AreaModule,
    IndustryModule,
    SeniorityModule,
    VacancyStatusModule,
    CandidateVacancyStatusModule,
    CandidateSourceModule,
    CandidateFileModule,
    CommentModule,
    BlacklistModule,
    DashboardModule,
    OrganizationModule,
    OnboardModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
