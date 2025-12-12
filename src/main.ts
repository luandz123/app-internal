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
  const ungDung = await NestFactory.create(AppModule);

  // Cấu hình CORS và tiền tố API
  ungDung.enableCors();
  ungDung.setGlobalPrefix('api');

  // Cấu hình validation pipe toàn cục
  ungDung.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Cấu hình serializer để loại bỏ các trường nhạy cảm
  const boLocPhanChieu = ungDung.get(Reflector);
  ungDung.useGlobalInterceptors(new ClassSerializerInterceptor(boLocPhanChieu));

  // Cấu hình Swagger
  const dichVuCauHinh = ungDung.get(ConfigService);
  const cauHinhSwagger = new DocumentBuilder()
    .setTitle('Staff Management API - Hệ thống Quản lý Nhân sự')
    .setDescription('API nội bộ để quản lý nhân viên công ty')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const taiLieu = SwaggerModule.createDocument(ungDung, cauHinhSwagger);
  SwaggerModule.setup('docs', ungDung, taiLieu, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Khởi động server
  const cong = dichVuCauHinh.get<number>('PORT', 3000);
  await ungDung.listen(cong);
}

// Khởi chạy ứng dụng và xử lý lỗi
void khoiDongUngDung();
