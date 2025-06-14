const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'gennugennie@gmail.com',
        pass: process.env.EMAIL_PASS || 'cqjw yrme kbqu tbhm'
    }
});

// Utility function to generate OTP
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}             

// Utility function to send email
async function sendEmail(to, subject, text, html) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'gennugennie@gmail.com',
            to,
            subject,
            text,
            html
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
}

// Template for password reset OTP email
function createPasswordResetEmailTemplate(name, otp) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${name},</p>
            <p>Your OTP for password reset:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
                ${otp}
            </div>
            <p style="color: #666;">This OTP will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this password reset, please ignore this email.</p>
        </div>
    `;
    
    const text = `Hello ${name},\n\nYour OTP for password reset: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this password reset, please ignore this email.`;
    
    return { html, text };
}

// Template for welcome email
function createWelcomeEmailTemplate(name, email) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Our Platform!</h2>
            <p>Hello ${name},</p>
            <p>Thank you for signing up with us. Your account has been successfully created.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Account Details:</strong></p>
                <p>Email: ${email}</p>
                <p>Registration Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <p>You can now log in to your account and start using our services.</p>
            <p style="color: #666;">If you have any questions, feel free to contact our support team.</p>
        </div>
    `;
    
    const text = `Hello ${name},\n\nThank you for signing up with us. Your account has been successfully created.\n\nAccount Details:\nEmail: ${email}\nRegistration Date: ${new Date().toLocaleDateString()}\n\nYou can now log in to your account and start using our services.\n\nIf you have any questions, feel free to contact our support team.`;
    
    return { html, text };
}

// Template for account activation email
function createAccountActivationTemplate(name) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Account Activated!</h2>
            <p>Hello ${name},</p>
            <p>Great news! Your account has been successfully activated.</p>
            <p>You can now access all features of our platform.</p>
            <p style="color: #666;">Thank you for being part of our community!</p>
        </div>
    `;
    
    const text = `Hello ${name},\n\nGreat news! Your account has been successfully activated.\n\nYou can now access all features of our platform.\n\nThank you for being part of our community!`;
    
    return { html, text };
}

// Send password reset OTP
async function sendPasswordResetOTP(email, name, otp) {
    const { html, text } = createPasswordResetEmailTemplate(name, otp);
    return await sendEmail(email, "Password Reset OTP", text, html);
}

// Send welcome email
async function sendWelcomeEmail(email, name) {
    const { html, text } = createWelcomeEmailTemplate(name, email);
    return await sendEmail(email, "Welcome to Our Platform!", text, html);
}

// Send account activation email
async function sendAccountActivationEmail(email, name) {
    const { html, text } = createAccountActivationTemplate(name);
    return await sendEmail(email, "Account Activated", text, html);
}

// Verify email configuration
async function verifyEmailConfiguration() {
    try {
        await transporter.verify();
        console.log('Email server is ready to send emails');
        return true;
    } catch (error) {
        console.error('Email server configuration error:', error);
        return false;
    }
}

module.exports = {
    generateOTP,
    sendEmail,
    sendPasswordResetOTP,
    sendWelcomeEmail,
    sendAccountActivationEmail,
    createPasswordResetEmailTemplate,
    createWelcomeEmailTemplate,
    createAccountActivationTemplate,
    verifyEmailConfiguration
};