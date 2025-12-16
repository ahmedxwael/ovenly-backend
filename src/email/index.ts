import nodemailer from "nodemailer";
import { SMTP_PASS, SMTP_USER } from "@/config/env";
import { logError } from "@/shared/utils";
import { SendEmailOptions } from "./types";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER, // SMTP_USER (Simple Mail Transfer Protocol User) is the email address of the sender
    pass: SMTP_PASS, // SMTP_PASS (Simple Mail Transfer Protocol Password) is the App Password, not regular password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Send an email
 * @param from - The email address of the sender
 * @param to - The email address of the recipient
 * @param subject - The subject of the email
 * @param text - The text of the email
 */
export const sendEmail = async ({
  from = `"Finance Flow 👻" <${SMTP_USER}>`,
  to,
  subject,
  text,
}: SendEmailOptions) => {
  try {
    await transporter.sendMail({ from, to, subject, html: text });
  } catch (error) {
    logError(error);
    throw new Error("Failed to send email");
  }
};
