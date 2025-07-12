import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

// Initialize Twilio client if credentials are available
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

export class SMSService {
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendVerificationCode(phoneNumber: string, code: string): Promise<{success: boolean, error?: string}> {
    if (!client || !twilioPhoneNumber) {
      console.error('Twilio not configured - SMS verification disabled');
      return {success: false, error: 'SMS service not configured'};
    }

    try {
      const message = await client.messages.create({
        body: `رمز التحقق الخاص بك: ${code}\nهذا الرمز صالح لمدة 10 دقائق.`,
        from: twilioPhoneNumber,
        to: phoneNumber
      });

      console.log(`SMS sent to ${phoneNumber}: ${message.sid}`);
      return {success: true};
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      
      // Check for specific Twilio error codes
      if (error.code === 21608) {
        return {success: false, error: 'trial_account_restriction'};
      } else if (error.code === 21212) {
        return {success: false, error: 'invalid_phone_number'};
      }
      
      return {success: false, error: 'sms_failed'};
    }
  }

  static isValidPhoneNumber(phoneNumber: string): boolean {
    // Simple validation for Algerian phone numbers
    const algerianPhoneRegex = /^(\+213|0)[567]\d{8}$/;
    return algerianPhoneRegex.test(phoneNumber);
  }

  static formatPhoneNumber(phoneNumber: string): string {
    // Format Algerian phone numbers to international format
    if (phoneNumber.startsWith('0')) {
      return '+213' + phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith('+213')) {
      return '+213' + phoneNumber;
    }
    return phoneNumber;
  }
}