import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
  host: 'smtp.maileroo.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
})

export async function sendWarningEmail(userEmail, username, warningMessage) {
  try {
    const mailOptions = {
      from: 'GIF Chat Admin <admin@gifchat.local>',
      to: userEmail,
      subject: '⚠️ GIF Chat - Platform İhtarı',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; margin-top: 0;">⚠️ Platform İhtarı</h2>
            <p style="color: #374151; line-height: 1.6;">Sayın <strong>${username}</strong>,</p>
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <pre style="font-family: Arial, sans-serif; white-space: pre-wrap; color: #1f2937; margin: 0;">${warningMessage}</pre>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Bu bir otomatik mesajdır. Lütfen yanıt vermeyiniz.<br>
              <strong>GIF Chat Moderasyon Ekibi</strong>
            </p>
          </div>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('E-posta gönderme hatası:', error)
    return { success: false, error: error.message }
  }
}

export async function sendThankYouEmail(userEmail, username, reportedUsername) {
  try {
    const mailOptions = {
      from: 'GIF Chat Admin <admin@gifchat.local>',
      to: userEmail,
      subject: '✅ GIF Chat - Bildiriminiz İncelendi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #059669; margin-top: 0;">✅ Bildiriminiz İşleme Alındı</h2>
            <p style="color: #374151; line-height: 1.6;">Sayın <strong>${username}</strong>,</p>
            <p style="color: #374151; line-height: 1.6;">
              <strong>${reportedUsername}</strong> kullanıcısı hakkında yaptığınız bildirimi inceledik ve gerekli işlemleri uyguladık.
            </p>
            <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #065f46; margin: 0; font-weight: 500;">
                Platformumuzu daha güvenli bir yer haline getirmemize yardımcı olduğunuz için teşekkür ederiz! 🙏
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Topluluk kurallarımızı korumak için gösterdiğiniz duyarlılık çok değerli.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Bu bir otomatik mesajdır. Lütfen yanıt vermeyiniz.<br>
              <strong>GIF Chat Moderasyon Ekibi</strong>
            </p>
          </div>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('E-posta gönderme hatası:', error)
    return { success: false, error: error.message }
  }
}
