import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { MailType } from 'src/core/consts';

@Injectable()
export class MailService {
  private readonly codeTTL: number = Number(process.env.CODE_TTL_IN_MINUTES);

  constructor(private readonly configService: ConfigService) {}

  private async createTransporter(): Promise<Transporter> {
    return createTransport({
      host: this.configService.get<string>('EMAIL_SMTP_HOST'),
      port: this.configService.get<number>('EMAIL_SMTP_PORT'),
      secure: this.configService.get<number>('EMAIL_SMTP_PORT') === 465,
      auth: {
        user: this.configService.get<string>('EMAIL_SMTP_USER'),
        pass: this.configService.get<string>('EMAIL_SMTP_PASSWORD'),
      },
    });
  }

  async sendMail(
    email: string,
    mailType: MailType,
    data: { code?: number; password?: string },
  ): Promise<void> {
    const transporter = await this.createTransporter();
    const { subject, html } = this.getMailContent(mailType, data);

    await transporter.sendMail({
      from: this.configService.get<string>('EMAIL_SMTP_USER'),
      to: email,
      subject,
      html,
    });
  }

  private getMailContent(
    mailType: MailType,
    data: { code?: number; password?: string },
  ): { subject: string; html: string } {
    switch (mailType) {
      case MailType.VERIFICATION_CODE:
      case MailType.REGISTRATION_CODE:
        return {
          subject: 'Код верификации',
          html: `<p>Для верификации своей учётной записи в личном кабинете используйте код <b>${data.code}</b>.
            <br>Код действителен в течение ${this.codeTTL} минут.</p>
            <p>Если вы не запрашивали код, то просто проигнорируйте это сообщение.</p>`,
        };

      case MailType.RECOVERY_CODE:
        return {
          subject: 'Код восстановления пароля',
          html: `<p>Для восстановления пароля используйте код <b>${data.code}</b>.
            <br>Код действителен в течение ${this.codeTTL} минут.</p>
            <p>Если вы не запрашивали восстановление доступа, то просто проигнорируйте это сообщение.</p>`,
        };

      case MailType.NEW_PASSWORD:
        return {
          subject: 'Новый пароль',
          html: `<p>Ваш новый пароль: <b>${data.password}</b></p>`,
        };

      default:
        throw new Error('Неизвестный тип письма');
    }
  }
}
