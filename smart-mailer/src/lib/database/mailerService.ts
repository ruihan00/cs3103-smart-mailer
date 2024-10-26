import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import DatabaseClient from "./databaseClient";

class MailerService {
  private static instance: MailerService;
  private MailerModel = DatabaseClient.getInstance().define(
    "Mailer",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      // Additional fields can be added here if needed, e.g., name, email, etc.
    },
    {
      tableName: "mailers",
      timestamps: false,
    }
  );

  private constructor() {} // Prevent direct instantiation

  public static getInstance(): MailerService {
    if (!MailerService.instance) {
      MailerService.instance = new MailerService();
    }
    return MailerService.instance;
  }

  public async createMailer(): Promise<string> {
    // Generate a new UUID and store it as a string
    const mailerId = uuidv4();
    const newMailer = await this.MailerModel.create({ id: mailerId });
    return newMailer.id;
  }
}

export default MailerService;
