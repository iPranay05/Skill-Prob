# EmailJS Template for Career Services

## Setup Instructions

### 1. Environment Variables
Add this to your `.env.local` file:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_CAREER_TEMPLATE_ID=your_career_template_id_here  
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

### 2. Career Services Email Template
Create a new template in EmailJS with these variables:

**Template Name:** Career Services Request Notification

**Subject:** New Career Service Request - {{service_type}} - {{from_name}}

**Template Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #5e17eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .service-card { margin-bottom: 20px; padding: 20px; border-left: 5px solid #5e17eb; background: #f8f9ff; border-radius: 8px; }
        .client-info { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .field { margin-bottom: 10px; }
        .label { font-weight: bold; color: #5e17eb; display: inline-block; width: 120px; }
        .value { margin-left: 10px; }
        .urgency-high { background: #fff3cd; border-left-color: #ffc107; }
        .urgency-normal { background: #d1ecf1; border-left-color: #17a2b8; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; margin-top: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 New Career Service Request</h1>
        <p>{{request_type}} - {{submission_date}}</p>
    </div>
    
    <div class="content">
        <!-- Service Information -->
        <div class="service-card {{#if urgency}}{{#eq urgency 'High - Last Minute Preparation'}}urgency-high{{else}}urgency-normal{{/eq}}{{else}}urgency-normal{{/if}}">
            <h2>📋 Service Details</h2>
            <div class="field">
                <span class="label">Service Type:</span>
                <strong>{{service_type}}</strong>
            </div>
            <div class="field">
                <span class="label">Description:</span>
                <span>{{service_description}}</span>
            </div>
            <div class="field">
                <span class="label">Priority:</span>
                <span>{{urgency}}</span>
            </div>
        </div>

        <!-- Client Information -->
        <div class="client-info">
            <h2>👤 Client Information</h2>
            <div class="field">
                <span class="label">Name:</span>
                <span class="value">{{applicant_name}}</span>
            </div>
            <div class="field">
                <span class="label">Email:</span>
                <span class="value">{{applicant_email}}</span>
            </div>
            <div class="field">
                <span class="label">Phone:</span>
                <span class="value">{{applicant_phone}}</span>
            </div>
            <div class="field">
                <span class="label">City:</span>
                <span class="value">{{applicant_city}}</span>
            </div>
            <div class="field">
                <span class="label">College:</span>
                <span class="value">{{college_name}}</span>
            </div>
        </div>

        <!-- Service-Specific Information -->
        {{#eq service_type "Resume Review"}}
        <div class="service-card">
            <h3>📄 Resume Review Service</h3>
            <p><strong>What the client will receive:</strong></p>
            <ul>
                <li>Expert feedback from hiring professionals</li>
                <li>ATS-optimized formatting</li>
                <li>Professional design and layout improvements</li>
                <li>Strategic highlighting of key skills</li>
                <li>Industry-standard compliance check</li>
            </ul>
        </div>
        {{/eq}}

        {{#eq service_type "LinkedIn Optimization"}}
        <div class="service-card">
            <h3>💼 LinkedIn Optimization Service</h3>
            <p><strong>What the client will receive:</strong></p>
            <ul>
                <li>Professional profile makeover</li>
                <li>Strategic keyword optimization</li>
                <li>Compelling storytelling and narrative</li>
                <li>Enhanced profile ranking strategies</li>
                <li>Professional presence enhancement</li>
            </ul>
        </div>
        {{/eq}}

        {{#eq service_type "Last Minute Interview Preparation"}}
        <div class="service-card urgency-high">
            <h3>⚡ Last Minute Interview Preparation</h3>
            <p><strong>URGENT REQUEST - What the client will receive:</strong></p>
            <ul>
                <li>Rapid confidence building techniques</li>
                <li>Strategic answer frameworks</li>
                <li>Professional communication coaching</li>
                <li>Resume alignment strategies</li>
                <li>Real-time feedback and improvement tips</li>
            </ul>
            <p><strong>⏰ Note:</strong> This is a last-minute request - prioritize response!</p>
        </div>
        {{/eq}}

        {{#eq service_type "One on One Counseling"}}
        <div class="service-card">
            <h3>🎯 One-on-One Career Counseling</h3>
            <p><strong>Comprehensive service - What the client will receive:</strong></p>
            <ul>
                <li>Personalized resume transformation</li>
                <li>Complete LinkedIn profile optimization</li>
                <li>Comprehensive interview preparation</li>
                <li>Customized career strategy roadmap</li>
                <li>Ongoing mentorship support</li>
            </ul>
        </div>
        {{/eq}}

        <!-- Next Steps -->
        <div class="footer">
            <h3>✅ Next Steps</h3>
            <p>1. Contact the client at <strong>{{applicant_email}}</strong> or <strong>{{applicant_phone}}</strong></p>
            <p>2. Schedule a consultation call within 24 hours</p>
            <p>3. Prepare service materials based on the requested service type</p>
            <p>4. Update client status in the CRM system</p>
            
            {{#eq urgency "High - Last Minute Preparation"}}
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 15px;">
                <strong>⚠️ URGENT:</strong> This is a last-minute interview preparation request. 
                Please prioritize and contact within 2-4 hours if possible.
            </div>
            {{/eq}}
        </div>
    </div>
</body>
</html>
```

### 3. Template Variables
Make sure these variables are configured in your EmailJS template:

**Basic Info:**
- `{{to_email}}` - Your email address
- `{{from_name}}` - Client's name
- `{{service_type}}` - Type of service requested
- `{{submission_date}}` - When the request was submitted

**Client Details:**
- `{{applicant_name}}` - Client's full name
- `{{applicant_email}}` - Client's email
- `{{applicant_phone}}` - Client's phone number
- `{{applicant_city}}` - Client's city
- `{{college_name}}` - Client's college/university

**Service Info:**
- `{{service_description}}` - Brief description of the service
- `{{request_type}}` - Type of request (always "Career Service Request")
- `{{urgency}}` - Priority level (High for interview prep, Normal for others)

### 4. Update Email Address
In the CareerServices component, replace `'your-email@example.com'` with your actual email address.

### 5. Service-Specific Features

**Resume Review:**
- Standard priority
- Professional feedback focus
- ATS optimization emphasis

**LinkedIn Optimization:**
- Standard priority  
- Profile enhancement focus
- Keyword optimization emphasis

**Last Minute Interview Preparation:**
- HIGH PRIORITY (marked as urgent)
- Quick turnaround expected
- Confidence building focus

**One on One Counseling:**
- Comprehensive service
- Multiple touchpoints
- Long-term mentorship

### 6. Test Each Service
Test all four services to ensure emails are sent correctly:
1. Resume Review
2. LinkedIn Optimization  
3. Last Minute Interview Preparation (will be marked as urgent)
4. One on One Counseling

## Email Features
- Service-specific content and recommendations
- Urgency indicators for time-sensitive requests
- Professional formatting with brand colors
- Clear next steps for follow-up
- Client contact information prominently displayed
- Service benefits listed for reference