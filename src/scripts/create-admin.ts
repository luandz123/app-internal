import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../modules/user/user.service';
import { UserRole } from '../modules/user/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userService = app.get(UserService);

  // Check if admin already exists
  const existingAdmin = await userService.findByEmail('admin@company.com');
  if (existingAdmin) {
    console.log('Admin user already exists!');
    console.log('Email: admin@company.com');
    await app.close();
    return;
  }

  // Create admin user
  const admin = await userService.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@company.com',
    password: 'Admin@123456',
    role: UserRole.ADMIN,
    position: 'System Administrator',
    baseSalary: 30000000,
    annualLeaveDays: 15,
  });

  console.log('Admin user created successfully!');
  console.log('Email: admin@company.com');
  console.log('Password: Admin@123456');
  console.log('User ID:', admin.id);

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Error creating admin user:', err);
  process.exit(1);
});
