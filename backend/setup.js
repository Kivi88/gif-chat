import pool from './db.js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function setupDatabase() {
  try {
    console.log('Veritabanı tabloları oluşturuluyor...')
    
    const sql = fs.readFileSync(join(__dirname, 'database.sql'), 'utf8')
    
    await pool.query(sql)
    
    console.log('✅ Veritabanı tabloları başarıyla oluşturuldu!')
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    
    console.log('\nOluşturulan tablolar:')
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

setupDatabase()
