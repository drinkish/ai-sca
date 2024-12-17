import crypto from "crypto";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { getUser, updateForgotPasswordToken } from "@/db/queries";
import { sendMail } from "@/lib/send-mail";

export async function POST(req: Request) {
    console.log("Password reset request received");
    
    const { email } = await req.json();
    console.log("The email", email);
    
    const user = await getUser(email);

    if (user.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1); //1 hour expiry

    await updateForgotPasswordToken(email, resetTokenHash, expiration);

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
        email: process.env.SMTP_EMAIL as string,
        sendTo: email,
        subject: 'Password Reset',
        text: `Reset your password using the link: ${resetUrl}`,
        html: `<p>Reset your password using the link below:</p><a href="${resetUrl}">${resetUrl}</a>`,
      };
    
      try {
        await sendMail( mailOptions);   
    
        console.log("Password reset link sent to", email);
    
        return NextResponse.json({ message: "Password reset link sent to your email." });
        
    
      } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
      }
}