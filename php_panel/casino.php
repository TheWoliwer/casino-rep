<?php
require_once __DIR__ . '/config.php';
checkAuth();
$rates = getExchangeRates();

$casino_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');

if (!$casino_id) {
    header('Location: index.php');
    exit;
}

$pdo = getDB();
$stmt = $pdo->prepare("SELECT * FROM casinos WHERE id = ? LIMIT 1");
$stmt->execute([$casino_id]);
$casino = $stmt->fetch();

if (!$casino) {
    die("Casino bulunamadı.");
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title><?= htmlspecialchars($casino['name']) ?> · Casino Detay Raporu</title>
  
  <!-- Favicon: Spade ♠ -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%2338bdf8%22>♠</text></svg>">
  
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- FontAwesome 6 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- Google Fonts: Inter & JetBrains Mono -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- SweetAlert2 -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <!-- SheetJS -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

  <style>
    :root {
      --bg-base: #070a12;
      --bg-surface: #0e1424;
      --bg-card: #121b2f;
      --bg-card-hover: #18233d;
      --bg-drawer: #0b1120;
      --border-color: #1a253a;
      --border-accent: #243450;
      --accent: #38bdf8;
      --accent-dim: rgba(56, 189, 248, 0.12);
      --gold: #fbbf24;
      --success: #22c55e;
      --danger: #f43f5e;
      --text-main: #f8fafc;
      --text-muted: #64748b;
      --text-slate: #94a3b8;
    }
    
    * { box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg-base);
      color: var(--text-main);
      font-size: 0.85rem;
      line-height: 1.5;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    .font-mono { font-family: 'JetBrains Mono', monospace; }

    /* Header */
    .header-nav {
      background-color: rgba(14, 20, 36, 0.96);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      padding: 0.65rem 1.25rem;
    }

    .main-container {
      max-width: 1180px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }
    @media (min-width: 768px) {
      .main-container { padding: 2rem 1.5rem; }
    }

    /* Summary Cards */
    .card-kpi {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1rem 1.2rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .card-kpi:hover {
      border-color: var(--border-accent);
      transform: translateY(-2px);
    }
    .kpi-title {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
      font-weight: 500;
    }
    .kpi-val {
      font-size: 1.15rem;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }
    @media (min-width: 768px) {
      .kpi-val { font-size: 1.3rem; }
    }
    .kpi-sub {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    /* Table Container */
    .table-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      overflow: hidden;
    }
    
    .table-rep {
      width: 100%;
      margin-bottom: 0;
      border-collapse: collapse;
    }
    .table-rep thead th {
      background-color: var(--bg-card);
      color: var(--text-slate);
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.85rem 1.15rem;
      border: none;
      white-space: nowrap;
    }
    .table-rep tbody tr {
      border-top: 1px solid #141d30;
      background-color: var(--bg-base);
      transition: background-color 0.12s ease;
      cursor: pointer;
    }
    .table-rep tbody tr:hover {
      background-color: var(--bg-card-hover);
    }
    .table-rep td {
      padding: 0.85rem 1.15rem;
      vertical-align: middle;
      border: none;
      font-size: 0.86rem;
    }
    .table-rep tfoot tr {
      background: var(--bg-surface);
      border-top: 2px solid #243450;
      font-weight: 700;
    }
    .table-rep tfoot td {
      padding: 1rem 1.15rem;
      border: none;
    }

    /* Buttons */
    .btn-year-tab {
      padding: 0.3rem 0.75rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
      background: transparent;
      border: none;
      transition: all 0.15s;
    }
    .btn-year-tab.active {
      background: #38bdf8;
      color: #070a12;
      font-weight: 700;
    }

    .btn-action-primary {
      background: #38bdf8;
      color: #070a12;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.45rem 1rem;
      border-radius: 8px;
      border: none;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .btn-action-primary:hover {
      opacity: 0.92;
      color: #070a12;
    }

    .btn-action-outline {
      background: transparent;
      color: #94a3b8;
      font-weight: 500;
      font-size: 0.8rem;
      padding: 0.42rem 0.9rem;
      border-radius: 8px;
      border: 1px solid var(--border-accent);
      transition: all 0.15s;
      white-space: nowrap;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-action-outline:hover {
      color: #fff;
      border-color: #475569;
    }

    .form-input-compact {
      background-color: #070a12;
      border: 1px solid var(--border-accent);
      color: #fff;
      font-size: 0.88rem;
      border-radius: 9px;
      padding: 0.55rem 0.85rem;
      position: relative;
      z-index: 5;
      pointer-events: auto;
    }
    .form-input-compact:focus {
      background-color: #070a12;
      border-color: #38bdf8;
      color: #fff;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }

    /* Preset Chips */
    .chip-item {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.35rem 0.7rem;
      border-radius: 8px;
      background: #121a2d;
      border: 1px solid var(--border-accent);
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip-item:hover {
      border-color: #38bdf8;
      color: #38bdf8;
      background: var(--accent-dim);
    }

    /* Resizable Drawer */
    .external-right-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 580px;
      min-width: 320px;
      max-width: 100vw;
      background-color: var(--bg-drawer);
      border-left: 1px solid var(--border-accent);
      box-shadow: -15px 0 50px rgba(0, 0, 0, 0.85);
      z-index: 1090;
      transform: translateX(100%);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      pointer-events: auto;
    }
    .external-right-drawer.open {
      transform: translateX(0);
    }
    .external-right-drawer.is-resizing {
      transition: none !important;
      user-select: none;
    }

    @media (max-width: 768px) {
      .external-right-drawer {
        width: 100vw !important;
        border-left: none;
      }
    }

    .drawer-resizer {
      position: absolute;
      top: 0;
      left: -6px;
      bottom: 0;
      width: 12px;
      cursor: ew-resize;
      z-index: 1080;
      display: none;
      align-items: center;
      justify-content: center;
    }
    @media (min-width: 768px) {
      .drawer-resizer { display: flex; }
    }
    .drawer-resizer::after {
      content: '';
      width: 3px;
      height: 40px;
      background: var(--border-accent);
      border-radius: 3px;
      transition: all 0.2s;
    }
    .drawer-resizer:hover::after, .external-right-drawer.is-resizing .drawer-resizer::after {
      background: #38bdf8;
      height: 80px;
      box-shadow: 0 0 8px #38bdf8;
    }

    .drawer-header {
      padding: 1.15rem 1.4rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #080c16;
    }
    .drawer-body {
      padding: 1.4rem 1.4rem;
      overflow-y: auto;
      flex: 1;
    }
    .drawer-footer {
      padding: 1.1rem 1.4rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      background: #080c16;
    }

    .debt-item-card {
      background: #070a12;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0.95rem 1.15rem;
      margin-bottom: 0.85rem;
      transition: all 0.15s ease;
      position: relative;
      z-index: 5;
    }
    .debt-item-card.is-paid {
      background: rgba(34, 197, 94, 0.05);
      border-color: rgba(34, 197, 94, 0.35);
    }
    .debt-item-card.is-partial {
      background: rgba(56, 189, 248, 0.05);
      border-color: rgba(56, 189, 248, 0.35);
    }

    .btn-tick {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid var(--border-accent);
      background: transparent;
      color: transparent;
      transition: all 0.15s;
      cursor: pointer;
      flex-shrink: 0;
    }
    .btn-tick.checked {
      background: #22c55e;
      border-color: #22c55e;
      color: #fff;
    }
    .btn-tick.partial {
      background: rgba(56, 189, 248, 0.2);
      border-color: #38bdf8;
      color: #38bdf8;
    }

    .matrix-row-selected {
      background-color: rgba(56, 189, 248, 0.12) !important;
      border-left: 4px solid #38bdf8 !important;
    }
  </style>
</head>
<body>

  <!-- Sticky Navbar -->
  <header class="sticky-top header-nav">
    <div class="d-flex align-items-center justify-content-between">
      
      <!-- Left: Breadcrumb Navigation -->
      <div class="d-flex align-items-center gap-2">
        <a href="index.php" style="color: #38bdf8; font-weight: 800; font-size: 1.25rem; text-decoration: none;">♠</a>
        <a href="index.php" class="text-slate text-decoration-none fw-medium d-none d-sm-inline" style="font-size: 0.82rem;">Raporlar</a>
        <span class="text-secondary opacity-40 d-none d-sm-inline">›</span>
        <span class="fw-bold text-white fs-6 truncate" id="headerCasinoName"><?= htmlspecialchars($casino['name']) ?></span>

        <!-- Year Switcher -->
        <div class="d-flex align-items-center gap-0.5 ms-2" id="yearButtons">
          <button class="btn-year-tab <?= $year == 2025 ? 'active' : '' ?>" onclick="setYear(2025)">2025</button>
          <button class="btn-year-tab <?= $year == 2026 ? 'active' : '' ?>" onclick="setYear(2026)">2026</button>
          <button class="btn-year-tab <?= $year == 2027 ? 'active' : '' ?>" onclick="setYear(2027)">2027</button>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="d-flex align-items-center gap-2">
        <button class="btn-action-outline" onclick="exportExcel()">
          <i class="fa-solid fa-file-excel text-success"></i> <span class="d-none d-sm-inline">Excel</span>
        </button>

        <a href="index.php" class="btn-action-outline">
          <i class="fa-solid fa-arrow-left"></i> <span class="d-none d-sm-inline">Raporlara Dön</span>
        </a>
      </div>

    </div>
  </header>

  <!-- Main Container -->
  <main class="main-container">
    
    <!-- Title & Fee Type Banner -->
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <div class="d-flex align-items-center gap-3">
        <div class="rounded-3 p-2.5 px-3" style="background: rgba(56,189,248,0.1); color: #38bdf8; font-size: 1.4rem;">♠</div>
        <div>
          <h1 class="h4 fw-bold text-white m-0"><?= htmlspecialchars($casino['name']) ?></h1>
          <small class="text-secondary" id="bannerSubTitle"><?= $year ?> Yılı Finansal Raporu · <?= $casino['fee_type'] === 'percent' ? '%' . $casino['fee_rate'] . ' Fee' : ($casino['fee_type'] === 'fixed' ? 'Sabit Fee' : 'Fee Yok') ?></small>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2">
        <!-- Live Currency Rates -->
        <div class="d-none d-md-flex align-items-center gap-3 px-3 py-1.5 rounded-pill" style="background: #090e1c; border: 1px solid var(--border-accent); font-size: 0.74rem;">
          <div class="d-flex align-items-center gap-1.5">
            <span class="badge rounded-circle p-0 d-flex align-items-center justify-content-center" style="width: 16px; height: 16px; background: rgba(34,197,94,0.15); color: #22c55e; font-size: 0.65rem;">$</span>
            <span class="text-secondary">USD:</span>
            <strong class="text-white font-mono" id="rateUSD">₺<?= number_format($rates['usd'], 2) ?></strong>
          </div>
          <span style="color: #243450;">|</span>
          <div class="d-flex align-items-center gap-1.5">
            <span class="badge rounded-circle p-0 d-flex align-items-center justify-content-center" style="width: 16px; height: 16px; background: rgba(56,189,248,0.15); color: #38bdf8; font-size: 0.65rem;">€</span>
            <span class="text-secondary">EUR:</span>
            <strong class="text-white font-mono" id="rateEUR">₺<?= number_format($rates['eur'], 2) ?></strong>
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Summary KPI Cards -->
    <div class="row g-2 g-md-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="card-kpi">
          <div class="kpi-title">Toplam Beklenen</div>
          <div class="kpi-val text-white font-mono" id="cardTotalUSD">$0.00</div>
          <div class="kpi-sub font-mono" id="cardTotalTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card-kpi">
          <div class="kpi-title">Tahsil Edilen</div>
          <div class="kpi-val font-mono" style="color: var(--success);" id="cardCollectedUSD">$0.00</div>
          <div class="kpi-sub font-mono" id="cardCollectedTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card-kpi">
          <div class="kpi-title">Bekleyen Borç</div>
          <div class="kpi-val font-mono" style="color: var(--danger);" id="cardOutstandingUSD">$0.00</div>
          <div class="kpi-sub font-mono" id="cardOutstandingTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card-kpi">
          <div class="kpi-title">Tahsilat Oranı</div>
          <div class="kpi-val font-mono" style="color: #38bdf8;" id="cardRatePercent">%0.0</div>
          <div class="kpi-sub d-flex align-items-center gap-1.5" style="margin-top: 0.25rem;">
            <div class="w-100" style="height: 4px; border-radius: 99px; background: #1a253a; overflow: hidden;">
              <div id="cardProgressBar" style="height: 100%; width: 0%; background: #38bdf8; border-radius: 99px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <ul class="nav nav-pills mb-3 gap-2 border-bottom pb-2.5" style="font-size: 0.82rem;">
      <li class="nav-item">
        <button class="nav-link active py-1.5 px-3.5 rounded-2" data-bs-toggle="pill" data-bs-target="#tab12Month">📊 12 Aylık Tablo</button>
      </li>
      <li class="nav-item">
        <button class="nav-link py-1.5 px-3.5 rounded-2" data-bs-toggle="pill" data-bs-target="#tabTimeline">🕒 Hareket Geçmişi</button>
      </li>
      <li class="nav-item">
        <button class="nav-link py-1.5 px-3.5 rounded-2" data-bs-toggle="pill" data-bs-target="#tabNotes">📝 Casino Notları</button>
      </li>
      <li class="nav-item">
        <button class="nav-link py-1.5 px-3.5 rounded-2" data-bs-toggle="pill" data-bs-target="#tabSettings">ℹ️ Ayarlar</button>
      </li>
    </ul>

    <!-- Tab Contents -->
    <div class="tab-content">
      
      <!-- TAB 1: 12 AY TABLOSU -->
      <div class="tab-pane fade show active" id="tab12Month">
        <div class="table-panel">
          <div class="table-responsive">
            <table class="table-rep">
              <thead>
                <tr>
                  <th style="width: 100px;">AY</th>
                  <th class="text-end">FEE (₺)</th>
                  <th class="text-end">BORÇ TUTARI (₺)</th>
                  <th class="text-end">ÖDENEN (₺)</th>
                  <th class="text-end">KALAN (₺)</th>
                  <th class="text-center" style="width: 110px;">DURUM</th>
                  <th>NOT</th>
                  <th class="text-center" style="width: 70px;"></th>
                </tr>
              </thead>
              <tbody id="detailTableBody">
                <tr>
                  <td colspan="8" class="text-center py-5 text-secondary">
                    <div class="spinner-border spinner-border-sm text-info me-2"></div> Yükleniyor...
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td class="text-white">TOPLAM</td>
                  <td class="text-end font-mono" id="footFee">-</td>
                  <td class="text-end font-mono" id="footTurnover">-</td>
                  <td class="text-end font-mono" style="color: var(--success);" id="footPaid">-</td>
                  <td class="text-end font-mono" style="color: var(--danger);" id="footOutstanding">-</td>
                  <td class="text-center font-mono" style="color: #38bdf8;" id="footRate">%0.0</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: TIMELINE -->
      <div class="tab-pane fade" id="tabTimeline">
        <div class="row g-2 mb-3">
          <div class="col-4">
            <select class="form-input-compact w-100" id="timelineFilter" onchange="renderTimeline()">
              <option value="all">Tüm Hareketler</option>
              <option value="payment">Ödemeler (+)</option>
              <option value="entry">Borç Girişleri (-)</option>
            </select>
          </div>
          <div class="col-8">
            <input type="text" class="form-input-compact w-100" id="timelineSearch" placeholder="Arama yap..." oninput="renderTimeline()">
          </div>
        </div>
        <div id="timelineContainer" style="max-height: 60vh; overflow-y: auto;"></div>
      </div>

      <!-- TAB 3: NOTLAR -->
      <div class="tab-pane fade" id="tabNotes">
        <div class="p-4 rounded-3" style="background: #0e1424; border: 1px solid var(--border-color);">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="small text-secondary fw-semibold">ÖZEL CASİNO NOTLARI</span>
            <small class="text-secondary" style="font-size: 0.72rem;" id="notesSavedLabel">-</small>
          </div>
          <textarea class="form-input-compact w-100 font-mono" id="casinoNotesText" rows="10" placeholder="Casino ile ilgili özel notlar, anlaşmalar..."></textarea>
          <div class="d-flex justify-content-end mt-3">
            <button class="btn-action-primary" onclick="saveNotes()">Notu Kaydet</button>
          </div>
        </div>
      </div>

      <!-- TAB 4: AYARLAR -->
      <div class="tab-pane fade" id="tabSettings">
        <form onsubmit="saveCasinoSettings(event)" class="p-4 rounded-3" style="background: #0e1424; border: 1px solid var(--border-color); max-width: 540px;">
          <div class="mb-3">
            <label class="small text-secondary mb-1">Casino İsmi</label>
            <input type="text" class="form-input-compact w-100" id="settingName" value="<?= htmlspecialchars($casino['name']) ?>" required>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="small text-secondary mb-1">Fee Türü</label>
              <select class="form-input-compact w-100" id="settingFeeType">
                <option value="percent" <?= $casino['fee_type'] === 'percent' ? 'selected' : '' ?>>Yüzdelik (%)</option>
                <option value="fixed" <?= $casino['fee_type'] === 'fixed' ? 'selected' : '' ?>>Sabit Fee</option>
                <option value="none" <?= $casino['fee_type'] === 'none' ? 'selected' : '' ?>>Fee Yok</option>
              </select>
            </div>
            <div class="col-6">
              <label class="small text-secondary mb-1">Fee Oranı (%)</label>
              <input type="number" step="0.1" class="form-input-compact w-100 font-mono" id="settingFeeRate" value="<?= $casino['fee_rate'] ?>">
            </div>
          </div>
          <div class="d-flex justify-content-end">
            <button type="submit" class="btn-action-primary">Kaydet</button>
          </div>
        </form>
      </div>

    </div>

  </main>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- RESIZABLE AY DÜZENLEME ÇEKMECESİ                      -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="external-right-drawer" id="externalRightDrawer">
    <div class="drawer-resizer" id="drawerResizer" title="Genişlet / Daralt"></div>

    <div class="drawer-header">
      <div class="d-flex align-items-center gap-2">
        <span class="rounded-2 p-1.5 px-2 bg-info bg-opacity-10 text-info">
          <i class="fa-solid fa-pen-to-square"></i>
        </span>
        <div>
          <h6 class="fw-bold text-white m-0" style="font-size: 0.92rem;" id="drawerTitle">Ay Düzenle</h6>
          <small class="text-secondary" style="font-size: 0.7rem;">Borç Kalemleri & Tahsilat Girişi</small>
        </div>
      </div>

      <div class="d-flex align-items-center gap-1.5">
        <div class="btn-group btn-group-sm d-none d-md-inline-flex">
          <button type="button" class="btn btn-outline-secondary py-0 px-2" style="font-size: 0.65rem;" onclick="setDrawerWidth(500)">500px</button>
          <button type="button" class="btn btn-outline-secondary py-0 px-2" style="font-size: 0.65rem;" onclick="setDrawerWidth(680)">680px</button>
          <button type="button" class="btn btn-outline-secondary py-0 px-2" style="font-size: 0.65rem;" onclick="setDrawerWidth(880)">880px</button>
        </div>
        <button type="button" class="btn btn-link text-secondary p-0 ms-1" onclick="closeDrawer()" title="Kapat">
          <i class="fa-solid fa-xmark fs-5"></i>
        </button>
      </div>
    </div>

    <div class="drawer-body">
      <!-- Preset Chips -->
      <div class="mb-3.5">
        <span class="text-secondary d-block mb-2" style="font-size: 0.74rem; font-weight: 600;">HIZLI KALEM</span>
        <div class="d-flex flex-wrap gap-1.5">
          <span class="chip-item" onclick="applyPreset('MAKİNA KİRASI')">MAKİNA KİRASI</span>
          <span class="chip-item" onclick="applyPreset('DEPOZİTO')">DEPOZİTO</span>
          <span class="chip-item" onclick="applyPreset('SERVER ÜCRETİ')">SERVER ÜCRETİ</span>
          <span class="chip-item" onclick="applyPreset('RTP')">RTP</span>
          <span class="chip-item" onclick="applyPreset('KİRA')">KİRA</span>
          <span class="chip-item" onclick="applyPreset('SABİT-FEE')">SABİT-FEE</span>
          <span class="chip-item" onclick="applyPreset('FEE')">FEE</span>
        </div>
      </div>

      <!-- New Item Adder -->
      <div class="p-3.5 rounded-3 mb-3.5" style="background: #070a12; border: 1px solid var(--border-accent);">
        <div class="row g-2.5 mb-2.5">
          <div class="col-12 col-sm-6">
            <input type="text" class="form-input-compact w-100" id="newItemName" placeholder="Kalem adı" onclick="this.focus();">
          </div>
          <div class="col-6 col-sm-3">
            <input type="number" step="0.01" class="form-input-compact w-100 font-mono" id="newItemAmount" placeholder="Tutar" onclick="this.focus();">
          </div>
          <div class="col-6 col-sm-3">
            <select class="form-input-compact w-100 font-mono" id="newItemCurrency" style="padding-top: 0.55rem; padding-bottom: 0.55rem;">
              <option value="TRY">TRY (₺)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
        <button type="button" class="btn btn-action-primary w-100 py-2 text-center d-flex align-items-center justify-content-center gap-1.5" onclick="addNewDebtItem()">
          <i class="fa-solid fa-plus"></i> Borç Kalemi Ekle
        </button>
      </div>

      <!-- Debt Items List -->
      <div class="mb-3.5">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-secondary fw-semibold" style="font-size: 0.76rem; text-transform: uppercase;">Borç Kalemleri</span>
          <small class="text-secondary" id="itemsCountBadge">0 kalem</small>
        </div>
        
        <div id="debtItemsContainer" class="space-y-2.5"></div>
        
        <!-- Live Total -->
        <div class="p-3 rounded-3 mt-2.5 d-flex justify-content-between align-items-center font-mono" style="background: #070a12; border: 1px solid var(--border-color); font-size: 0.86rem;">
          <span class="text-secondary">Toplam Borç:</span>
          <div class="text-end">
            <strong class="text-white d-block fs-6" id="debtItemsLiveTotalTRY">₺0,00</strong>
            <small class="text-secondary font-mono" style="font-size: 0.72rem;" id="debtItemsLiveTotalUSD">$0.00</small>
          </div>
        </div>
      </div>

      <!-- Payment Section -->
      <div class="p-3.5 rounded-3 mb-3.5" style="background: #070a12; border: 1px solid var(--border-color);">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-success fw-semibold" style="font-size: 0.76rem;">+ TAHSİLAT / ÖDEME GİR</span>
          <small class="text-secondary font-mono" style="font-size: 0.74rem;" id="feeCurrentPaidAmount">Mevcut: ₺0,00</small>
        </div>
        <div class="row g-2.5">
          <div class="col-6">
            <input type="number" step="0.01" class="form-input-compact w-100 font-mono" id="feeNewPayment" placeholder="Tutar (₺)" onclick="this.focus();">
          </div>
          <div class="col-6">
            <input type="text" class="form-input-compact w-100" id="feePaymentNote" placeholder="Ödeme Notu" onclick="this.focus();">
          </div>
        </div>
      </div>

      <!-- General Note -->
      <div class="mb-2">
        <label class="small text-secondary mb-1">Genel Not</label>
        <input type="text" class="form-input-compact w-100" id="feeGeneralNote" placeholder="Bu ay için özel açıklama..." onclick="this.focus();">
      </div>
    </div>

    <div class="drawer-footer">
      <button type="button" class="btn-action-outline px-3" onclick="closeDrawer()">Vazgeç</button>
      <button type="button" class="btn-action-primary px-4" onclick="saveFeeRowData()">Kaydet</button>
    </div>
  </div>

  <!-- Bootstrap 5 JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Script Logic -->
  <script>
    const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const casinoId = <?= (int)$casino_id ?>;
    let currentYear = <?= (int)$year ?>;
    let rates = { usd: <?= (float)$rates['usd'] ?>, eur: <?= (float)$rates['eur'] ?> };
    let profileData = null;
    let currentEditingMonth = null;
    let currentDebtItems = [];

    function fmt(n) {
      return (Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function fmtUSD(n) {
      return (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function toUSD(tryAmount) {
      return rates.usd ? (Number(tryAmount) || 0) / rates.usd : Number(tryAmount) || 0;
    }
    function toTRY(amount, currency) {
      if (currency === 'USD') return (Number(amount) || 0) * rates.usd;
      if (currency === 'EUR') return (Number(amount) || 0) * rates.eur;
      return Number(amount) || 0;
    }

    async function loadData() {
      try {
        const res = await fetch(`api.php?action=get_profile&casino_id=${casinoId}`);
        const data = await res.json();
        if (data.success) {
          profileData = data;
          document.getElementById('casinoNotesText').value = data.notes || '';
          render();
        }
      } catch(e) {
        console.error(e);
      }
    }

    function setYear(y) {
      currentYear = y;
      document.querySelectorAll('#yearButtons .btn-year-tab').forEach(b => {
        b.classList.toggle('active', b.innerText == y);
      });
      document.getElementById('bannerSubTitle').innerText = `${y} Yılı Finansal Raporu · ` + (profileData?.casino?.fee_type === 'percent' ? '%' + profileData?.casino?.fee_rate + ' Fee' : (profileData?.casino?.fee_type === 'fixed' ? 'Sabit Fee' : 'Fee Yok'));
      render();
    }

    function render() {
      if (!profileData) return;

      const feeRowsForYear = (profileData.fee_rows || []).filter(r => r.year === currentYear);
      const rowByMonth = new Map(feeRowsForYear.map(r => [r.month, r]));

      let totalFee = 0;
      let totalTurnover = 0;
      let totalPaid = 0;

      const tbody = document.getElementById('detailTableBody');
      let html = '';

      for (let m = 1; m <= 12; m++) {
        const r = rowByMonth.get(m);
        const feeAmount = r ? Number(r.fee_amount) || 0 : 0;
        const turnover = r ? Number(r.turnover) || 0 : 0;
        const paidAmount = r ? Number(r.paid_amount) || 0 : 0;
        const outstanding = Math.max(0, turnover - paidAmount);
        const note = r ? r.note || '' : '';

        totalFee += feeAmount;
        totalTurnover += turnover;
        totalPaid += paidAmount;

        let statusBadge = '<span class="text-secondary opacity-30">—</span>';
        if (turnover > 0 || paidAmount > 0) {
          if (turnover > 0 && paidAmount >= turnover) {
            statusBadge = '<span class="badge" style="background: rgba(34,197,94,0.15); color: #22c55e; font-size: 0.72rem; padding: 0.3rem 0.6rem;">✓ ALINDI</span>';
          } else if (paidAmount > 0) {
            statusBadge = '<span class="badge" style="background: rgba(56,189,248,0.15); color: #38bdf8; font-size: 0.72rem; padding: 0.3rem 0.6rem;">≈ KISMİ</span>';
          } else {
            statusBadge = '<span class="badge" style="background: rgba(244,63,94,0.15); color: #f43f5e; font-size: 0.72rem; padding: 0.3rem 0.6rem;">✗ ALINMADI</span>';
          }
        }

        const isSelected = currentEditingMonth === m;

        html += `
          <tr class="${isSelected ? 'matrix-row-selected' : ''}" onclick="openMonthDrawer(${m})">
            <td class="fw-semibold text-white">${MONTHS[m]}</td>
            <td class="text-end font-mono">${feeAmount > 0 ? '₺' + fmt(feeAmount) : '—'}</td>
            <td class="text-end font-mono">${turnover > 0 ? '₺' + fmt(turnover) : '—'}</td>
            <td class="text-end font-mono" style="color: var(--success);">${paidAmount > 0 ? '₺' + fmt(paidAmount) : '—'}</td>
            <td class="text-end font-mono" style="color: ${outstanding > 0 ? 'var(--danger)' : '#64748b'};">${outstanding > 0 ? '₺' + fmt(outstanding) : (turnover > 0 ? '₺0,00' : '—')}</td>
            <td class="text-center">${statusBadge}</td>
            <td class="text-secondary text-truncate" style="max-width: 160px; font-size: 0.78rem;">${note}</td>
            <td class="text-center text-info opacity-75"><i class="fa-solid fa-pen-to-square"></i> Düzenle</td>
          </tr>
        `;
      }

      tbody.innerHTML = html;

      // KPI Cards
      const totalOutstanding = Math.max(0, totalTurnover - totalPaid);
      const overallRate = totalTurnover > 0 ? (totalPaid / totalTurnover) * 100 : 0;

      document.getElementById('cardTotalUSD').innerText = '$' + fmtUSD(toUSD(totalTurnover));
      document.getElementById('cardTotalTRY').innerText = '₺' + fmt(totalTurnover);

      document.getElementById('cardCollectedUSD').innerText = '$' + fmtUSD(toUSD(totalPaid));
      document.getElementById('cardCollectedTRY').innerText = '₺' + fmt(totalPaid);

      document.getElementById('cardOutstandingUSD').innerText = '$' + fmtUSD(toUSD(totalOutstanding));
      document.getElementById('cardOutstandingTRY').innerText = '₺' + fmt(totalOutstanding);

      document.getElementById('cardRatePercent').innerText = '%' + overallRate.toFixed(1);
      document.getElementById('cardProgressBar').style.width = Math.min(100, overallRate) + '%';
      document.getElementById('cardProgressBar').style.background = overallRate >= 100 ? '#22c55e' : overallRate > 50 ? '#38bdf8' : '#f43f5e';

      // Footer
      document.getElementById('footFee').innerText = '₺' + fmt(totalFee);
      document.getElementById('footTurnover').innerHTML = `$${fmtUSD(toUSD(totalTurnover))}<br><span class="text-secondary fw-normal font-mono" style="font-size: 0.7rem;">₺${fmt(totalTurnover)}</span>`;
      document.getElementById('footPaid').innerHTML = `$${fmtUSD(toUSD(totalPaid))}<br><span class="text-secondary fw-normal font-mono" style="font-size: 0.7rem;">₺${fmt(totalPaid)}</span>`;
      document.getElementById('footOutstanding').innerHTML = `$${fmtUSD(toUSD(totalOutstanding))}<br><span class="text-secondary fw-normal font-mono" style="font-size: 0.7rem;">₺${fmt(totalOutstanding)}</span>`;
      document.getElementById('footRate').innerText = `%${overallRate.toFixed(1)}`;

      renderTimeline();
    }

    // Drawer Logic
    function setDrawerWidth(px) {
      if (window.innerWidth > 768) {
        document.getElementById('externalRightDrawer').style.width = px + 'px';
      }
    }

    const drawer = document.getElementById('externalRightDrawer');
    const resizer = document.getElementById('drawerResizer');
    let isResizing = false;

    if (resizer) {
      resizer.addEventListener('mousedown', (e) => {
        if (window.innerWidth <= 768) return;
        isResizing = true;
        drawer.classList.add('is-resizing');
        document.body.style.cursor = 'ew-resize';
        e.preventDefault();
      });
    }

    document.addEventListener('mousemove', (e) => {
      if (!isResizing || window.innerWidth <= 768) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 380 && newWidth <= window.innerWidth * 0.95) {
        drawer.style.width = `${newWidth}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        drawer.classList.remove('is-resizing');
        document.body.style.cursor = 'default';
      }
    });

    function openMonthDrawer(month) {
      currentEditingMonth = month;
      const year = currentYear;

      document.getElementById('drawerTitle').innerHTML = `${MONTHS[month]} ${year} Düzenle`;
      document.getElementById('newItemName').value = '';
      document.getElementById('newItemAmount').value = '';
      document.getElementById('newItemCurrency').value = 'TRY';
      document.getElementById('feePaymentNote').value = '';

      const existing = (profileData.fee_rows || []).find(r => r.year === year && r.month === month);
      currentDebtItems = existing && existing.debt_items ? JSON.parse(JSON.stringify(existing.debt_items)) : [];
      document.getElementById('feeGeneralNote').value = existing ? existing.note || '' : '';
      
      const currentPaid = existing ? Number(existing.paid_amount) || 0 : 0;
      document.getElementById('feeCurrentPaidAmount').innerText = 'Mevcut: ₺' + fmt(currentPaid);
      document.getElementById('feeNewPayment').value = currentPaid > 0 ? currentPaid.toFixed(2) : '';

      renderDebtItems();
      render();

      document.getElementById('externalRightDrawer').classList.add('open');
    }

    function closeDrawer() {
      currentEditingMonth = null;
      document.getElementById('externalRightDrawer').classList.remove('open');
      render();
    }

    function applyPreset(preset) {
      document.getElementById('newItemName').value = preset;
      document.getElementById('newItemAmount').focus();
    }

    function addNewDebtItem() {
      const name = document.getElementById('newItemName').value.trim();
      const amount = parseFloat(document.getElementById('newItemAmount').value) || 0;
      const currency = document.getElementById('newItemCurrency').value;

      if (!name || amount <= 0) {
        Swal.fire({ icon: 'warning', title: 'Lütfen kalem adı ve tutar girin', timer: 1200, showConfirmButton: false });
        return;
      }

      currentDebtItems.push({
        name: name,
        amount: amount,
        currency: currency,
        paid: false,
        paid_amount: 0
      });

      document.getElementById('newItemName').value = '';
      document.getElementById('newItemAmount').value = '';
      
      renderDebtItems();
    }

    function toggleDebtItemPaid(idx) {
      const item = currentDebtItems[idx];
      const newPaid = !item.paid;
      item.paid = newPaid;
      item.paid_amount = newPaid ? item.amount : 0;
      recalcOverallPayment();
      renderDebtItems();
    }

    function updateItemPaidAmount(idx, val) {
      const item = currentDebtItems[idx];
      const pa = parseFloat(val) || 0;
      item.paid_amount = pa;
      item.paid = pa >= item.amount && item.amount > 0;
      recalcOverallPayment();
      renderDebtItems();
    }

    function removeDebtItem(idx) {
      currentDebtItems.splice(idx, 1);
      recalcOverallPayment();
      renderDebtItems();
    }

    function recalcOverallPayment() {
      let totalPaidTRY = 0;
      currentDebtItems.forEach(i => {
        const pa = i.paid_amount !== undefined ? i.paid_amount : (i.paid ? i.amount : 0);
        totalPaidTRY += toTRY(pa, i.currency);
      });
      document.getElementById('feeNewPayment').value = totalPaidTRY > 0 ? totalPaidTRY.toFixed(2) : '';
    }

    function renderDebtItems() {
      const container = document.getElementById('debtItemsContainer');
      document.getElementById('itemsCountBadge').innerText = `${currentDebtItems.length} kalem`;

      if (currentDebtItems.length === 0) {
        container.innerHTML = '<p class="text-secondary text-center py-3 m-0" style="font-size: 0.76rem;">Henüz borç kalemi eklenmemiş.</p>';
        updateDebtTotals();
        return;
      }

      container.innerHTML = currentDebtItems.map((item, idx) => {
        const itemTRY = toTRY(item.amount, item.currency);
        const itemUSD = toUSD(itemTRY);
        const paidAmt = item.paid_amount !== undefined ? item.paid_amount : (item.paid ? item.amount : 0);
        const isFull = paidAmt >= item.amount && item.amount > 0;
        const isPartial = paidAmt > 0 && paidAmt < item.amount;
        
        const cardClass = isFull ? 'debt-item-card is-paid' : (isPartial ? 'debt-item-card is-partial' : 'debt-item-card');
        const tickClass = isFull ? 'btn-tick checked' : (isPartial ? 'btn-tick partial' : 'btn-tick');

        return `
          <div class="${cardClass}">
            <div class="d-flex align-items-center justify-content-between gap-2.5 mb-2">
              <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                <button type="button" class="${tickClass}" onclick="toggleDebtItemPaid(${idx})" title="Tamamını Ödendi Olarak İşaretle">
                  ${isFull ? '✓' : (isPartial ? '≈' : '')}
                </button>
                <strong class="text-white text-truncate" style="font-size: 0.88rem;">${item.name}</strong>
              </div>
              <div class="text-end">
                <strong class="font-mono text-white" style="font-size: 0.88rem;">${fmt(item.amount)} ${item.currency}</strong>
                <small class="text-secondary d-block font-mono" style="font-size: 0.7rem;">₺${fmt(itemTRY)}</small>
              </div>
              <button class="btn btn-link text-danger p-0 ms-1" onclick="removeDebtItem(${idx})" title="Kalemi Sil">
                <i class="fa-solid fa-trash-can" style="font-size: 0.88rem;"></i>
              </button>
            </div>

            <div class="d-flex align-items-center justify-content-between pt-2 mt-1.5 border-top" style="border-color: rgba(255,255,255,0.06) !important; font-size: 0.76rem;">
              <span class="text-secondary">Bu Kalemden Ödenen:</span>
              <div class="d-flex align-items-center gap-1.5" style="width: 150px;">
                <input type="number" step="0.01" class="form-input-compact w-100 font-mono text-end" style="padding: 0.4rem 0.65rem; font-size: 0.86rem; position: relative; z-index: 10; pointer-events: auto;" value="${paidAmt > 0 ? paidAmt : ''}" placeholder="0" oninput="updateItemPaidAmount(${idx}, this.value)" onclick="this.focus(); event.stopPropagation();">
                <span class="text-secondary font-mono">${item.currency}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      updateDebtTotals();
    }

    function updateDebtTotals() {
      let totalTRY = 0;
      currentDebtItems.forEach(item => {
        totalTRY += toTRY(item.amount, item.currency);
      });
      document.getElementById('debtItemsLiveTotalTRY').innerText = '₺' + fmt(totalTRY);
      document.getElementById('debtItemsLiveTotalUSD').innerText = '$' + fmtUSD(toUSD(totalTRY));
    }

    async function saveFeeRowData() {
      if (!profileData || currentEditingMonth === null) return;
      const casino_id = casinoId;
      const year = currentYear;
      const month = currentEditingMonth;
      const note = document.getElementById('feeGeneralNote').value;
      const paymentInput = parseFloat(document.getElementById('feeNewPayment').value) || 0;
      const paymentNote = document.getElementById('feePaymentNote').value;

      let totalTRY = 0;
      currentDebtItems.forEach(item => {
        totalTRY += toTRY(item.amount, item.currency);
      });

      const existing = (profileData.fee_rows || []).find(r => r.year === year && r.month === month);
      const prevPaid = existing ? Number(existing.paid_amount) || 0 : 0;
      const addedPayment = Math.max(0, paymentInput - prevPaid);

      // Save fee_row
      await fetch('api.php?action=save_fee_row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          casino_id, year, month,
          turnover: totalTRY,
          fee_amount: totalTRY,
          paid_amount: paymentInput,
          status: paymentInput >= totalTRY && totalTRY > 0 ? 1 : 0,
          note,
          debt_items: currentDebtItems
        })
      });

      if (addedPayment > 0) {
        const res = await fetch(`api.php?action=get_profile&casino_id=${casino_id}`);
        const freshProfile = await res.json();
        const updatedRow = (freshProfile.fee_rows || []).find(r => r.year === year && r.month === month);
        if (updatedRow) {
          await fetch('api.php?action=add_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fee_row_id: updatedRow.id,
              paid_amount: addedPayment,
              note: paymentNote
            })
          });
        }
      }

      Swal.fire({ icon: 'success', title: 'Kaydedildi', timer: 700, showConfirmButton: false });
      loadData();
    }

    function renderTimeline() {
      if (!profileData) return;
      const container = document.getElementById('timelineContainer');
      const filter = document.getElementById('timelineFilter').value;
      const search = (document.getElementById('timelineSearch').value || '').trim().toLowerCase();

      const txs = (profileData.transactions || []).map(t => ({
        kind: 'payment',
        amount: Number(t.paid_amount) || 0,
        note: t.note || 'Ödeme',
        date: t.created_at
      }));

      const entries = (profileData.fee_rows || [])
        .filter(r => (Number(r.turnover) || 0) > 0)
        .map(r => ({
          kind: 'entry',
          amount: Number(r.turnover) || 0,
          note: `${MONTHS[r.month]} ${r.year} Borç: ` + (r.debt_items || []).map(i => `${i.name} (${i.amount} ${i.currency})`).join(', '),
          date: r.created_at || `${r.year}-${String(r.month).padStart(2,'0')}-01`
        }));

      let all = [...txs, ...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

      if (filter !== 'all') all = all.filter(e => e.kind === filter);
      if (search) all = all.filter(e => e.note.toLowerCase().includes(search));

      if (all.length === 0) {
        container.innerHTML = '<p class="text-secondary text-center py-4 m-0">Hareket bulunamadı.</p>';
        return;
      }

      container.innerHTML = all.map(e => `
        <div class="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2" style="background: #0e1424; border: 1px solid var(--border-color); font-size: 0.84rem;">
          <div>
            <strong class="font-mono" style="color: ${e.kind === 'payment' ? 'var(--success)' : '#38bdf8'}; font-size: 0.92rem;">${e.kind === 'payment' ? '+' : ''}₺${fmt(e.amount)}</strong>
            <small class="text-secondary d-block" style="font-size: 0.76rem;">${e.note}</small>
          </div>
          <small class="text-secondary font-mono" style="font-size: 0.72rem;">${new Date(e.date).toLocaleDateString('tr-TR')}</small>
        </div>
      `).join('');
    }

    async function saveNotes() {
      const notes = document.getElementById('casinoNotesText').value;
      await fetch('api.php?action=save_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casino_id: casinoId, notes })
      });
      document.getElementById('notesSavedLabel').innerText = 'Kaydedildi: ' + new Date().toLocaleTimeString('tr-TR');
      Swal.fire({ icon: 'success', title: 'Not Kaydedildi', timer: 800, showConfirmButton: false });
    }

    async function saveCasinoSettings(e) {
      e.preventDefault();
      const name = document.getElementById('settingName').value.trim();
      const fee_type = document.getElementById('settingFeeType').value;
      const fee_rate = parseFloat(document.getElementById('settingFeeRate').value) || 0;

      await fetch('api.php?action=edit_casino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: casinoId, name, fee_type, fee_rate })
      });

      document.getElementById('headerCasinoName').innerText = name;
      Swal.fire({ icon: 'success', title: 'Güncellendi', timer: 800, showConfirmButton: false });
      loadData();
    }

    function exportExcel() {
      if (!profileData) return;
      const rowsForYear = (profileData.fee_rows || []).filter(r => r.year === currentYear);
      const rowByMonth = new Map(rowsForYear.map(r => [r.month, r]));

      const data = [];
      for (let m = 1; m <= 12; m++) {
        const r = rowByMonth.get(m);
        const turnover = r ? Number(r.turnover) || 0 : 0;
        const paid = r ? Number(r.paid_amount) || 0 : 0;
        const os = Math.max(0, turnover - paid);
        const statusLabel = !r ? '' : (turnover > 0 && paid >= turnover) ? 'ALINDI' : paid > 0 ? 'KISMİ' : 'ALINMADI';

        data.push({
          'Ay': MONTHS[m],
          'Borç (TRY)': turnover || '',
          'Borç (USD)': rates.usd && turnover ? +(turnover / rates.usd).toFixed(2) : '',
          'Ödenen (TRY)': paid || '',
          'Ödenen (USD)': rates.usd && paid ? +(paid / rates.usd).toFixed(2) : '',
          'Kalan (TRY)': os || '',
          'Kalan (USD)': rates.usd && os ? +(os / rates.usd).toFixed(2) : '',
          'Durum': statusLabel,
          'Not': r ? r.note || '' : ''
        });
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${profileData.casino.name} ${currentYear}`);
      XLSX.writeFile(wb, `${profileData.casino.name}_${currentYear}_Raporu.xlsx`);
    }

    document.addEventListener('DOMContentLoaded', () => {
      loadData();
    });
  </script>
</body>
</html>
