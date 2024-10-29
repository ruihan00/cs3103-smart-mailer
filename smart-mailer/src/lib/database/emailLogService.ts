// /lib/database/emailLogService.ts

import { DataTypes, Sequelize, QueryTypes } from "sequelize";
import DatabaseClient from "./databaseClient";

class EmailLogService {
    private static instance: EmailLogService;
    private EmailLogModel = DatabaseClient.getInstance().define(
        "EmailLog",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            mailer_id: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            recipient_email: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            recipient_name: {
                type: DataTypes.STRING,
            },
            recipient_department: {
                type: DataTypes.STRING,
            },
            success: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            log_message: {
                type: DataTypes.STRING,
            },
            sent_at: {
                type: DataTypes.DATE,
                defaultValue: DatabaseClient.getInstance().literal("CURRENT_TIMESTAMP"),
            },
        },
        {
            tableName: "email_logs",
            timestamps: false,
        }
    );

    private constructor() {} // Prevent direct instantiation

    public static getInstance(): EmailLogService {
        if (!EmailLogService.instance) {
            EmailLogService.instance = new EmailLogService();
        }
        return EmailLogService.instance;
    }

    public async logEmailSent(data: {
        mailerId: string;
        recipientEmail: string;
        recipientName: string;
        recipientDepartment: string;
        success: boolean,
        log_message: string
    }) {
        try {
            await this.EmailLogModel.create({
                mailer_id: data.mailerId,
                recipient_email: data.recipientEmail,
                recipient_name: data.recipientName,
                recipient_department: data.recipientDepartment,
                success: data.success,
                log_message: data.log_message
            });
        } catch (error) {
            console.error('Error logging email sent:', error);
            throw error;
        }
    }

    /**
     * Get email counts by department for a given mailerId.
     * @param mailerId The mailer ID to filter emails.
     * @returns An object where keys are departments and values are counts.
     */
    public async getEmailCountByDepartment(mailerId: string): Promise<{ [department: string]: number }> {
        try {
            const results = await this.EmailLogModel.findAll({
                attributes: [
                    'recipient_department',
                    [Sequelize.fn('COUNT', Sequelize.col('recipient_department')), 'count'],
                ],
                where: { mailer_id: mailerId },
                group: ['recipient_department'],
            });

            // Convert results to a simple object
            const countsByDepartment: { [department: string]: number } = {};
            results.forEach((result: any) => {
                const department = result.getDataValue('recipient_department');
                const count = parseInt(result.getDataValue('count'), 10);
                countsByDepartment[department] = count;
            });

            return countsByDepartment;
        } catch (error) {
            console.error('Error fetching email counts by department:', error);
            throw error;
        }
    }

    public async getSuccessfulEmailCountByDepartment(mailerId: string): Promise<{ [department: string]: number }> {
        try {
            const results = await this.EmailLogModel.findAll({
                attributes: [
                    'recipient_department',
                    [Sequelize.fn('COUNT', Sequelize.col('recipient_department')), 'count'],
                ],
                where: { mailer_id: mailerId, success: true },
                group: ['recipient_department'],
            });

            // Convert results to a simple object
            const countsByDepartment: { [department: string]: number } = {};
            results.forEach((result: any) => {
                const department = result.getDataValue('recipient_department');
                const count = parseInt(result.getDataValue('count'), 10);
                countsByDepartment[department] = count;
            });

            return countsByDepartment;
        } catch (error) {
            console.error('Error fetching email counts by department:', error);
            throw error;
        }
    }
}

export default EmailLogService;
