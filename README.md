# Skill Probe Learning Management System

A comprehensive edtech platform built with Next.js, TypeScript, and MongoDB that facilitates skill training and certification through an integrated ecosystem.

## Features

- **Multi-role Authentication System**: Students, Mentors, Campus Ambassadors, Employers, and Admins
- **JWT Authentication**: Secure authentication with access and refresh tokens
- **Email/SMS Verification**: OTP-based verification system
- **Role-based Access Control**: Granular permissions system
- **Password Recovery**: Secure password reset functionality
- **User Profile Management**: Comprehensive profile and preference management

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes with Node.js
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Cache**: Redis for session management
- **Authentication**: JWT with refresh token mechanism
- **Email**: Nodemailer for email notifications
- **SMS**: Twilio for SMS notifications

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account and project
- Redis (local or cloud)
- SMTP email service (Gmail, SendGrid, etc.)
- Twilio account for SMS (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd skill-probe-lms
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Redis for session management
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate secure random strings)
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

5. Set up your Supabase database:
   - Create a new Supabase project at https://supabase.com
   - Get your project URL and keys from the project settings
   - Update your `.env.local` with the Supabase credentials
   - Run the database setup: `npm run db:setup`
   - Or manually run the SQL from `supabase/schema.sql` in your Supabase SQL editor

6. Test your database connection:
```bash
npm run db:test
```

7. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify-otp` - Verify email/phone OTP
- `PUT /api/auth/verify-otp` - Resend OTP
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/[userId]/role` - Update user role (Admin only)

### System
- `GET /api/health` - Health check endpoint

## Project Structure

```
src/
├── app/
│   └── api/                 # API routes
├── lib/                     # Utility libraries
│   ├── auth.ts             # Authentication service
│   ├── database.ts         # Database connections
│   ├── errors.ts           # Error handling
│   └── notifications.ts    # Email/SMS services
├── middleware/             # Custom middleware
│   └── auth.ts            # Authentication middleware
├── models/                # Supabase data access layer
│   ├── User.ts
│   ├── OTPVerification.ts
│   └── PasswordReset.ts
├── supabase/              # Database schema and migrations
│   └── schema.sql
└── types/                 # TypeScript type definitions
    └── user.ts
```

## User Roles

- **Student**: Can register, enroll in courses, attend sessions
- **Mentor**: Can create and manage courses, conduct sessions
- **Ambassador**: Can refer students and earn rewards
- **Employer**: Can post jobs and manage applications
- **Admin**: Can manage users and moderate content
- **Super Admin**: Full system access and configuration

## Security Features

- Password hashing with bcrypt
- JWT tokens with expiration
- Refresh token rotation
- Rate limiting protection
- Input validation and sanitization
- CORS configuration
- Secure password reset flow
- Email/phone verification

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.