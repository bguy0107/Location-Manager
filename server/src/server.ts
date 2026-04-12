import { config } from './config';
import app from './app';
import { connectDatabase, disconnectDatabase } from './utils/prisma';
import { logger } from './utils/logger';

async function main() {
  await connectDatabase();

  const server = app.listen(config.PORT, () => {
    logger.info(`Server running on http://localhost:${config.PORT} [${config.NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
