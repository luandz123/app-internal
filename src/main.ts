import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Hàm khởi động ứng dụng
 * Cấu hình và khởi chạy server NestJS
 */
async function khoiDongUngDung() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình CORS và tiền tố API
  app.enableCors();
  app.setGlobalPrefix('api');

  // Cấu hình validation pipe toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Cấu hình serializer để loại bỏ các trường nhạy cảm
  const boLocPhanChieu = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(boLocPhanChieu));

  // Cấu hình Swagger
  const dichVuCauHinh = app.get(ConfigService);
  const cauHinhSwagger = new DocumentBuilder()
    .setTitle('Staff Management API - Hệ thống Quản lý Nhân sự')
    .setDescription('API nội bộ để quản lý nhân viên công ty')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const taiLieu = SwaggerModule.createDocument(app, cauHinhSwagger);
  SwaggerModule.setup('docs', app, taiLieu, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Khởi động server
  const cong = dichVuCauHinh.get<number>('PORT', 3000);
  await app.listen(cong);
}

// Khởi chạy ứng dụng và xử lý lỗi
void khoiDongUngDung();
