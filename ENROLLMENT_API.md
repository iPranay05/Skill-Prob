# Course Enrollment and Subscription System API

This document describes the API endpoints for the course enrollment and subscription management system.

## Overview

The enrollment system provides:
- Course enrollment with capacity controls
- Subscription management with different pricing models
- Coupon and discount code system
- Enrollment tracking and student management
- Payment processing integration

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Enrollments

#### Create Enrollment
```http
POST /api/enrollments
```

**Request Body:**
```json
{
  "course_id": "uuid",
  "amount_paid": 1000,
  "currency": "INR",
  "payment_method": "card",
  "transaction_id": "txn_123",
  "subscription_id": "uuid", // Optional
  "enrollment_source": "direct", // "direct", "referral", "coupon"
  "referral_code": "REF123", // Optional
  "coupon_code": "SAVE20", // Optional
  "access_expires_at": "2024-12-31T23:59:59Z" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "course_id": "uuid",
    "student_id": "uuid",
    "enrollment_date": "2024-01-15T10:30:00Z",
    "status": "active",
    "amount_paid": 1000,
    "currency": "INR",
    "payment_method": "card",
    "transaction_id": "txn_123",
    "progress": {
      "completedSessions": [],
      "totalSessions": 0,
      "completionPercentage": 0,
      "timeSpent": 0
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Get User Enrollments
```http
GET /api/enrollments?status=active&page=1&limit=10
```

**Query Parameters:**
- `status`: Filter by enrollment status (`active`, `completed`, `cancelled`, `expired`)
- `course_id`: Filter by specific course
- `enrollment_source`: Filter by enrollment source
- `date_from`: Filter enrollments from date (ISO 8601)
- `date_to`: Filter enrollments to date (ISO 8601)
- `sortBy`: Sort field (`enrollment_date`, `amount_paid`, `progress`)
- `sortOrder`: Sort order (`asc`, `desc`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "enrollments": [...],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### Get Enrollment by ID
```http
GET /api/enrollments/{enrollmentId}
```

#### Update Enrollment Status
```http
PATCH /api/enrollments/{enrollmentId}
```

**Request Body:**
```json
{
  "status": "completed"
}
```

#### Update Enrollment Progress
```http
PATCH /api/enrollments/{enrollmentId}
```

**Request Body:**
```json
{
  "progress": {
    "completedSessions": ["session-1", "session-2"],
    "totalSessions": 10,
    "completionPercentage": 20,
    "timeSpent": 120,
    "lastSessionCompleted": "session-2"
  }
}
```

### Course Enrollments (For Mentors/Admins)

#### Get Course Enrollments
```http
GET /api/courses/{courseId}/enrollments
```

**Query Parameters:** Same as user enrollments

### Course Capacity

#### Get Course Capacity
```http
GET /api/courses/{courseId}/capacity
```

**Response:**
```json
{
  "success": true,
  "data": {
    "course_id": "uuid",
    "max_students": 50,
    "current_enrollment": 30,
    "waitlist_count": 5,
    "available_spots": 20,
    "is_full": false
  }
}
```

### Coupons

#### Create Coupon
```http
POST /api/coupons
```

**Request Body:**
```json
{
  "code": "SAVE20",
  "description": "20% off on all courses",
  "discount_type": "percentage", // "percentage" or "fixed"
  "discount_value": 20,
  "min_amount": 500,
  "max_discount": 1000, // Optional, for percentage coupons
  "usage_limit": 100, // Optional
  "valid_from": "2024-01-01T00:00:00Z",
  "valid_until": "2024-12-31T23:59:59Z", // Optional
  "is_active": true
}
```

#### Get Coupons
```http
GET /api/coupons?search=SAVE&is_active=true&page=1&limit=10
```

**Query Parameters:**
- `search`: Search in code and description
- `is_active`: Filter by active status
- `discount_type`: Filter by discount type
- `valid_only`: Only return currently valid coupons
- `sortBy`: Sort field (`created_at`, `valid_until`, `used_count`, `discount_value`)
- `sortOrder`: Sort order (`asc`, `desc`)
- `page`: Page number
- `limit`: Items per page

#### Validate Coupon
```http
POST /api/coupons/validate
```

**Request Body:**
```json
{
  "code": "SAVE20",
  "course_id": "uuid", // Optional
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "coupon": {
      "id": "uuid",
      "code": "SAVE20",
      "discount_type": "percentage",
      "discount_value": 20
    },
    "discountAmount": 200,
    "finalAmount": 800
  }
}
```

#### Update Coupon
```http
PATCH /api/coupons/{couponId}
```

#### Delete Coupon
```http
DELETE /api/coupons/{couponId}
```

### Subscriptions

#### Create Subscription
```http
POST /api/subscriptions
```

**Request Body:**
```json
{
  "course_id": "uuid",
  "subscription_type": "monthly",
  "amount": 999,
  "currency": "INR",
  "billing_cycle": "monthly", // "monthly" or "yearly"
  "gateway_subscription_id": "sub_123",
  "gateway_customer_id": "cust_456",
  "auto_renew": true,
  "next_billing_date": "2024-02-15T00:00:00Z"
}
```

#### Update Subscription Status
```http
PATCH /api/subscriptions/{subscriptionId}
```

**Request Body:**
```json
{
  "status": "cancelled",
  "cancellation_reason": "User requested cancellation"
}
```

### Payments

#### Create Payment Record
```http
POST /api/payments
```

**Request Body:**
```json
{
  "enrollment_id": "uuid", // Optional
  "subscription_id": "uuid", // Optional
  "amount": 1000,
  "currency": "INR",
  "gateway": "razorpay",
  "gateway_order_id": "order_123",
  "payment_method": "card",
  "payment_method_details": {
    "card_type": "visa",
    "last4": "1234"
  },
  "coupon_code": "SAVE20", // Optional
  "discount_amount": 200 // Optional
}
```

#### Update Payment Status
```http
PATCH /api/payments/{paymentId}
```

**Request Body:**
```json
{
  "status": "completed",
  "gateway_payment_id": "pay_789",
  "failure_reason": "Insufficient funds" // For failed payments
}
```

### Statistics

#### Get Enrollment Statistics
```http
GET /api/enrollments/stats?course_id=uuid&date_from=2024-01-01&date_to=2024-12-31
```

**Query Parameters:**
- `course_id`: Filter by specific course
- `date_from`: Statistics from date
- `date_to`: Statistics to date

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEnrollments": 150,
    "activeEnrollments": 120,
    "completedEnrollments": 25,
    "totalRevenue": 150000,
    "averageCompletionRate": 75.5,
    "enrollmentsByMonth": [
      {
        "month": "2024-01",
        "count": 25,
        "revenue": 25000
      }
    ]
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists (e.g., duplicate enrollment)
- `500 Internal Server Error`: Server error

### Specific Error Cases

#### Enrollment Errors
- `Course enrollment capacity exceeded`: Course is full
- `Student is already enrolled in this course`: Duplicate enrollment
- `Invalid coupon code`: Coupon not found or invalid
- `Coupon already used for this course`: User already used this coupon

#### Coupon Errors
- `Coupon code already exists`: Duplicate coupon code
- `Coupon has expired or is not yet valid`: Date validation failed
- `Coupon usage limit exceeded`: Usage limit reached
- `Minimum amount required`: Order doesn't meet minimum amount

## Usage Examples

### Complete Enrollment Flow

1. **Check Course Capacity**
```javascript
const capacity = await fetch('/api/courses/course-123/capacity');
if (capacity.is_full) {
  // Handle full course
}
```

2. **Validate Coupon (Optional)**
```javascript
const validation = await fetch('/api/coupons/validate', {
  method: 'POST',
  body: JSON.stringify({
    code: 'SAVE20',
    course_id: 'course-123',
    amount: 1000
  })
});
```

3. **Create Payment**
```javascript
const payment = await fetch('/api/payments', {
  method: 'POST',
  body: JSON.stringify({
    amount: validation.finalAmount,
    gateway: 'razorpay',
    coupon_code: 'SAVE20',
    discount_amount: validation.discountAmount
  })
});
```

4. **Create Enrollment**
```javascript
const enrollment = await fetch('/api/enrollments', {
  method: 'POST',
  body: JSON.stringify({
    course_id: 'course-123',
    amount_paid: validation.finalAmount,
    transaction_id: payment.gateway_payment_id,
    coupon_code: 'SAVE20'
  })
});
```

### Progress Tracking

```javascript
// Update student progress
await fetch(`/api/enrollments/${enrollmentId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    progress: {
      completedSessions: ['session-1', 'session-2'],
      totalSessions: 10,
      completionPercentage: 20,
      timeSpent: 120
    }
  })
});
```

### Subscription Management

```javascript
// Create monthly subscription
const subscription = await fetch('/api/subscriptions', {
  method: 'POST',
  body: JSON.stringify({
    course_id: 'course-123',
    subscription_type: 'monthly',
    amount: 999,
    billing_cycle: 'monthly',
    auto_renew: true
  })
});

// Cancel subscription
await fetch(`/api/subscriptions/${subscriptionId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    status: 'cancelled',
    cancellation_reason: 'User requested'
  })
});
```

## Database Schema

The enrollment system uses the following main tables:

- `course_enrollments`: Student enrollments in courses
- `subscriptions`: Recurring subscription records
- `payments`: Payment transaction records
- `coupons`: Discount coupons
- `coupon_usage`: Coupon usage tracking
- `course_capacity`: Real-time course capacity tracking

See the migration file `004_enrollment_subscription.sql` for complete schema details.

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Users can only access their own enrollments (except admins/mentors)
3. **Input Validation**: All inputs are validated using Zod schemas
4. **Rate Limiting**: Consider implementing rate limiting for enrollment endpoints
5. **Fraud Prevention**: Coupon usage is tracked to prevent abuse
6. **Capacity Controls**: Enrollment capacity is enforced at the database level

## Performance Considerations

1. **Database Indexes**: Proper indexes are created for common query patterns
2. **Pagination**: All list endpoints support pagination
3. **Caching**: Consider caching course capacity and coupon validation results
4. **Batch Operations**: Support for bulk coupon creation
5. **Real-time Updates**: Course capacity is updated in real-time using database triggers