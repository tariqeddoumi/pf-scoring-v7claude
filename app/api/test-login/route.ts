import { NextResponse } from "next/server";

export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Login - PF Scoring</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 400px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 30px;
      color: #333;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #555;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      width: 100%;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }
    button:hover {
      background: #5568d3;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .result {
      margin-top: 30px;
      padding: 20px;
      border-radius: 4px;
      display: none;
    }
    .result.success {
      display: block;
      background: #f0f9ff;
      border: 1px solid #4ade80;
      color: #166534;
    }
    .result.error {
      display: block;
      background: #fef2f2;
      border: 1px solid #f87171;
      color: #991b1b;
    }
    .result pre {
      background: rgba(0,0,0,0.05);
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      margin-top: 10px;
    }
    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 10px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .button-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .test-users {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .test-users strong {
      display: block;
      margin-bottom: 8px;
    }
    .test-users p {
      margin: 4px 0;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Test Login</h1>

    <div class="test-users">
      <strong>Test Users:</strong>
      <p><strong>Admin:</strong> admin@pf-scoring.ma / Admin123!</p>
      <p><strong>Analyste:</strong> analyste@pf-scoring.ma / Analyste123!</p>
    </div>

    <form id="loginForm">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="admin@pf-scoring.ma"
          required
        >
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Admin123!"
          required
        >
      </div>

      <button type="submit">
        <div class="button-content">
          <div class="spinner" id="spinner"></div>
          <span id="buttonText">Test Login</span>
        </div>
      </button>
    </form>

    <div class="result" id="result"></div>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const resultDiv = document.getElementById('result');
    const spinner = document.getElementById('spinner');
    const buttonText = document.getElementById('buttonText');
    const submitBtn = form.querySelector('button');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      spinner.style.display = 'block';
      submitBtn.disabled = true;
      buttonText.textContent = 'Testing...';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          resultDiv.className = 'result success';
          resultDiv.innerHTML = \`
            <strong>✓ Login Successful!</strong>
            <p>User: \${data.user.email} (\${data.user.role})</p>
            <pre>\${JSON.stringify(data.user, null, 2)}</pre>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Token set in httpOnly cookie. You can now create projects.
            </p>
          \`;
        } else {
          resultDiv.className = 'result error';
          resultDiv.innerHTML = \`
            <strong>✗ Login Failed</strong>
            <p>\${data.error || 'Unknown error'}</p>
          \`;
        }
      } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = \`
          <strong>✗ Error</strong>
          <p>\${error.message}</p>
        \`;
      } finally {
        spinner.style.display = 'none';
        submitBtn.disabled = false;
        buttonText.textContent = 'Test Login';
      }
    });
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
