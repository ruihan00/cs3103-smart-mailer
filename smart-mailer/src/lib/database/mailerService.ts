import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import DatabaseClient from "./databaseClient";
import { create } from "domain";
type Mailer = {
  id: string;
  created_at: Date;
};
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
      created_at: {
        type: DataTypes.DATE,
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
    const mailer = newMailer.get();
    return mailer.id;
  }

  public async getAllMailers(): Promise<Mailer[]> {
    const mailers = await this.MailerModel.findAll();
    return mailers.map((mailer) => mailer.get());
  }

  public async getMailerById(id: string): Promise<Mailer | null> {
    const mailer = await this.MailerModel.findByPk(id);
    return mailer ? mailer.get() : null;
  }
}

export default MailerService;
