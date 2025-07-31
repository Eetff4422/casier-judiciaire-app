import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_SID as string,
  process.env.TWILIO_TOKEN as string
);

export const sendSMS = async (to: string, message: string) => {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to,
  });
};
