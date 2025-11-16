import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Queue } from 'bullmq';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get the underlying Express instance
  const expressApp = app.getHttpAdapter().getInstance();

  // Get queues from the application (optional, don't crash if not registered)
  const queues: Queue[] =
    app.get<Queue[]>('BULL_QUEUES', { strict: false }) || [];

  if (queues.length > 0) {
    // Set up Bull Board
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: queues.map((queue) => new BullMQAdapter(queue)),
      serverAdapter,
    });

    // Mount Bull Board router
    expressApp.use('/admin/queues', serverAdapter.getRouter());

    console.log(`Bull Board mounted at /admin/queues`);
    console.log(`Monitoring ${queues.length} queue(s)`);
  } else {
    console.warn('No queues registered with Bull Board');
  }

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Umba Assignment API')
    .setDescription('API documentation for quotes and transactions')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
bootstrap();
