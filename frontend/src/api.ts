const API_URL = '/api'

export async function register(username: string, email: string, password: string) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  return response.json()
}

export async function login(username: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  return response.json()
}

export async function searchUsers(query: string, token: string) {
  const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function sendFriendRequest(receiverId: number, token: string) {
  const response = await fetch(`${API_URL}/friend-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ receiverId })
  })
  return response.json()
}

export async function getFriendRequests(token: string) {
  const response = await fetch(`${API_URL}/friend-requests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function acceptFriendRequest(requestId: number, token: string) {
  const response = await fetch(`${API_URL}/friend-request/${requestId}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function rejectFriendRequest(requestId: number, token: string) {
  const response = await fetch(`${API_URL}/friend-request/${requestId}/reject`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function getChats(token: string) {
  const response = await fetch(`${API_URL}/chats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function getChatMessages(chatId: number, token: string) {
  const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function blockUser(chatId: number, partnerId: number, token: string) {
  const response = await fetch(`${API_URL}/chats/${chatId}/block`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ partnerId })
  })
  return response.json()
}

export async function reportUser(chatId: number, partnerId: number, reason: string, token: string) {
  const response = await fetch(`${API_URL}/chats/${chatId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ partnerId, reason })
  })
  return response.json()
}

export async function deleteChat(chatId: number, token: string) {
  const response = await fetch(`${API_URL}/chats/${chatId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function getAdminReports(token: string) {
  const response = await fetch(`${API_URL}/admin/reports`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function reviewReport(reportId: number, status: string, token: string) {
  const response = await fetch(`${API_URL}/admin/reports/${reportId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  })
  return response.json()
}

export async function sendWarning(userId: number, reason: string, customDetails: string, reportId: number, reporterId: number, token: string) {
  const response = await fetch(`${API_URL}/admin/warnings/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId, reason, customDetails, reportId, reporterId })
  })
  return response.json()
}

export async function createSpecialInvite(token: string, name?: string) {
  const response = await fetch(`${API_URL}/admin/special-invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  })
  return response.json()
}

export async function getSpecialInvites(token: string) {
  const response = await fetch(`${API_URL}/admin/special-invites`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function validateInviteCode(inviteCode: string) {
  const response = await fetch(`${API_URL.replace('/api', '')}/ozeldavet/${inviteCode}`)
  return response.json()
}

export async function registerSpecial(username: string, email: string, password: string, inviteCode: string) {
  const response = await fetch(`${API_URL}/register/special`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, inviteCode })
  })
  return response.json()
}

export async function getInviteUsers(inviteCode: string, token: string) {
  const response = await fetch(`${API_URL}/special-invites/${inviteCode}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function testAPI() {
  const response = await fetch(`${API_URL}/test`)
  return response.json()
}
