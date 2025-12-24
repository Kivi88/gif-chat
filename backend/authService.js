import pool from './db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function register(username, email, password, inviteCode = null) {
  const passwordHash = await bcrypt.hash(password, 10)

  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash, invite_code) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_admin, invite_code',
    [username, email, passwordHash, inviteCode]
  )

  return result.rows[0]
}

export async function login(username, password) {
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  )
  
  if (result.rows.length === 0) {
    throw new Error('Kullanıcı bulunamadı')
  }
  
  const user = result.rows[0]
  
  if (user.is_banned) {
    throw new Error('Hesabınız yasaklanmış')
  }
  
  const valid = await bcrypt.compare(password, user.password_hash)
  
  if (!valid) {
    throw new Error('Şifre yanlış')
  }
  
  const token = jwt.sign(
    { userId: user.id, username: user.username, isAdmin: user.is_admin, inviteCode: user.invite_code },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  )

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      inviteCode: user.invite_code
    }
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function searchUsers(searchTerm, currentUserId) {
  const result = await pool.query(
    `SELECT id, username FROM users 
     WHERE username ILIKE $1 
     AND id != $2 
     AND is_banned = false
     LIMIT 20`,
    [`%${searchTerm}%`, currentUserId]
  )
  
  return result.rows
}

export async function sendFriendRequest(senderId, receiverId) {
  const result = await pool.query(
    'INSERT INTO friend_requests (sender_id, receiver_id) VALUES ($1, $2) RETURNING *',
    [senderId, receiverId]
  )
  
  return result.rows[0]
}

export async function getFriendRequests(userId) {
  const result = await pool.query(
    `SELECT fr.*, u.username as sender_username 
     FROM friend_requests fr
     JOIN users u ON fr.sender_id = u.id
     WHERE fr.receiver_id = $1 AND fr.status = 'pending'`,
    [userId]
  )
  
  return result.rows
}

export async function acceptFriendRequest(requestId, userId) {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    const reqResult = await client.query(
      'SELECT * FROM friend_requests WHERE id = $1 AND receiver_id = $2',
      [requestId, userId]
    )
    
    if (reqResult.rows.length === 0) {
      throw new Error('İstek bulunamadı')
    }
    
    const request = reqResult.rows[0]
    
    await client.query(
      'UPDATE friend_requests SET status = $1 WHERE id = $2',
      ['accepted', requestId]
    )
    
    const chatResult = await client.query(
      'INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING *',
      [Math.min(request.sender_id, request.receiver_id), Math.max(request.sender_id, request.receiver_id)]
    )
    
    await client.query('COMMIT')
    
    return chatResult.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function rejectFriendRequest(requestId, userId) {
  await pool.query(
    'UPDATE friend_requests SET status = $1 WHERE id = $2 AND receiver_id = $3',
    ['rejected', requestId, userId]
  )
}

export async function getChats(userId) {
  const result = await pool.query(
    `SELECT c.*, 
     CASE 
       WHEN c.user1_id = $1 THEN u2.username 
       ELSE u1.username 
     END as partner_username,
     CASE 
       WHEN c.user1_id = $1 THEN c.user2_id 
       ELSE c.user1_id 
     END as partner_id
     FROM chats c
     JOIN users u1 ON c.user1_id = u1.id
     JOIN users u2 ON c.user2_id = u2.id
     WHERE c.user1_id = $1 OR c.user2_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  )
  
  return result.rows
}

export async function getMessages(chatId, userId) {
  const chatResult = await pool.query(
    'SELECT * FROM chats WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
    [chatId, userId]
  )
  
  if (chatResult.rows.length === 0) {
    throw new Error('Sohbet bulunamadı veya erişim yok')
  }
  
  const result = await pool.query(
    `SELECT m.*, u.username as sender_username 
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.chat_id = $1
     ORDER BY m.created_at ASC`,
    [chatId]
  )
  
  return result.rows
}

export async function saveMessage(chatId, senderId, gifUrl) {
  const result = await pool.query(
    'INSERT INTO messages (chat_id, sender_id, gif_url) VALUES ($1, $2, $3) RETURNING *',
    [chatId, senderId, gifUrl]
  )
  
  return result.rows[0]
}

export async function blockUser(blockerId, blockedId) {
  await pool.query(
    'INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2)',
    [blockerId, blockedId]
  )
}

export async function reportUser(reporterId, reportedId, chatId, reason) {
  const result = await pool.query(
    'INSERT INTO reports (reporter_id, reported_id, chat_id, reason) VALUES ($1, $2, $3, $4) RETURNING *',
    [reporterId, reportedId, chatId, reason]
  )
  
  return result.rows[0]
}

export async function deleteChat(chatId, userId) {
  const result = await pool.query(
    'DELETE FROM chats WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
    [chatId, userId]
  )

  return result.rowCount > 0
}

export async function createSpecialInvite(createdBy, name = null) {
  const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  const result = await pool.query(
    'INSERT INTO special_invites (invite_code, name, created_by) VALUES ($1, $2, $3) RETURNING *',
    [inviteCode, name, createdBy]
  )

  return result.rows[0]
}

export async function getSpecialInvites(createdBy) {
  const result = await pool.query(
    'SELECT * FROM special_invites WHERE created_by = $1 ORDER BY created_at DESC',
    [createdBy]
  )

  return result.rows
}

export async function validateInviteCode(inviteCode) {
  const result = await pool.query(
    'SELECT * FROM special_invites WHERE invite_code = $1 AND used = false',
    [inviteCode]
  )

  return result.rows[0] || null
}

export async function markInviteUsed(inviteCode, userId) {
  await pool.query(
    'UPDATE special_invites SET used = true, used_by = $2 WHERE invite_code = $1',
    [inviteCode, userId]
  )
}

export async function getInviteUsers(inviteCode) {
  const result = await pool.query(
    'SELECT u.id, u.username FROM users u JOIN special_invites si ON u.invite_code = si.invite_code WHERE si.invite_code = $1 AND u.is_banned = false',
    [inviteCode]
  )

  return result.rows
}
