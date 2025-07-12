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

  static async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    if (!client || !twilioPhoneNumber) {
      console.error('Twilio not configured - SMS verification disabled');
      return false;
    }

    try {
      const message = await client.messages.create({
        body: `رمز التحقق الخاص بك: ${code}\nهذا الرمز صالح لمدة 10 دقائق.`,
        from: twilioPhoneNumber,
        to: phoneNumber
      });

      console.log(`SMS sent to ${phoneNumber}: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
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