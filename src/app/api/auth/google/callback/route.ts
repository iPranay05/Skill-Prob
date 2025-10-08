import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: 'Authorization failed' }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  // Return a simple page showing the code
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google OAuth Success</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .code { background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; word-break: break-all; border: 1px solid #e9ecef; }
        .success { color: #28a745; font-size: 18px; margin-bottom: 20px; }
        .instructions { background: #e7f3ff; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅ Google OAuth Authorization Successful!</div>
        
        <div class="instructions">
          <strong>Copy this authorization code and paste it in your terminal:</strong>
        </div>
        
        <div class="code" id="authCode">${code}</div>
        
        <button onclick="copyCode()" style="margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Copy Code
        </button>
        
        <p style="margin-top: 20px; color: #6c757d; font-size: 14px;">
          Go back to your terminal and paste this code when prompted.
        </p>
      </div>
      
      <script>
        function copyCode() {
          const code = document.getElementById('authCode').textContent;
          navigator.clipboard.writeText(code).then(() => {
            alert('Code copied to clipboard!');
          });
        }
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
