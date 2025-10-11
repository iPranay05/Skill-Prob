# Skill Probe LMS API Documentation

## Overview

The Skill Probe LMS API provides comprehensive endpoints for managing users, courses, live sessions, payments, and the campus ambassador system. All endpoints use JSON for request and response bodies unless otherwise specified.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Management

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- Use the refresh endpoint to get new access tokens

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "student",
  "referralCode": "AMB123" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "emailVerified": false,
      "phoneVerified": false
    },
    "message": "Registration successful. Please verify your email and phone."
  }
}
```

### Login

**POST** `/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### Verify OTP

**POST** `/auth/verify-otp`

Verify email or phone OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "type": "email" // or "phone"
}
```

### Refresh Token

**POST** `/auth/refresh`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

## Course Management

### Get Courses

**GET** `/courses`

Retrieve list of courses with filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category
- `type`: Filter by course type (live, recorded, hybrid)
- `search`: Search in title and description
- `mentorId`: Filter by mentor

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course_id",
        "title": "JavaScript Fundamentals",
        "description": "Learn JavaScript from basics",
        "mentor": {
          "id": "mentor_id",
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "category": "Programming",
        "type": "live",
        "pricing": {
          "amount": 2999,
          "currency": "INR"
        },
        "enrollment": {
          "maxStudents": 50,
          "currentEnrollment": 25
        },
        "ratings": {
          "average": 4.5,
          "count": 120
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Create Course

**POST** `/courses`

Create a new course (Mentor only).

**Request Body:**
```json
{
  "title": "JavaScript Fundamentals",
  "description": "Learn JavaScript from basics to advanced",
  "category": "Programming",
  "type": "live",
  "pricing": {
    "amount": 2999,
    "currency": "INR",
    "subscriptionType": "one-time"
  },
  "content": {
    "syllabus": ["Variables", "Functions", "Objects"],
    "prerequisites": ["Basic computer knowledge"],
    "learningOutcomes": ["Build web applications"]
  },
  "enrollment": {
    "maxStudents": 50
  }
}
```

### Enroll in Course

**POST** `/courses/{courseId}/enroll`

Enroll student in a course.

**Request Body:**
```json
{
  "paymentMethod": "razorpay",
  "couponCode": "SAVE20" // Optional
}
```

## Live Sessions

### Create Live Session

**POST** `/live-sessions`

Create a new live session (Mentor only).

**Request Body:**
```json
{
  "courseId": "course_id",
  "title": "Introduction to Variables",
  "description": "Learn about JavaScript variables",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "duration": 60,
  "maxAttendees": 50
}
```

### Join Live Session

**POST** `/live-sessions/{sessionId}/join`

Join a live session (Enrolled students only).

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingUrl": "https://meet.google.com/abc-defg-hij",
    "sessionDetails": {
      "title": "Introduction to Variables",
      "scheduledAt": "2024-01-15T10:00:00Z",
      "duration": 60
    }
  }
}
```

## Ambassador System

### Apply for Ambassador

**POST** `/ambassadors/apply`

Apply to become a campus ambassador.

**Request Body:**
```json
{
  "motivation": "I want to help students learn",
  "socialMedia": {
    "platform": "instagram",
    "handle": "@johndoe",
    "followers": 1500
  },
  "experience": "2 years in tech community"
}
```

### Get Ambassador Dashboard

**GET** `/ambassadors/dashboard`

Get ambassador dashboard data (Ambassador only).

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalReferrals": 25,
      "successfulConversions": 18,
      "totalEarnings": 15000,
      "currentPoints": 5000
    },
    "referralCode": "AMB123",
    "recentReferrals": [
      {
        "studentName": "John Doe",
        "registrationDate": "2024-01-10T00:00:00Z",
        "status": "converted",
        "pointsEarned": 500
      }
    ]
  }
}
```

### Request Payout

**POST** `/ambassadors/payout`

Request payout of earned points (Ambassador only).

**Request Body:**
```json
{
  "amount": 5000,
  "paymentDetails": {
    "bankAccount": "1234567890",
    "ifscCode": "HDFC0001234",
    "panNumber": "ABCDE1234F"
  }
}
```

## Payment System

### Process Payment

**POST** `/payments/process`

Process course enrollment payment.

**Request Body:**
```json
{
  "courseId": "course_id",
  "paymentMethod": "razorpay",
  "paymentDetails": {
    "razorpay_payment_id": "pay_abc123",
    "razorpay_order_id": "order_def456",
    "razorpay_signature": "signature_ghi789"
  },
  "couponCode": "SAVE20" // Optional
}
```

### Get Wallet Balance

**GET** `/wallet/balance`

Get user's wallet balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": {
      "points": 5000,
      "credits": 1500,
      "currency": "INR"
    },
    "transactions": [
      {
        "type": "credit",
        "amount": 500,
        "description": "Referral bonus",
        "date": "2024-01-10T00:00:00Z"
      }
    ]
  }
}
```

## Job Management

### Get Jobs

**GET** `/jobs`

Get available internship/job opportunities.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `location`: Filter by location
- `type`: Filter by job type
- `stipend_min`: Minimum stipend
- `stipend_max`: Maximum stipend

### Apply for Job

**POST** `/jobs/{jobId}/apply`

Apply for an internship/job.

**Request Body:**
```json
{
  "coverLetter": "I am interested in this position...",
  "resumeUrl": "https://example.com/resume.pdf",
  "expectedStipend": 15000
}
```

## Admin Endpoints

### Get All Users

**GET** `/admin/users`

Get list of all users (Admin only).

### Approve Ambassador

**PUT** `/admin/ambassadors/{ambassadorId}/approve`

Approve or reject ambassador application (Admin only).

**Request Body:**
```json
{
  "status": "approved", // or "rejected"
  "notes": "Application looks good"
}
```

### Process Payout

**PUT** `/admin/payouts/{payoutId}/process`

Process ambassador payout request (Admin only).

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Invalid email or password |
| `USER_NOT_FOUND` | User does not exist |
| `EMAIL_NOT_VERIFIED` | Email verification required |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `COURSE_NOT_FOUND` | Course does not exist |
| `ENROLLMENT_FULL` | Course enrollment is full |
| `PAYMENT_FAILED` | Payment processing failed |
| `INVALID_OTP` | OTP is invalid or expired |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `VALIDATION_ERROR` | Request validation failed |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per 15 minutes
- File upload endpoints: 10 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Payment Webhooks

The system supports webhooks from payment providers:

**POST** `/webhooks/razorpay`
**POST** `/webhooks/stripe`

Webhook events are verified using the provider's signature verification.

## SDKs and Libraries

### JavaScript/TypeScript

```javascript
// Example API client usage
const api = new SkillProbeAPI({
  baseURL: 'https://api.skillprobe.com',
  accessToken: 'your_access_token'
});

// Get courses
const courses = await api.courses.list({
  category: 'Programming',
  page: 1,
  limit: 10
});

// Enroll in course
const enrollment = await api.courses.enroll('course_id', {
  paymentMethod: 'razorpay'
});
```

## Testing

Use the following test credentials for development:

**Student Account:**
- Email: `student@test.com`
- Password: `password123`

**Mentor Account:**
- Email: `mentor@test.com`
- Password: `password123`

**Ambassador Account:**
- Email: `ambassador@test.com`
- Password: `password123`

## Support

For API support and questions:
- Email: api-support@skillprobe.com
- Documentation: https://docs.skillprobe.com
- Status Page: https://status.skillprobe.com