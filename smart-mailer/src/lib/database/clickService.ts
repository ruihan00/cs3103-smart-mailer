import { DataTypes, QueryTypes, Transaction } from "sequelize";
import DatabaseClient from "./databaseClient";

class ClickService {
  private static instance: ClickService;
  private ClickModel = DatabaseClient.getInstance().define(
    "Click",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      clicked_at: {
        type: DataTypes.DATE,
        defaultValue: DatabaseClient.getInstance().literal("CURRENT_TIMESTAMP"),
      },
      mailer_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "clicks",
      timestamps: false,
    }
  );

  private constructor() {} // Prevent direct instantiation

  public static getInstance(): ClickService {
    if (!ClickService.instance) {
      ClickService.instance = new ClickService();
    }
    return ClickService.instance;
  }

  public async addClick(clickData: { mailerId: string }) {
    const sequelize = DatabaseClient.getInstance();
    const now = new Date();
    const month = `${now.getFullYear()}_${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    const partitionName = `clicks_${month}`;

    // Start a transaction for safe partition check and creation
    const transaction: Transaction = await sequelize.transaction();
    try {
      // Check if the partition for the current month exists
      const partitionExists = await sequelize.query<{ exists: boolean }>(
        `SELECT to_regclass('${partitionName}') IS NOT NULL AS exists`,
        { type: QueryTypes.SELECT, transaction }
      );

      // Create the partition if it does not exist
      if (!partitionExists[0]?.exists) {
        await sequelize.query(
          `
                    CREATE TABLE ${partitionName} PARTITION OF clicks
                    FOR VALUES FROM ('${now.getFullYear()}-${(
            now.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}-01') 
                                  TO ('${now.getFullYear()}-${(
            now.getMonth() + 2
          )
            .toString()
            .padStart(2, "0")}-01');
                `,
          { transaction }
        );
      }

      // Insert the click record
      await this.ClickModel.create(
        { clicked_at: new Date(), mailer_id: clickData.mailerId },
        { transaction }
      );

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      // Roll back the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  }

  public async getClicks(mailerId: string) {
    return this.ClickModel.count({ where: { mailer_id: mailerId } });
  }
}

export default ClickService;
