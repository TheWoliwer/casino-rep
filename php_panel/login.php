<?php
require_once __DIR__ . '/config.php';

$error = '';

if (!empty($_SESSION['casino_logged_in'])) {
    header('Location: index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = trim($_POST['password'] ?? '');
    if ($password === PANEL_PASSWORD) {
        $_SESSION['casino_logged_in'] = true;
        header('Location: index.php');
        exit;
    } else {
        $error = 'Hatalı şifre girdiniz!';
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Giriş Yap · Casino Takip</title>
  
  <!-- Favicon: Spade ♠ -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%2338bdf8%22>♠</text></svg>">
  
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- FontAwesome 6 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- Google Fonts: Inter -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg-base: #070a12;
      --bg-card: #0f1626;
      --border-color: #1c273c;
      --accent: #38bdf8;
      --text-main: #f8fafc;
      --text-muted: #64748b;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-base);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background-image: radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.08) 0%, transparent 60%);
    }
    .login-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75);
    }
    .form-input-login {
      background-color: #090d16;
      border: 1px solid var(--border-color);
      color: #fff;
      font-size: 0.95rem;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      transition: all 0.2s;
    }
    .form-input-login:focus {
      background-color: #090d16;
      border-color: var(--accent);
      color: #fff;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
    }
    .btn-login {
      background: var(--accent);
      color: #090d16;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 0.75rem;
      border-radius: 12px;
      border: none;
      transition: all 0.2s;
      width: 100%;
    }
    .btn-login:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
  </style>
</head>
<body>

  <div class="login-card text-center">
    <!-- Logo -->
    <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style="width: 64px; height: 64px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25);">
      <span style="font-size: 2rem; color: #38bdf8;">♠</span>
    </div>
    
    <h4 class="fw-bold text-white mb-1">Casino Takip</h4>
    <p class="text-secondary small mb-4">Finansal Yönetim Paneli</p>

    <?php if ($error): ?>
      <div class="alert alert-danger py-2 px-3 small rounded-3 mb-3 text-start d-flex align-items-center gap-2" style="background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #f43f5e;">
        <i class="fa-solid fa-circle-exclamation"></i> <?= htmlspecialchars($error) ?>
      </div>
    <?php endif; ?>

    <form method="POST" action="login.php">
      <div class="mb-3 text-start">
        <label class="form-label small text-secondary fw-semibold">Giriş Şifresi</label>
        <div class="input-group">
          <input type="password" name="password" id="passwordInput" class="form-control form-input-login" required autofocus placeholder="Şifrenizi girin">
          <button class="btn btn-outline-secondary" type="button" onclick="togglePassVisibility()" style="border-color: var(--border-color); color: #64748b;">
            <i class="fa-solid fa-eye" id="eyeIcon"></i>
          </button>
        </div>
      </div>

      <button type="submit" class="btn btn-login mt-2">
        Giriş Yap <i class="fa-solid fa-arrow-right ms-1"></i>
      </button>
    </form>
  </div>

  <script>
    function togglePassVisibility() {
      const input = document.getElementById('passwordInput');
      const icon = document.getElementById('eyeIcon');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    }
  </script>
</body>
</html>
