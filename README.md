# GIF Chat - Modern Real-time Chat Application

A modern, full-stack chat application built with React, Node.js, Socket.io, and PostgreSQL. Features real-time messaging with GIF support, user authentication, admin panel, and special invite system.

## 🚀 Features

- **Real-time Chat**: Instant messaging with Socket.io
- **GIF Integration**: Send GIFs from Tenor and GIPHY APIs
- **User Authentication**: JWT-based secure login/registration
- **Admin Panel**: User management and special invite creation
- **Special Invites**: Custom named invite groups
- **Email Notifications**: SMTP-powered warning emails
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **PostgreSQL Database**: Robust data storage with Neon

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Socket.io Client (real-time)
- React Router (navigation)

### Backend
- Node.js + Express
- Socket.io (WebSocket)
- PostgreSQL (database)
- JWT (authentication)
- bcrypt (password hashing)
- Nodemailer (email)

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kivi88/gif-chat.git
   cd gif-chat
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run setup  # Initialize database
   npm start
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email (SMTP)
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password

# APIs
TENOR_API_KEY=your-tenor-api-key
GIPHY_API_KEY=your-giphy-api-key
```

## 🚀 Deployment

### VPS Deployment (Recommended)

1. **Server Setup:**
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs

   # Install Nginx
   apt install -y nginx
   ```

2. **Clone and Setup:**
   ```bash
   git clone https://github.com/Kivi88/gif-chat.git
   cd gif-chat

   # Backend setup
   cd backend
   npm install
   # Configure .env
   npm run setup

   # Frontend build
   cd ../frontend
   npm install
   npm run build
   ```

3. **PM2 Process Management:**
   ```bash
   npm install -g pm2

   # Start backend
   cd backend
   pm2 start server.js --name "gifchat-backend"

   # Start frontend
   cd ../frontend
   pm2 serve dist 3000 --name "gifchat-frontend" --spa

   # Save PM2 configuration
   pm2 startup
   pm2 save
   ```

4. **Nginx Configuration:**
   ```bash
   nano /etc/nginx/sites-available/gifchat
   ```

   Add:
   ```
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /api {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

   ```bash
   ln -s /etc/nginx/sites-available/gifchat /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

5. **SSL Certificate (Let's Encrypt):**
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

### Cloud Platforms

- **Railway**: Backend deployment
- **Vercel**: Frontend deployment
- **Neon**: PostgreSQL hosting

## 📱 Usage

1. **Register/Login**: Create account or sign in
2. **Find Users**: Search for other users to chat
3. **Send Friend Requests**: Connect with other users
4. **Chat**: Send text messages and GIFs in real-time
5. **Admin Features**: Manage users and create special invites

## 🔐 Admin Features

- View all users and reports
- Create special invite links with custom names
- Send warning emails to users
- Review and manage reports

## 📄 API Documentation

### Authentication Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Chat Endpoints
- `GET /api/chats` - Get user's chats
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message

### Admin Endpoints
- `POST /api/admin/special-invites` - Create special invite
- `GET /api/admin/reports` - Get all reports
- `POST /api/admin/warnings/send` - Send warning email

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Kivi88** - [GitHub](https://github.com/Kivi88)

## 🙏 Acknowledgments

- Tenor API for GIFs
- GIPHY API for additional GIFs
- Socket.io for real-time communication
- Tailwind CSS for styling