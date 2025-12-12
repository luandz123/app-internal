import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { UserModule } from './modules/user/user.module';
import { RegistrationPeriodModule } from './modules/registration-period/registration-period.module';
import { WorkScheduleModule } from './modules/work-schedule/work-schedule.module';
import { LeaveRequestModule } from './modules/leave-request/leave-request.module';
import { SalaryModule } from './modules/salary/salary.module';
import { RegulationModule } from './modules/regulation/regulation.module';
import { NotificationModule } from './modules/notification/notification.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FileModule } from './modules/file/file.module';
import { ChamCongModule } from './modules/cham-cong/cham-cong.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        database: configService.get<string>('DATABASE_NAME'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        autoLoadEntities: true,
        synchronize: true, // NOTE: disable in production and rely on migrations
      }),
    }),
    UserModule,
    AuthModule,
    RegistrationPeriodModule,
    WorkScheduleModule,
    LeaveRequestModule,
    SalaryModule,
    RegulationModule,
    NotificationModule,
    DashboardModule,
    FileModule,
    ChamCongModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
