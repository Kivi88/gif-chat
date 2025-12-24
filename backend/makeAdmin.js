import pool from './db.js'

const username = process.argv[2]

if (!username) {
  console.log('Kullanım: node makeAdmin.js <kullaniciadi>')
  process.exit(1)
}

async function makeAdmin() {
  try {
    const result = await pool.query(
      'UPDATE users SET is_admin = true WHERE username = $1 RETURNING *',
      [username]
    )
    
    if (result.rowCount === 0) {
      console.log(`❌ '${username}' kullanıcısı bulunamadı`)
    } else {
      console.log(`✅ '${username}' artık admin!`)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

makeAdmin()
