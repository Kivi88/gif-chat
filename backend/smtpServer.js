import { SMTPServer } from 'smtp-server'
import { simpleParser } from 'mailparser'

const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  
  onData(stream, session, callback) {
    simpleParser(stream, async (err, parsed) => {
      if (err) {
        console.log('E-posta parse hatası:', err)
        return callback()
      }

      console.log('\n📧 Yeni E-posta Alındı:')
      console.log('─────────────────────────────')
      console.log('Kimden:', parsed.from?.text || 'Bilinmiyor')
      console.log('Kime:', parsed.to?.text || 'Bilinmiyor')
      console.log('Konu:', parsed.subject || 'Konu yok')
      console.log('─────────────────────────────')
      console.log('Mesaj:')
      console.log(parsed.text || parsed.html || 'İçerik yok')
      console.log('─────────────────────────────\n')

      callback()
    })
  }
})

server.on('error', err => {
  console.log('SMTP Sunucu Hatası:', err)
})

const SMTP_PORT = 2525

server.listen(SMTP_PORT, () => {
  console.log(`📬 SMTP Sunucu ${SMTP_PORT} portunda çalışıyor`)
  console.log('E-postalar bu konsola yazdırılacak')
})
