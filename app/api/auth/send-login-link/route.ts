import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { User, getUserByEmail, saveUserLoginCode } from '@/app/lib/database/userDatabase';

export const POST = async (req: NextRequest) => {
    const { mode, email, proposalId } = await req.json();

    if (!email || (mode == 'login' && !proposalId)) {
        return NextResponse.json({ message: 'Email and proposal ID are required' }, { status: 400 });
    }

    const code = uuidv4();

    const user = await getUserByEmail(email) as User;
    if (!user || !user.id) {    
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // save the login code in the db
    await saveUserLoginCode(user.id, code, proposalId);

    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '',
        text: '',
        html: '',
    };
    if (mode == 'login') {
        const loginLink = `https://${process.env.DOMAIN}/verify/${code}`;

        // Send mail with defined transport object
        mailOptions = {...mailOptions,
            subject: 'Your Login Link',
            text: `Click the following link to login: ${loginLink}`,
            html: `<p>Click the following link to login: <a href="${loginLink}">${loginLink}</a></p>`,
        };
    } else if (mode == 'registration') {
        const registrationLink = `https://${process.env.DOMAIN}/register/${code}`;

        // Send mail with defined transport object
        mailOptions = {...mailOptions,
            subject: 'Your Registration Link',
            text: `Click the following link to verify your email: ${registrationLink}`,
            html: `<p>Click the following link to verify your email: <a href="${registrationLink}">${registrationLink}</a></p>`,
        };
    }

    try {
        await transporter.sendMail(mailOptions);
        return NextResponse.json({ message: 'Login link sent successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Error sending email', error }, { status: 500 });
    }
}