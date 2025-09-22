import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export enum MailType {
  VERIFICATION_CODE = 'verification_code',
  RECOVERY_CODE = 'recovery_code',
  NEW_PASSWORD = 'new_password',
  REGISTRATION_CODE = 'registration_code',
}
