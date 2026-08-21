<?php
require_once __DIR__ . '/config.php';
checkAuth();
$rates = getExchangeRates();
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Çoklu Ay Fee Raporu Oluşturucu - Casino Takip</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>♠</text></svg>">

  <!-- Google Fonts & Bootstrap 5 & FontAwesome 6 & SweetAlert2 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

  <style>
    :root {
      --bg-base: #070a12;
      --bg-surface: #0e1424;
      --bg-card: #131b2e;
      --bg-input: #090e1a;
      --border-color: #1e293b;
      --border-accent: #2c3c58;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --gold: #fbbf24;
      --success: #22c55e;
      --danger: #f43f5e;

      /* A4 Rapor Değişkenleri */
      --font-size: 11px;
      --line-height: 1.5;
      --table-padding-y: 9px;
      --table-padding-x: 12px;
      --page-padding-y: 22mm;
      --page-padding-x: 20mm;
      --spacing-between: 24px;
    }

    * { box-sizing: border-box; }
    body {
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }

    .font-mono { font-family: 'JetBrains Mono', monospace; }

    /* Header Nav */
    .report-nav {
      background: rgba(14, 20, 36, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 1.25rem;
      z-index: 100;
    }

    .btn-nav-back {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid var(--border-accent);
      border-radius: 8px;
      padding: 0.4rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-nav-back:hover {
      background: #334155;
      color: #fff;
    }

    .btn-action-gold {
      background: var(--gold);
      color: #0f172a;
      border: none;
      border-radius: 8px;
      padding: 0.45rem 0.95rem;
      font-size: 0.8rem;
      font-weight: 700;
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-action-gold:hover {
      background: #f59e0b;
      color: #000;
    }

    .btn-action-whatsapp {
      background: #25D366;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0.45rem 0.95rem;
      font-size: 0.8rem;
      font-weight: 700;
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-action-whatsapp:hover {
      background: #20bd5a;
      color: #fff;
    }

    .btn-action-telegram {
      background: #229ED9;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0.45rem 0.95rem;
      font-size: 0.8rem;
      font-weight: 700;
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-action-telegram:hover {
      background: #1d8cc2;
      color: #fff;
    }

    .btn-action-outline {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border-accent);
      border-radius: 8px;
      padding: 0.45rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-action-outline:hover {
      background: rgba(255,255,255,0.05);
      color: #fff;
      border-color: #475569;
    }

    /* Editor Side Panel */
    .editor-container {
      padding: 1.5rem;
      max-width: 820px;
      margin: 0 auto;
    }

    .panel-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.25rem 1.4rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .panel-box-title {
      color: #38bdf8;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .form-label-custom {
      display: block;
      color: #94a3b8;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.35rem;
    }

    .form-input-custom, .form-select-custom {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--border-accent);
      background: var(--bg-input);
      color: #f1f5f9;
      font-size: 0.85rem;
      outline: none;
      transition: all 0.15s;
    }
    .form-input-custom:focus, .form-select-custom:focus {
      border-color: var(--gold);
      box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.15);
    }

    .layout-toggle-group {
      display: inline-flex;
      border: 1px solid var(--border-accent);
      border-radius: 10px;
      overflow: hidden;
    }
    .lt-btn {
      padding: 0.45rem 0.95rem;
      font-size: 0.76rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      background: var(--bg-surface);
      color: #94a3b8;
      transition: all 0.15s;
    }
    .lt-btn:hover { color: #fff; }
    .lt-btn.lt-active {
      background: var(--gold);
      color: #0f172a;
    }

    .casino-block {
      background: #10172b;
      border: 1px solid #25334d;
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      position: relative;
    }

    .month-subcard {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-bottom: 1rem;
      overflow: hidden;
    }
    .month-subcard-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: #090e1a;
      border-bottom: 1px solid var(--border-color);
    }

    .provider-row-box {
      background: #090e1a;
      border: 1px solid var(--border-color);
      border-radius: 9px;
      padding: 0.75rem;
      margin-bottom: 0.6rem;
    }

    .extra-item-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .btn-quick-tag {
      background: #172033;
      border: 1px solid #293852;
      color: #cbd5e1;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.25rem 0.55rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.12s;
    }
    .btn-quick-tag:hover {
      background: rgba(56, 189, 248, 0.15);
      border-color: #38bdf8;
      color: #38bdf8;
    }

    .btn-remove-row {
      background: none;
      border: none;
      color: #f43f5e;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0 0.35rem;
      line-height: 1;
      opacity: 0.75;
      transition: opacity 0.15s;
    }
    .btn-remove-row:hover { opacity: 1; }

    /* ══════════════════════════════════════════════════════ */
    /* A4 CANLI ÖNİZLEME & BASKI ALANI                        */
    /* ══════════════════════════════════════════════════════ */
    #previewWrapper {
      background: #475569;
      padding: 2rem 1rem 5rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    body.hide-brackets .bracket { display: none !important; }

    .print-page {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
      width: 100%;
    }
    .print-page:last-child { margin-bottom: 0; }

    .a4 {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      background: white;
      box-shadow: 0 10px 40px rgba(0,0,0,0.35);
      color: #1e293b;
      font-size: var(--font-size);
      line-height: var(--line-height);
    }

    .bracket { position: absolute; width: 38px; height: 38px; }
    .bracket-tl  { top: 14px; left: 14px; border-top: 2px solid #94a3b8; border-left: 2px solid #94a3b8; }
    .bracket-tl2 { top: 21px; left: 21px; border-top: 2px solid #cbd5e1; border-left: 2px solid #cbd5e1; }
    .bracket-tr  { top: 14px; right: 14px; border-top: 2px solid #94a3b8; border-right: 2px solid #94a3b8; }
    .bracket-tr2 { top: 21px; right: 21px; border-top: 2px solid #cbd5e1; border-right: 2px solid #cbd5e1; }
    .bracket-bl  { bottom: 14px; left: 14px; border-bottom: 2px solid #94a3b8; border-left: 2px solid #94a3b8; }
    .bracket-bl2 { bottom: 21px; left: 21px; border-bottom: 2px solid #cbd5e1; border-left: 2px solid #cbd5e1; }
    .bracket-br  { bottom: 14px; right: 14px; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; }
    .bracket-br2 { bottom: 21px; right: 21px; border-bottom: 2px solid #cbd5e1; border-right: 2px solid #cbd5e1; }

    .page-content { padding: var(--page-padding-y) var(--page-padding-x); }
    
    .month-caption {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
      color: #64748b; margin: 20px 0 8px;
    }

    .title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; }
    .casino-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin-bottom: 4px; }
    .main-title { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.3px; margin: 0; }
    .title-right { text-align: right; }
    .date-label { font-size: 11px; color: #64748b; font-weight: 600; margin-right: 6px; }
    .date-value { font-size: 11px; color: #1e293b; font-weight: 700; }
    .rate-info { font-size: 9px; color: #94a3b8; margin-top: 3px; font-weight: 600; }
    .page-index { font-size: 9px; color: #cbd5e1; margin-top: 2px; font-weight: 600; }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      font-size: inherit;
    }
    .upper-table { margin-bottom: var(--spacing-between); }

    .report-table th {
      padding: var(--table-padding-y) var(--table-padding-x);
      font-size: calc(var(--font-size) - 1px);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #334155;
      background: #f1f5f9;
      border-bottom: 2px solid #cbd5e1;
      border-right: 1px solid #cbd5e1;
    }
    .report-table th:last-child { border-right: none; }
    .komisyon-header, .dolar-header { background: #fbbf24 !important; color: #1e293b !important; font-weight: 900 !important; }

    .report-table td {
      padding: var(--table-padding-y) var(--table-padding-x);
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      color: #334155;
    }
    .report-table td:last-child { border-right: none; }
    .report-table tbody tr:last-child td { border-bottom: none; }

    .report-table tfoot td {
      padding: var(--table-padding-y) var(--table-padding-x);
      border-top: 2px solid #94a3b8;
      border-right: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #0f172a;
      font-weight: 800;
    }
    .report-table tfoot td:last-child { border-right: none; }

    .komisyon-cell { background: #fffbeb; color: #1e293b !important; font-size: 1.15em !important; }
    .row-alt td { background: #fafafa; }

    .text-left  { text-align: left; }
    .text-right { text-align: right; }
    .font-bold  { font-weight: 700; }

    @media print {
      @page { size: A4; margin: 0; }
      body { background: white !important; }
      .no-print { display: none !important; }
      #previewWrapper { padding: 0 !important; background: white !important; }
      .print-page { margin-bottom: 0 !important; break-after: page; }
      .print-page:last-child { break-after: auto; }
      .a4 { box-shadow: none !important; width: 100% !important; min-height: 100vh !important; }
    }
  </style>
</head>
<body>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- NAVBAR & TOP TOOLBAR                                   -->
  <!-- ══════════════════════════════════════════════════════ -->
  <header class="sticky-top report-nav no-print">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      
      <!-- Left: Logo & Back Button -->
      <div class="d-flex align-items-center gap-2.5">
        <a href="index.php" class="btn-nav-back">
          <i class="fa-solid fa-arrow-left"></i> <span>Ana Panel</span>
        </a>
        <div class="d-none d-sm-block">
          <h6 class="text-white fw-bold m-0" style="font-size: 0.88rem;">📄 Fee Rapor Oluşturucu</h6>
          <small class="text-secondary" style="font-size: 0.68rem;">Çoklu Ay & Çoklu İşletme Raporu</small>
        </div>
      </div>

      <!-- Center: Layout Mode Switcher -->
      <div class="d-flex align-items-center gap-2">
        <div class="layout-toggle-group">
          <button id="btnSeparate" class="lt-btn lt-active" onclick="setCombineMode('separate')">
            <i class="fa-solid fa-file me-1"></i> Ayrı Sayfalar
          </button>
          <button id="btnCombined" class="lt-btn" onclick="setCombineMode('combined')">
            <i class="fa-solid fa-files me-1"></i> Tek Sayfada Birleştir
          </button>
        </div>
      </div>

      <!-- Right: Action Buttons (Share, PDF, Excel) -->
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <button class="btn-action-outline" onclick="openSystemCasinoModal()" title="Sistemdeki Casinodan Veri Çek">
          <i class="fa-solid fa-cloud-arrow-down text-info"></i> <span class="d-none d-md-inline">Veri Çek</span>
        </button>

        <button class="btn-action-whatsapp" onclick="openWhatsAppShare()" title="WhatsApp'ta Paylaş">
          <i class="fa-brands fa-whatsapp fs-6"></i> <span>WhatsApp</span>
        </button>

        <button class="btn-action-telegram" onclick="openTelegramShare()" title="Telegram'da Paylaş">
          <i class="fa-brands fa-telegram fs-6"></i> <span>Telegram</span>
        </button>

        <button class="btn-action-gold" onclick="downloadPDF()" title="PDF Olarak İndir / Yazdır">
          <i class="fa-solid fa-print"></i> <span>PDF İndir</span>
        </button>
      </div>

    </div>
  </header>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- MAIN LAYOUT: EDITOR (LEFT/TOP) & PREVIEW (RIGHT/BOTTOM)-->
  <!-- ══════════════════════════════════════════════════════ -->
  <div class="container-fluid p-0 no-print">
    <div class="row g-0">
      
      <!-- ══ LEFT PANEL: EDITOR CONTROLS ══ -->
      <div class="col-12 col-xl-5" style="border-right: 1px solid var(--border-color); background: var(--bg-base); max-height: calc(100vh - 60px); overflow-y: auto;">
        <div class="editor-container">
          
          <!-- DÖVİZ KURLARI VE HIZLI AKSİYONLAR -->
          <div class="panel-box">
            <div class="panel-box-title">
              <span><i class="fa-solid fa-coins text-warning me-1.5"></i> Döviz Kurları & Veri</span>
              <button class="btn btn-sm btn-outline-info py-0.5 px-2" style="font-size: 0.7rem;" onclick="fetchRates()">
                <i class="fa-solid fa-rotate-right me-1"></i> Kuru Güncelle
              </button>
            </div>
            <div class="row g-2">
              <div class="col-6">
                <label class="form-label-custom">USD / TRY</label>
                <input type="text" id="usdRate" class="form-input-custom font-mono" placeholder="0,00" oninput="updateGlobal('usdRate', this.value)">
              </div>
              <div class="col-6">
                <label class="form-label-custom">EUR / TRY</label>
                <input type="text" id="eurRate" class="form-input-custom font-mono" placeholder="0,00" oninput="updateGlobal('eurRate', this.value)">
              </div>
            </div>
          </div>

          <!-- SAYFA TASARIMI VE BOŞLUK AYARLARI -->
          <div class="panel-box">
            <div class="panel-box-title">
              <span><i class="fa-solid fa-sliders text-info me-1.5"></i> Sayfa Tasarımı & Boşluk Ayarları</span>
            </div>
            
            <div class="row g-2 mb-3">
              <div class="col-7">
                <label class="form-label-custom">Hazır Şablon (Preset)</label>
                <select id="presetSelect" class="form-select-custom" onchange="applyPreset(this.value)">
                  <option value="default">Varsayılan (Dengeli)</option>
                  <option value="compact">Sıkışık / Dar (Tek Sayfaya Sığdır)</option>
                  <option value="spacious">Geniş / Rahat</option>
                  <option value="custom" disabled>Özel (Kullanıcı Ayarlı)</option>
                </select>
              </div>
              <div class="col-5 d-flex align-items-end pb-1">
                <label class="form-check-label d-flex align-items-center gap-1.5 text-secondary" style="font-size: 0.74rem; cursor: pointer;">
                  <input type="checkbox" id="chkBrackets" checked onchange="toggleBrackets(this.checked)" class="form-check-input mt-0">
                  Baskı Köşe Çizgileri
                </label>
              </div>
            </div>

            <div class="row g-2">
              <div class="col-4">
                <label class="form-label-custom">Yazı: <span id="val-font-size" class="text-white">11px</span></label>
                <input type="range" class="form-range" id="slide-font-size" min="8" max="16" value="11" step="0.5" oninput="updateStyleVar('--font-size', this.value + 'px')">
              </div>
              <div class="col-4">
                <label class="form-label-custom">Satır: <span id="val-line-height" class="text-white">1.5</span></label>
                <input type="range" class="form-range" id="slide-line-height" min="1.0" max="2.0" value="1.5" step="0.1" oninput="updateStyleVar('--line-height', this.value)">
              </div>
              <div class="col-4">
                <label class="form-label-custom">Hücre Payı: <span id="val-table-padding-y" class="text-white">9px</span></label>
                <input type="range" class="form-range" id="slide-table-padding-y" min="2" max="16" value="9" oninput="updateStyleVar('--table-padding-y', this.value + 'px')">
              </div>
            </div>

            <div class="row g-2 mt-1">
              <div class="col-4">
                <label class="form-label-custom">Kenar Dikey: <span id="val-page-padding-y" class="text-white">22mm</span></label>
                <input type="range" class="form-range" id="slide-page-padding-y" min="5" max="40" value="22" oninput="updateStyleVar('--page-padding-y', this.value + 'mm')">
              </div>
              <div class="col-4">
                <label class="form-label-custom">Kenar Yatay: <span id="val-page-padding-x" class="text-white">20mm</span></label>
                <input type="range" class="form-range" id="slide-page-padding-x" min="5" max="40" value="20" oninput="updateStyleVar('--page-padding-x', this.value + 'mm')">
              </div>
              <div class="col-4">
                <label class="form-label-custom">Tablo Arası: <span id="val-spacing-between" class="text-white">24px</span></label>
                <input type="range" class="form-range" id="slide-spacing-between" min="4" max="40" value="24" oninput="updateStyleVar('--spacing-between', this.value + 'px')">
              </div>
            </div>
          </div>

          <!-- İŞLETMELER LİSTESİ -->
          <div id="casinosContainer"></div>

          <!-- ALT İŞLETME EKLE BUTONU -->
          <div class="d-flex align-items-center justify-content-between gap-2 mt-3 mb-5">
            <button class="btn btn-outline-info w-100 py-2.5 rounded-3 fw-bold" onclick="addCasino()">
              <i class="fa-solid fa-plus me-1"></i> Yeni İşletme Ekle
            </button>
            <button class="btn btn-outline-secondary py-2.5 px-3 rounded-3" onclick="resetAllData()" title="Taslağı Sıfırla">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>

        </div>
      </div>

      <!-- ══ RIGHT PANEL: LIVE A4 PREVIEW ══ -->
      <div class="col-12 col-xl-7">
        <div id="previewWrapper">
          <div id="previewContent"></div>
        </div>
      </div>

    </div>
  </div>

  <!-- PRINT ONLY PREVIEW CONTAINER -->
  <div id="printOnlyArea" class="d-none"></div>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- SISTEMDEN CASINO ÇEKME MODALI                          -->
  <!-- ══════════════════════════════════════════════════════ -->
  <div class="modal fade" id="systemCasinoModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="background: #0e1424; border: 1px solid var(--border-accent); border-radius: 14px; color: #fff;">
        <div class="modal-header border-bottom" style="border-color: var(--border-color) !important;">
          <h6 class="modal-title fw-bold"><i class="fa-solid fa-cloud-arrow-down text-info me-2"></i> Sistemdeki Casinodan Veri Çek</h6>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-3.5">
          <div class="mb-3">
            <label class="form-label-custom">Casino Seçin</label>
            <select class="form-select-custom py-2" id="importCasinoSelect">
              <option value="">Yükleniyor...</option>
            </select>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label-custom">Yıl</label>
              <select class="form-select-custom py-2" id="importYearSelect">
                <option value="2026" selected>2026</option>
                <option value="2025">2025</option>
                <option value="2027">2027</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label-custom">Ay</label>
              <select class="form-select-custom py-2" id="importMonthSelect">
                <option value="all">Tüm Aylar</option>
                <option value="1">Ocak</option>
                <option value="2">Şubat</option>
                <option value="3">Mart</option>
                <option value="4">Nisan</option>
                <option value="5">Mayıs</option>
                <option value="6">Haziran</option>
                <option value="7">Temmuz</option>
                <option value="8">Ağustos</option>
                <option value="9">Eylül</option>
                <option value="10">Ekim</option>
                <option value="11">Kasım</option>
                <option value="12">Aralık</option>
              </select>
            </div>
          </div>
          <p class="text-secondary small m-0" style="font-size: 0.72rem;">
            * Seçilen casinonun borç kalemleri, komisyon oranları ve mevcut verileri raporda yeni bir işletme olarak içe aktarılır.
          </p>
        </div>
        <div class="modal-footer border-top" style="border-color: var(--border-color) !important;">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">İptal</button>
          <button type="button" class="btn btn-info btn-sm fw-bold" onclick="executeImportCasino()">İçe Aktar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- JAVASCRIPT SYSTEM                                      -->
  <!-- ══════════════════════════════════════════════════════ -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

    const PRESETS = {
      default: {
        '--font-size': '11px',
        '--line-height': '1.5',
        '--table-padding-y': '9px',
        '--table-padding-x': '12px',
        '--page-padding-y': '22mm',
        '--page-padding-x': '20mm',
        '--spacing-between': '24px'
      },
      compact: {
        '--font-size': '9px',
        '--line-height': '1.2',
        '--table-padding-y': '4px',
        '--table-padding-x': '8px',
        '--page-padding-y': '12mm',
        '--page-padding-x': '12mm',
        '--spacing-between': '10px'
      },
      spacious: {
        '--font-size': '13px',
        '--line-height': '1.7',
        '--table-padding-y': '12px',
        '--table-padding-x': '16px',
        '--page-padding-y': '28mm',
        '--page-padding-x': '26mm',
        '--spacing-between': '35px'
      }
    };

    function uid() { return Math.random().toString(36).slice(2, 10); }
    function parseNum(s) { return parseFloat(String(s || '').replace(/\./g, '').replace(',', '.')) || 0; }
    function fmt(n) { return (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function fmtUSD(n) { return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
    function todayStr() { return new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }); }

    function defaultRows() {
      return [
        { kategori: 'Live Slots', saglayici: 'EGT', bet: '', win: '' },
        { kategori: 'Live Slots', saglayici: 'APEX', bet: '', win: '' },
      ];
    }

    const now = new Date();
    let curY = now.getFullYear(), curM = now.getMonth() + 1;
    let prevY = curY, prevM = curM - 1;
    if (prevM === 0) { prevM = 12; prevY -= 1; }

    const INITIAL_STATE = {
      usdRate: '<?= number_format($rates['usd'], 2, ',', '.') ?>',
      eurRate: '<?= number_format($rates['eur'], 2, ',', '.') ?>',
      combineMode: 'separate',
      casinos: [
        {
          id: uid(),
          name: '',
          months: [
            { id: uid(), year: prevY, month: prevM, feeType: 'percent', feeRate: '6.0', feeFixed: '', rows: defaultRows(), extras: [] },
            { id: uid(), year: curY, month: curM, feeType: 'percent', feeRate: '6.0', feeFixed: '', rows: defaultRows(), extras: [] },
          ]
        }
      ]
    };

    let state = INITIAL_STATE;

    // LocalStorage Draft Management
    function loadSavedState() {
      try {
        const saved = localStorage.getItem('ct_report_generator_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.casinos) && parsed.casinos.length > 0) {
            state = parsed;
          }
        }
      } catch (e) {}
    }

    function saveState() {
      try {
        localStorage.setItem('ct_report_generator_draft', JSON.stringify(state));
      } catch (e) {}
    }

    function resetAllData() {
      Swal.fire({
        title: 'Taslak Sıfırlansın mı?',
        text: 'Tüm girilen veriler temizlenecektir.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Evet, Sıfırla',
        cancelButtonText: 'İptal',
        confirmButtonColor: '#f43f5e',
        cancelButtonColor: '#334155'
      }).then((r) => {
        if (r.isConfirmed) {
          localStorage.removeItem('ct_report_generator_draft');
          state = JSON.parse(JSON.stringify(INITIAL_STATE));
          init();
          Swal.fire({ icon: 'success', title: 'Sıfırlandı', timer: 700, showConfirmButton: false });
        }
      });
    }

    // Styles & Preset Handlers
    function updateStyleVar(key, val) {
      document.documentElement.style.setProperty(key, val);
      const labelId = 'val-' + key.replace('--', '');
      const el = document.getElementById(labelId);
      if (el) el.textContent = val;
      document.getElementById('presetSelect').value = 'custom';
      renderPreview();
    }

    function applyPreset(name) {
      const vals = PRESETS[name];
      if (!vals) return;
      for (const [key, val] of Object.entries(vals)) {
        document.documentElement.style.setProperty(key, val);
        const sliderId = 'slide-' + key.replace('--', '');
        const slider = document.getElementById(sliderId);
        if (slider) slider.value = parseFloat(val);
        const labelId = 'val-' + key.replace('--', '');
        const el = document.getElementById(labelId);
        if (el) el.textContent = val;
      }
      renderPreview();
    }

    function toggleBrackets(visible) {
      document.body.classList.toggle('hide-brackets', !visible);
    }

    function setCombineMode(mode) {
      state.combineMode = mode;
      document.getElementById('btnSeparate').classList.toggle('lt-active', mode === 'separate');
      document.getElementById('btnCombined').classList.toggle('lt-active', mode === 'combined');
      saveState();
      renderPreview();
    }

    function updateGlobal(field, value) {
      state[field] = value;
      saveState();
      renderPreview();
    }

    // Casino & Month State Handlers
    function addCasino() {
      state.casinos.push({
        id: uid(),
        name: '',
        months: [
          { id: uid(), year: prevY, month: prevM, feeType: 'percent', feeRate: '6.0', feeFixed: '', rows: defaultRows(), extras: [] },
          { id: uid(), year: curY, month: curM, feeType: 'percent', feeRate: '6.0', feeFixed: '', rows: defaultRows(), extras: [] },
        ]
      });
      saveState();
      renderEditor();
      renderPreview();
    }

    function removeCasino(id) {
      if (state.casinos.length <= 1) {
        Swal.fire({ icon: 'info', title: 'En az bir işletme kalmalıdır.' });
        return;
      }
      state.casinos = state.casinos.filter(c => c.id !== id);
      saveState();
      renderEditor();
      renderPreview();
    }

    function updateCasinoName(id, value) {
      const c = state.casinos.find(x => x.id === id);
      if (c) c.name = value;
      saveState();
      renderPreview();
    }

    function addMonth(casinoId) {
      const c = state.casinos.find(x => x.id === casinoId);
      if (!c) return;
      const last = c.months[c.months.length - 1];
      let y = last ? last.year : curY, mo = last ? last.month + 1 : curM;
      if (mo > 12) { mo = 1; y += 1; }
      c.months.push({ id: uid(), year: y, month: mo, feeType: last ? last.feeType : 'percent', feeRate: last ? last.feeRate : '6.0', feeFixed: '', rows: defaultRows(), extras: [] });
      saveState();
      renderEditor();
      renderPreview();
    }

    function removeMonth(casinoId, monthId) {
      const c = state.casinos.find(x => x.id === casinoId);
      if (!c) return;
      if (c.months.length <= 1) {
        Swal.fire({ icon: 'info', title: 'İşletmede en az bir ay kalmalıdır.' });
        return;
      }
      c.months = c.months.filter(m => m.id !== monthId);
      saveState();
      renderEditor();
      renderPreview();
    }

    function updateMonthField(casinoId, monthId, field, value) {
      const c = state.casinos.find(x => x.id === casinoId);
      if (!c) return;
      const m = c.months.find(x => x.id === monthId);
      if (!m) return;
      m[field] = field === 'year' || field === 'month' ? parseInt(value) || 0 : value;
      saveState();
      renderEditor();
      renderPreview();
    }

    function addRow(casinoId, monthId, defaultProvider = '') {
      const c = state.casinos.find(x => x.id === casinoId);
      if (!c) return;
      const m = c.months.find(x => x.id === monthId);
      if (!m) return;
      m.rows.push({ kategori: 'Live Slots', saglayici: defaultProvider, bet: '', win: '' });
      saveState();
      renderEditor();
      renderPreview();
    }

    function removeRow(casinoId, monthId, idx) {
      const c = state.casinos.find(x => x.id === casinoId);
      if (!c) return;
      const m = c.months.find(x => x.id === monthId);
      if (!m) return;
      m.rows.splice(idx, 1);
      saveState();
      renderEditor();
      renderPreview();
    }

    function updateRowField(casinoId, monthId, idx, field, value) {
      const c = state.casinos.find(x => x.id === casinoId);
      if (!c) return;
      const m = c.months.find(x => x.id === monthId);
      if (!m || !m.rows[idx]) return;
      m.rows[idx][field] = value;
      saveState();
      renderPreview();
    }

    function addExtra(casinoId, monthId, defaultName = '', defaultCur = 'TRY') {
      const c = state.casinos.find(x => x.id === casinoId);
      if (!c) return;
      const m = c.months.find(x => x.id === monthId);
      if (!m) return;
      m.extras.push({ name: defaultName, amount: '', currency: defaultCur });
      saveState();
      renderEditor();
      renderPreview();
    }

    function removeExtra(casinoId, monthId, idx) {
      const c = state.casinos.find(x => x.id === casinoId);
      if (!c) return;
      const m = c.months.find(x => x.id === monthId);
      if (!m) return;
      m.extras.splice(idx, 1);
      saveState();
      renderEditor();
      renderPreview();
    }

    function updateExtraField(casinoId, monthId, idx, field, value) {
      const c = state.casinos.find(x => x.id === casinoId);
      if (!c) return;
      const m = c.months.find(x => x.id === monthId);
      if (!m || !m.extras[idx]) return;
      m.extras[idx][field] = value;
      saveState();
      renderPreview();
    }

    // Exchange Rates API
    async function fetchRates() {
      Swal.fire({ title: 'Kurlar Çekiliyor...', didOpen: () => Swal.showLoading() });
      try {
        const res = await fetch('https://api.frankfurter.app/latest?base=EUR&symbols=TRY,USD');
        const data = await res.json();
        const tryPerEur = data.rates.TRY;
        const usdPerEur = data.rates.USD;
        const tryPerUsd = tryPerEur / usdPerEur;
        state.usdRate = fmt(tryPerUsd);
        state.eurRate = fmt(tryPerEur);
        document.getElementById('usdRate').value = state.usdRate;
        document.getElementById('eurRate').value = state.eurRate;
        saveState();
        renderPreview();
        Swal.fire({ icon: 'success', title: 'Kurlar Güncellendi', text: `1 USD = ${state.usdRate}₺ | 1 EUR = ${state.eurRate}₺`, timer: 1500, showConfirmButton: false });
      } catch (e) {
        Swal.fire({ icon: 'warning', title: 'TCMB / API Bağlantı Hatası', text: 'Kurları elle güncelleyebilirsiniz.' });
      }
    }

    // Render Editor Form
    function renderEditor() {
      const c = document.getElementById('casinosContainer');
      const quickProviders = ['EGT', 'APEX', 'PRAGMATIC', 'NETENT', 'EVOLUTION', 'HACKSAW'];
      const quickExtras = [
        { name: 'SERVER ÜCRETİ', cur: 'EUR' },
        { name: 'MAKİNA KİRASI', cur: 'EUR' },
        { name: 'DEPOZİTO', cur: 'EUR' },
        { name: 'RTP', cur: 'EUR' },
        { name: 'SABİT-FEE', cur: 'USD' }
      ];

      c.innerHTML = state.casinos.map((casino, cIdx) => `
        <div class="casino-block">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <span class="fw-bold text-info" style="font-size: 0.85rem;">
              <i class="fa-solid fa-building me-1.5"></i> İŞLETME #${cIdx + 1}
            </span>
            ${state.casinos.length > 1 ? `
              <button class="btn btn-outline-danger btn-sm py-0.5 px-2" style="font-size: 0.7rem;" onclick="removeCasino('${casino.id}')">
                <i class="fa-solid fa-trash me-1"></i> İşletmeyi Sil
              </button>
            ` : ''}
          </div>

          <div class="mb-3">
            <label class="form-label-custom">İşletme / Casino Adı</label>
            <input type="text" class="form-input-custom fw-bold" value="${casino.name}" placeholder="Örn: 724-SLOT" oninput="updateCasinoName('${casino.id}', this.value)">
          </div>

          <!-- Aylar Listesi -->
          <div class="months-container">
            ${casino.months.map((m, i) => `
              <div class="month-subcard">
                <div class="month-subcard-head">
                  <span class="fw-bold" style="color: var(--gold); font-size: 0.82rem;">
                    📅 ${MONTHS[m.month]} ${m.year}
                  </span>
                  <button class="btn btn-link text-danger p-0 text-decoration-none" style="font-size: 0.72rem;" onclick="removeMonth('${casino.id}', '${m.id}')">
                    <i class="fa-solid fa-xmark"></i> Ayı Kaldır
                  </button>
                </div>
                <div class="p-3">
                  
                  <div class="row g-2 mb-3">
                    <div class="col-4">
                      <label class="form-label-custom">Yıl</label>
                      <input type="number" class="form-input-custom font-mono" value="${m.year}" onchange="updateMonthField('${casino.id}', '${m.id}','year',this.value)">
                    </div>
                    <div class="col-4">
                      <label class="form-label-custom">Ay</label>
                      <select class="form-select-custom" onchange="updateMonthField('${casino.id}', '${m.id}','month',this.value)">
                        ${MONTHS.slice(1).map((name, idx) => `<option value="${idx + 1}" ${m.month === idx + 1 ? 'selected' : ''}>${name}</option>`).join('')}
                      </select>
                    </div>
                    <div class="col-4">
                      <label class="form-label-custom">Komisyon Türü</label>
                      <select class="form-select-custom" onchange="updateMonthField('${casino.id}', '${m.id}','feeType',this.value)">
                        <option value="percent" ${m.feeType === 'percent' ? 'selected' : ''}>Yüzde (%)</option>
                        <option value="fixed" ${m.feeType === 'fixed' ? 'selected' : ''}>Sabit Tutar</option>
                        <option value="none" ${m.feeType === 'none' ? 'selected' : ''}>Yok</option>
                      </select>
                    </div>
                  </div>

                  ${m.feeType === 'percent' ? `
                    <div class="mb-3">
                      <label class="form-label-custom">Komisyon Oranı (%)</label>
                      <input type="text" inputmode="decimal" class="form-input-custom font-mono" value="${m.feeRate}" placeholder="6.0" oninput="updateMonthField('${casino.id}', '${m.id}','feeRate',this.value)">
                    </div>
                  ` : ''}

                  ${m.feeType === 'fixed' ? `
                    <div class="mb-3">
                      <label class="form-label-custom">Sabit Tutar (TRY)</label>
                      <input type="text" inputmode="decimal" class="form-input-custom font-mono" value="${m.feeFixed}" placeholder="0,00" oninput="updateMonthField('${casino.id}', '${m.id}','feeFixed',this.value)">
                    </div>
                  ` : ''}

                  <!-- Sağlayıcılar -->
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="form-label-custom m-0">Sağlayıcı Verileri (Bet / Win)</span>
                    <button class="btn btn-sm btn-outline-info py-0.5 px-2" style="font-size: 0.68rem;" onclick="addRow('${casino.id}', '${m.id}')">
                      + Satır Ekle
                    </button>
                  </div>

                  <!-- Hızlı Sağlayıcı Butonları -->
                  <div class="d-flex gap-1 flex-wrap mb-2">
                    ${quickProviders.map(p => `
                      <button class="btn-quick-tag" onclick="addRow('${casino.id}', '${m.id}', '${p}')">+ ${p}</button>
                    `).join('')}
                  </div>

                  ${m.rows.map((r, idx) => `
                    <div class="provider-row-box">
                      <div class="d-flex align-items-center gap-2 mb-2">
                        <input type="text" class="form-input-custom py-1" value="${r.kategori}" placeholder="Kategori" style="flex:1" oninput="updateRowField('${casino.id}', '${m.id}',${idx},'kategori',this.value)">
                        <input type="text" class="form-input-custom py-1 fw-bold" value="${r.saglayici}" placeholder="Sağlayıcı" style="flex:1" oninput="updateRowField('${casino.id}', '${m.id}',${idx},'saglayici',this.value)">
                        <button class="btn-remove-row" onclick="removeRow('${casino.id}', '${m.id}',${idx})">×</button>
                      </div>
                      <div class="row g-2">
                        <div class="col-6">
                          <label class="form-label-custom" style="font-size: 0.65rem;">Toplam Bet (TRY)</label>
                          <input type="text" inputmode="decimal" class="form-input-custom font-mono py-1" value="${r.bet}" placeholder="0,00" oninput="updateRowField('${casino.id}', '${m.id}',${idx},'bet',this.value)">
                        </div>
                        <div class="col-6">
                          <label class="form-label-custom" style="font-size: 0.65rem;">Toplam Win (TRY)</label>
                          <input type="text" inputmode="decimal" class="form-input-custom font-mono py-1" value="${r.win}" placeholder="0,00" oninput="updateRowField('${casino.id}', '${m.id}',${idx},'win',this.value)">
                        </div>
                      </div>
                    </div>
                  `).join('')}

                  <!-- Ekstra Kalemler -->
                  <div class="d-flex align-items-center justify-content-between mt-3 mb-2">
                    <span class="form-label-custom m-0">Ekstra Borç Kalemleri</span>
                    <button class="btn btn-sm btn-outline-warning py-0.5 px-2" style="font-size: 0.68rem;" onclick="addExtra('${casino.id}', '${m.id}')">
                      + Kalem Ekle
                    </button>
                  </div>

                  <!-- Hızlı Kalem Butonları -->
                  <div class="d-flex gap-1 flex-wrap mb-2">
                    ${quickExtras.map(ex => `
                      <button class="btn-quick-tag" onclick="addExtra('${casino.id}', '${m.id}', '${ex.name}', '${ex.cur}')">+ ${ex.name}</button>
                    `).join('')}
                  </div>

                  ${m.extras.map((ex, idx) => `
                    <div class="extra-item-row">
                      <input type="text" class="form-input-custom py-1" value="${ex.name}" placeholder="Kalem Adı" style="flex:2;" oninput="updateExtraField('${casino.id}', '${m.id}',${idx},'name',this.value)">
                      <input type="text" inputmode="decimal" class="form-input-custom font-mono py-1" value="${ex.amount}" placeholder="Tutar" style="flex:1.2;" oninput="updateExtraField('${casino.id}', '${m.id}',${idx},'amount',this.value)">
                      <select class="form-select-custom py-1 font-mono" style="width: 85px;" onchange="updateExtraField('${casino.id}', '${m.id}',${idx},'currency',this.value)">
                        <option ${ex.currency === 'TRY' ? 'selected' : ''}>TRY</option>
                        <option ${ex.currency === 'USD' ? 'selected' : ''}>USD</option>
                        <option ${ex.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                      </select>
                      <button class="btn-remove-row" onclick="removeExtra('${casino.id}', '${m.id}',${idx})">×</button>
                    </div>
                  `).join('')}

                </div>
              </div>
            `).join('')}
          </div>

          <div class="text-center mt-2">
            <button class="btn btn-sm btn-outline-warning py-1.5 px-3 rounded-2 fw-semibold" onclick="addMonth('${casino.id}')">
              <i class="fa-solid fa-calendar-plus me-1"></i> Yeni Ay Ekle
            </button>
          </div>

        </div>
      `).join('');
    }

    // Mathematical Calculation
    function toUSD(item, usdRate, eurRate) {
      if (item.currency === 'USD') return parseNum(item.amount);
      if (item.currency === 'EUR') return usdRate ? (parseNum(item.amount) * eurRate) / usdRate : 0;
      return usdRate ? parseNum(item.amount) / usdRate : 0;
    }

    function computeMonthTotals(m, usdRate, eurRate) {
      const rows = m.rows.map(r => ({ ...r, bet: parseNum(r.bet), win: parseNum(r.win) }));
      const totalBet = rows.reduce((s, r) => s + r.bet, 0);
      const totalWin = rows.reduce((s, r) => s + r.win, 0);
      const totalNet = totalWin - totalBet;
      const feeRate = parseNum(m.feeRate);
      const feeFixed = parseNum(m.feeFixed);
      const komisyonTRY = m.feeType === 'percent' ? Math.abs(totalNet) * feeRate / 100 : m.feeType === 'fixed' ? feeFixed : 0;
      const komisyonUSD = usdRate ? komisyonTRY / usdRate : 0;
      const komisyonLabel = m.feeType === 'percent' ? `Komisyon %${feeRate || 0}` : m.feeType === 'fixed' ? 'Komisyon (Sabit)' : null;
      const extrasUSD = m.extras.map(ex => toUSD(ex, usdRate, eurRate));
      const totalUSD = komisyonUSD + extrasUSD.reduce((s, v) => s + v, 0);
      return { rows, totalBet, totalWin, totalNet, komisyonTRY, komisyonUSD, komisyonLabel, extrasUSD, totalUSD };
    }

    function extraAmountLabel(ex) {
      const n = parseNum(ex.amount);
      return ex.currency === 'TRY' ? `${fmt(n)}₺` : ex.currency === 'EUR' ? `${fmt(n)}€` : `${fmtUSD(n)}$`;
    }

    function titleRowHTML(casinoName, subtitle, dateStr, usdRate, pageIndexText) {
      return `
        <div class="title-row">
          <div>
            <p class="casino-label">${casinoName}${subtitle ? ' — ' + subtitle : ''}</p>
            <h1 class="main-title">Ödeme ve Ek Talep Detayı</h1>
          </div>
          <div class="title-right">
            <span class="date-label">Rapor Tarihi:</span>
            <span class="date-value">${dateStr}</span>
            ${usdRate ? `<p class="rate-info">1 USD = ₺${fmt(usdRate)}</p>` : ''}
            ${pageIndexText ? `<p class="page-index">${pageIndexText}</p>` : ''}
          </div>
        </div>
      `;
    }

    function upperTableHTML(t, caption) {
      if (t.rows.length === 0) return '';
      return `
        ${caption ? `<p class="month-caption">${caption}</p>` : ''}
        <table class="report-table upper-table">
          <thead>
            <tr>
              <th class="text-left">Kategori</th>
              <th class="text-left">Sağlayıcı</th>
              <th class="text-right">Toplam Bet (TRY)</th>
              <th class="text-right">Toplam Win (TRY)</th>
              <th class="text-right">Net Kar / Zarar (W/L)</th>
              ${t.komisyonLabel ? `<th class="text-right komisyon-header">${t.komisyonLabel}</th>` : ''}
            </tr>
          </thead>
          <tbody>
            ${t.rows.map((row, idx) => {
              const net = row.win - row.bet;
              return `
              <tr class="${idx % 2 === 1 ? 'row-alt' : ''}">
                <td>${row.kategori || '—'}</td>
                <td class="font-bold">${row.saglayici || '—'}</td>
                <td class="text-right font-mono">${row.bet ? fmt(row.bet) : '—'}</td>
                <td class="text-right font-mono">${row.win ? fmt(row.win) : '—'}</td>
                <td class="text-right font-mono" style="color:${net < 0 ? '#dc2626' : '#16a34a'}">${row.bet || row.win ? fmt(net) : '—'}</td>
                ${t.komisyonLabel ? '<td></td>' : ''}
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td class="font-bold">TOPLAM</td>
              <td class="font-bold">Live Slots</td>
              <td class="text-right font-bold font-mono">${fmt(t.totalBet)}</td>
              <td class="text-right font-bold font-mono">${fmt(t.totalWin)}</td>
              <td class="text-right font-bold font-mono" style="color:${t.totalNet < 0 ? '#dc2626' : '#16a34a'}">${fmt(t.totalNet)}</td>
              ${t.komisyonLabel ? `
              <td class="text-right font-bold komisyon-cell font-mono">
                <span style="display:block">${fmt(t.komisyonTRY)}₺</span>
                <span style="display:block;font-size:11px;color:#64748b">${fmtUSD(t.komisyonUSD)}$</span>
              </td>` : ''}
            </tr>
          </tfoot>
        </table>
      `;
    }

    function lowerTableHTML(rowsHTML, totalUSD, totalLabel) {
      return `
        <table class="report-table lower-table">
          <thead>
            <tr>
              <th class="text-left">Kategori</th>
              <th class="text-right"></th>
              <th class="text-right dolar-header">DOLAR TUTARI</th>
            </tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
          <tfoot>
            <tr>
              <td class="font-bold">${totalLabel || 'GENEL TOPLAM'}</td>
              <td></td>
              <td class="text-right font-bold font-mono">${fmtUSD(totalUSD)}$</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    function a4Wrapper(innerHTML) {
      return `
        <div class="print-page">
          <div class="a4">
            <div class="bracket bracket-tl"></div>
            <div class="bracket bracket-tl2"></div>
            <div class="bracket bracket-tr"></div>
            <div class="bracket bracket-tr2"></div>
            <div class="bracket bracket-bl"></div>
            <div class="bracket bracket-bl2"></div>
            <div class="bracket bracket-br"></div>
            <div class="bracket bracket-br2"></div>
            <div class="page-content">${innerHTML}</div>
          </div>
        </div>
      `;
    }

    // Render Preview
    function renderPreview() {
      const usdRate = parseNum(state.usdRate);
      const eurRate = parseNum(state.eurRate);
      const dateStr = todayStr();

      if (state.combineMode === 'combined') {
        const casinoNames = state.casinos.map(c => c.name || 'İşletme').filter(Boolean).join(' & ') || 'İşletmeler';
        let inner = titleRowHTML(casinoNames, 'Konsolide Rapor', dateStr, usdRate, null);
        let lowerRows = '';
        let grandTotalUSD = 0;

        state.casinos.forEach(casino => {
          const cName = casino.name || 'İşletme';
          
          inner += `
            <div style="margin-top: 18px; margin-bottom: 8px; border-bottom: 2px solid #334155; padding-bottom: 3px;">
              <h2 style="font-size: 12px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0;">🏢 ${cName}</h2>
            </div>
          `;

          casino.months.forEach(m => {
            const t = computeMonthTotals(m, usdRate, eurRate);
            const caption = `${MONTHS[m.month]} ${m.year}`;
            inner += upperTableHTML(t, caption);

            if (t.komisyonLabel) {
              lowerRows += `
                <tr>
                  <td>${cName} - Live Slot Komisyon — ${caption}</td>
                  <td class="text-right font-mono">${fmt(t.komisyonTRY)}₺</td>
                  <td class="text-right font-bold font-mono">${fmtUSD(t.komisyonUSD)}$</td>
                </tr>`;
              grandTotalUSD += t.komisyonUSD;
            }
            m.extras.forEach((ex, idx) => {
              const usd = toUSD(ex, usdRate, eurRate);
              lowerRows += `
                <tr class="${idx % 2 === 0 ? 'row-alt' : ''}">
                  <td>${cName} - ${ex.name || '—'} <span style="color:#94a3b8;font-weight:400">(${caption})</span></td>
                  <td class="text-right font-mono">${extraAmountLabel(ex)}</td>
                  <td class="text-right font-bold font-mono">${fmtUSD(usd)}$</td>
                </tr>`;
              grandTotalUSD += usd;
            });
          });
        });

        inner += `<p class="month-caption" style="margin-top: 22px;">GENEL ÖDEME VE EK TALEP DETAYLARI</p>`;
        inner += lowerTableHTML(lowerRows, grandTotalUSD, 'GENEL TOPLAM');
        document.getElementById('previewContent').innerHTML = a4Wrapper(inner);
      } else {
        let pagesHTML = [];
        let pageCount = 0;
        state.casinos.forEach(c => { pageCount += c.months.length; });

        let pageIdx = 1;
        state.casinos.forEach(casino => {
          const cName = casino.name || 'İşletme';
          
          casino.months.forEach(m => {
            const t = computeMonthTotals(m, usdRate, eurRate);
            const caption = `${MONTHS[m.month]} ${m.year}`;

            let lowerRows = '';
            if (t.komisyonLabel) {
              lowerRows += `
                <tr>
                  <td>Live Slot Komisyon</td>
                  <td class="text-right font-mono">${fmt(t.komisyonTRY)}₺</td>
                  <td class="text-right font-bold font-mono">${fmtUSD(t.komisyonUSD)}$</td>
                </tr>`;
            }
            m.extras.forEach((ex, idx) => {
              lowerRows += `
                <tr class="${idx % 2 === 0 ? 'row-alt' : ''}">
                  <td>${ex.name || '—'}</td>
                  <td class="text-right font-mono">${extraAmountLabel(ex)}</td>
                  <td class="text-right font-bold font-mono">${fmtUSD(toUSD(ex, usdRate, eurRate))}$</td>
                </tr>`;
            });

            const inner = titleRowHTML(cName, caption, dateStr, usdRate, `Sayfa ${pageIdx} / ${pageCount}`)
              + upperTableHTML(t, null)
              + lowerTableHTML(lowerRows, t.totalUSD, null);
            
            pagesHTML.push(a4Wrapper(inner));
            pageIdx++;
          });
        });
        
        document.getElementById('previewContent').innerHTML = pagesHTML.join('');
      }
    }

    // ══════════════════════════════════════════════════════
    // SİSTEMDEN CASINO İÇE AKTARMA (IMPORT)
    // ══════════════════════════════════════════════════════
    let systemCasinos = [];

    async function openSystemCasinoModal() {
      const select = document.getElementById('importCasinoSelect');
      select.innerHTML = '<option value="">Casinolar yükleniyor...</option>';
      const modal = new bootstrap.Modal(document.getElementById('systemCasinoModal'));
      modal.show();

      try {
        const res = await fetch('api.php?action=get_reports&year=' + new Date().getFullYear());
        const data = await res.json();
        if (data.success && Array.isArray(data.casinos)) {
          systemCasinos = data.casinos;
          select.innerHTML = systemCasinos.map(c => `
            <option value="${c.id}">${c.name} (${c.fee_type === 'percent' ? '%' + c.fee_rate : (c.fee_type === 'fixed' ? 'Sabit' : 'Fee Yok')})</option>
          `).join('');
        }
      } catch (e) {
        select.innerHTML = '<option value="">Yükleme başarısız</option>';
      }
    }

    async function executeImportCasino() {
      const casinoId = document.getElementById('importCasinoSelect').value;
      const year = parseInt(document.getElementById('importYearSelect').value) || 2026;
      const monthVal = document.getElementById('importMonthSelect').value;

      if (!casinoId) return;

      Swal.fire({ title: 'Casino Verileri Alınıyor...', didOpen: () => Swal.showLoading() });

      try {
        const res = await fetch(`api.php?action=get_profile&casino_id=${casinoId}`);
        const data = await res.json();
        if (!data.success) throw new Error('Veri alınamadı');

        const c = data.casino;
        const feeRows = data.fee_rows || [];

        // Filtreye göre ayları oluştur
        const targetMonths = [];
        if (monthVal === 'all') {
          // Dolu olan ayları veya 12 ayı yükle
          const activeRows = feeRows.filter(r => r.year === year && ((r.turnover || 0) > 0 || (r.debt_items && r.debt_items.length > 0)));
          if (activeRows.length > 0) {
            activeRows.forEach(r => {
              const extras = (r.debt_items || []).filter(it => !it.name.toUpperCase().includes('FEE')).map(it => ({
                name: it.name,
                amount: fmt(it.amount),
                currency: it.currency || 'TRY'
              }));
              targetMonths.push({
                id: uid(),
                year: r.year,
                month: r.month,
                feeType: c.fee_type,
                feeRate: String(c.fee_rate || '6.0'),
                feeFixed: c.fee_type === 'fixed' ? fmt(r.fee_amount || 0) : '',
                rows: defaultRows(),
                extras: extras
              });
            });
          } else {
            targetMonths.push({
              id: uid(), year: year, month: new Date().getMonth() + 1,
              feeType: c.fee_type, feeRate: String(c.fee_rate || '6.0'), feeFixed: '', rows: defaultRows(), extras: []
            });
          }
        } else {
          const mNum = parseInt(monthVal);
          const r = feeRows.find(row => row.year === year && row.month === mNum);
          const extras = r && r.debt_items ? r.debt_items.filter(it => !it.name.toUpperCase().includes('FEE')).map(it => ({
            name: it.name,
            amount: fmt(it.amount),
            currency: it.currency || 'TRY'
          })) : [];

          targetMonths.push({
            id: uid(),
            year: year,
            month: mNum,
            feeType: c.fee_type,
            feeRate: String(c.fee_rate || '6.0'),
            feeFixed: c.fee_type === 'fixed' && r ? fmt(r.fee_amount || 0) : '',
            rows: defaultRows(),
            extras: extras
          });
        }

        // Yeni Casino ekle
        state.casinos.push({
          id: uid(),
          name: c.name,
          months: targetMonths
        });

        bootstrap.Modal.getInstance(document.getElementById('systemCasinoModal')).hide();
        saveState();
        renderEditor();
        renderPreview();

        Swal.fire({
          icon: 'success',
          title: 'Casino Aktarıldı!',
          text: `"${c.name}" rapor editörüne eklendi.`,
          timer: 1200,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Hata', text: err.message });
      }
    }

    // ══════════════════════════════════════════════════════
    // WHATSAPP & TELEGRAM PAYLAŞIM SİSTEMİ
    // ══════════════════════════════════════════════════════
    function generateShareText() {
      const usdRate = parseNum(state.usdRate);
      const eurRate = parseNum(state.eurRate);
      const dateStr = todayStr();

      let text = `📊 *FEE & DETAYLI HESAP RAPORU*\n`;
      text += `📅 *Rapor Tarihi:* ${dateStr}\n`;
      if (usdRate) text += `💱 *Kurlar:* 1 USD = ₺${fmt(usdRate)} | 1 EUR = ₺${fmt(eurRate)}\n`;
      text += `────────────────────\n\n`;

      let grandTotalUSD = 0;

      state.casinos.forEach((casino, cIdx) => {
        const cName = casino.name || `İşletme #${cIdx + 1}`;
        text += `🏢 *${cName.toUpperCase()}*\n`;

        casino.months.forEach(m => {
          const t = computeMonthTotals(m, usdRate, eurRate);
          const caption = `${MONTHS[m.month]} ${m.year}`;
          text += `🔹 *Dönem:* ${caption}\n`;

          if (t.rows.length > 0 && (t.totalBet > 0 || t.totalWin > 0)) {
            text += `  • Toplam Bet: ₺${fmt(t.totalBet)}\n`;
            text += `  • Toplam Win: ₺${fmt(t.totalWin)}\n`;
            text += `  • Net (W/L): ₺${fmt(t.totalNet)}\n`;
          }

          if (t.komisyonLabel) {
            text += `  • *${t.komisyonLabel}:* ₺${fmt(t.komisyonTRY)} (${fmtUSD(t.komisyonUSD)}$)\n`;
          }

          if (m.extras.length > 0) {
            text += `  • *Ekstra Kalemler:*\n`;
            m.extras.forEach(ex => {
              const usd = toUSD(ex, usdRate, eurRate);
              text += `    - ${ex.name || 'Kalem'}: ${extraAmountLabel(ex)} (${fmtUSD(usd)}$)\n`;
            });
          }

          text += `  💵 *Ay Toplamı:* *$${fmtUSD(t.totalUSD)}*\n\n`;
          grandTotalUSD += t.totalUSD;
        });
      });

      text += `────────────────────\n`;
      text += `💰 *GENEL TOPLAM:* *$${fmtUSD(grandTotalUSD)} USD*`;
      if (usdRate) text += ` (~₺${fmt(grandTotalUSD * usdRate)})`;
      text += `\n\n_Casino Takip Sistemi ile oluşturulmuştur._`;

      return text;
    }

    function openWhatsAppShare() {
      const text = generateShareText();
      Swal.fire({
        title: '<i class="fa-brands fa-whatsapp text-success me-2"></i> WhatsApp İle Paylaş',
        html: `
          <p class="text-secondary small mb-2 text-start">Oluşturulan rapor özeti WhatsApp formatında hazırlandı:</p>
          <textarea class="form-control font-mono text-white p-2.5 mb-3" style="background:#070a12; border-color:#2c3c58; font-size:0.75rem; height:180px;" readonly>${text}</textarea>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-info btn-sm w-50 py-2" onclick="copyShareText()">
              <i class="fa-regular fa-copy me-1"></i> Metni Kopyala
            </button>
            <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(text)}" target="_blank" class="btn btn-success btn-sm w-50 py-2 fw-bold">
              <i class="fa-brands fa-whatsapp me-1"></i> WhatsApp'ı Aç
            </a>
          </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        background: '#0e1424',
        color: '#fff'
      });
    }

    function openTelegramShare() {
      const text = generateShareText();
      Swal.fire({
        title: '<i class="fa-brands fa-telegram text-info me-2"></i> Telegram İle Paylaş',
        html: `
          <p class="text-secondary small mb-2 text-start">Oluşturulan rapor özeti Telegram formatında hazırlandı:</p>
          <textarea class="form-control font-mono text-white p-2.5 mb-3" style="background:#070a12; border-color:#2c3c58; font-size:0.75rem; height:180px;" readonly>${text}</textarea>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-info btn-sm w-50 py-2" onclick="copyShareText()">
              <i class="fa-regular fa-copy me-1"></i> Metni Kopyala
            </button>
            <a href="https://t.me/share/url?url=&text=${encodeURIComponent(text)}" target="_blank" class="btn btn-primary btn-sm w-50 py-2 fw-bold" style="background:#229ED9; border-color:#229ED9;">
              <i class="fa-brands fa-telegram me-1"></i> Telegram'ı Aç
            </a>
          </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        background: '#0e1424',
        color: '#fff'
      });
    }

    function copyShareText() {
      const text = generateShareText();
      navigator.clipboard.writeText(text);
      Swal.fire({ icon: 'success', title: 'Metin Kopyalandı!', timer: 1000, showConfirmButton: false });
    }

    // PDF İndirme & Yazdırma
    function downloadPDF() {
      const casinoNames = state.casinos.map(c => c.name || 'Casino').filter(Boolean).join('_');
      const filename = `${casinoNames}_Fee_Raporu_${new Date().toISOString().slice(0,10)}.pdf`;

      Swal.fire({
        title: 'PDF Hazırlanıyor...',
        text: 'Lütfen bekleyin, yüksek çözünürlüklü sayfa oluşturuluyor.',
        didOpen: () => Swal.showLoading()
      });

      const element = document.getElementById('previewContent');
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        Swal.close();
      }).catch(() => {
        // Fallback to native print if html2pdf fails
        Swal.close();
        window.print();
      });
    }

    // Başlangıç
    function init() {
      loadSavedState();
      document.getElementById('usdRate').value = state.usdRate;
      document.getElementById('eurRate').value = state.eurRate;
      document.getElementById('btnSeparate').classList.toggle('lt-active', state.combineMode === 'separate');
      document.getElementById('btnCombined').classList.toggle('lt-active', state.combineMode === 'combined');
      renderEditor();
      renderPreview();
    }

    init();
  </script>
</body>
</html>
