import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UserService } from './src/user/user.service';

async function bootstrap() {
  // Create an application context (without starting the HTTP server)
  const appContext = await NestFactory.createApplicationContext(AppModule);

  // Get the UserService from the app context
  const userService = appContext.get(UserService);

  // Define the admin credentials
  const adminData = {
    username: 'admin',
    email: 'admin@example.com',
    password: 'yourStrongAdminPassword',
  };

  try {
    // Create the admin user
    const adminUser = await userService.create(
      adminData.username,
      adminData.email,
      adminData.password,
    );

    // Update the user's role to 'admin' using the new method
    await userService.updateRole(String(adminUser._id), 'admin');

    console.log('Admin user created successfully:', adminUser.username);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await appContext.close();
  }
}

bootstrap();
