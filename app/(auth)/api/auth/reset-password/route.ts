import crypto from "crypto";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { NextResponse } from "next/server";

import { getUserByToken, updateForgotPassword } from "@/db/queries";



export async function POST(req: Request) {

    const { token, password } = await req.json();

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await getUserByToken(hashedToken);

    console.log(`Inside reset password`);
    

    if (!user) {
        return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    console.log('Here is the user')
    console.log(user)

    const salt = genSaltSync(10);
    const hashedPassword = hashSync(password, salt);

    const response = updateForgotPassword(hashedToken, hashedPassword);

    if (!response) {
        return NextResponse.json({ message: 'Failed to reset password' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });


    // const hashedPassword = await bcrypt.hash(password, 10);

    
    
}