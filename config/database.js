module.exports = ({ env }) => {
  if (env('NODE_ENV') === 'development') {
    return {
      defaultConnection: 'default',
      connections: {
        default: {
          connector: 'bookshelf',
          settings: {
            client: 'sqlite',
            filename: env('DATABASE_FILENAME', '.tmp/data.db'),
          },
          options: {
            useNullAsDefault: true,
          },
        },
      }
    }

  } else {
    return {
      defaultConnection: 'default',
      connections: {
        default: {
          connector: 'mongoose',
          settings: {
            client: 'mongo',
            uri: `mongodb+srv://${env('DB_USER')}:${env('DB_PASSWORD')}@cluster0.xrbrr.mongodb.net/${env('DB_NAME')}?retryWrites=true&w=majority`
          },
          options: {
            ssl: true,
          },
        },
      },
    }

  }
}
