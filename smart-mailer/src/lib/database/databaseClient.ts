import pg from "pg";
import { Sequelize } from "sequelize";

class DatabaseClient {
  private static instance: Sequelize;

  private constructor() {} // Prevent direct instantiation

  public static getInstance(): Sequelize {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new Sequelize(process.env.DATABASE_URL || "", {
        dialect: "postgres",
        logging: false,
        dialectModule: pg,
        dialectOptions: {
          ssl: process.env.DATABASE_SSL || false,
        },
      });
    }
    return DatabaseClient.instance;
  }
}

export default DatabaseClient;
