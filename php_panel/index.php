<?php
require_once __DIR__ . '/config.php';
$rates = getExchangeRates();
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Casino Takip & Finansal Raporlar</title>
  
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
      --bg-base: #090d16;
      --bg-surface: #0f1626;
      --bg-card: #131c31;
      --bg-card-hover: #192540;
      --bg-side: #0c1220;
      --border-color: #1c273c;
      --border-accent: #25334d;
      --accent: #38bdf8;
      --accent-dim: rgba(56, 189, 248, 0.12);
      --gold: #fbbf24;
      --gold-dim: rgba(251, 191, 36, 0.12);
      --success: #22c55e;
      --danger: #f43f5e;
      --text-main: #f1f5f9;
      --text-muted: #64748b;
      --text-slate: #94a3b8;
    }
    
    * { box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg-base);
      color: var(--text-main);
      font-size: 0.845rem;
      line-height: 1.55;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    .font-mono { font-family: 'JetBrains Mono', monospace; }

    /* Header */
    .header-nav {
      background-color: rgba(15, 22, 38, 0.92);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border-color);
      padding: 0.65rem 1.25rem;
    }

    .main-container {
      max-width: 1180px;
      margin: 0 auto;
      padding: 1.75rem 1.25rem;
    }

    /* Summary Cards */
    .card-kpi {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.15rem 1.25rem;
      transition: all 0.2s ease;
    }
    .card-kpi:hover {
      border-color: var(--border-accent);
      transform: translateY(-1px);
    }
    .kpi-title {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
      font-weight: 500;
    }
    .kpi-val {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.01em;
    }
    .kpi-sub {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }

    /* Table Container */
    .table-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      overflow: hidden;
    }
    .table-panel-header {
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-surface);
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
      padding: 0.8rem 1.15rem;
      border: none;
    }
    .table-rep tbody tr {
      border-top: 1px solid #162033;
      background-color: var(--bg-base);
      transition: background-color 0.12s ease;
      cursor: pointer;
    }
    .table-rep tbody tr:hover {
      background-color: var(--bg-card-hover);
    }
    .table-rep td {
      padding: 0.8rem 1.15rem;
      vertical-align: middle;
      border: none;
      font-size: 0.845rem;
    }
    .table-rep tfoot tr {
      background: var(--bg-surface);
      border-top: 2px solid #25334d;
      font-weight: 700;
    }
    .table-rep tfoot td {
      padding: 0.9rem 1.15rem;
      border: none;
    }

    /* Badges & Buttons */
    .btn-badge-profil {
      background: rgba(56, 189, 248, 0.08);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      font-size: 0.68rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      transition: all 0.15s;
    }
    .btn-badge-profil:hover {
      background: #38bdf8;
      color: #090d16;
    }

    .btn-badge-archive {
      background: rgba(148, 163, 184, 0.08);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.2);
      font-size: 0.68rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      transition: all 0.15s;
    }
    .btn-badge-archive:hover {
      background: #334155;
      color: #fff;
    }

    .btn-year-tab {
      padding: 0.3rem 0.75rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
      background: transparent;
      border: none;
      transition: all 0.15s;
    }
    .btn-year-tab.active {
      background: #38bdf8;
      color: #090d16;
      font-weight: 700;
    }

    .btn-action-primary {
      background: #38bdf8;
      color: #090d16;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 0.4rem 0.95rem;
      border-radius: 8px;
      border: none;
      transition: opacity 0.15s;
    }
    .btn-action-primary:hover {
      opacity: 0.9;
      color: #090d16;
    }

    .btn-action-outline {
      background: transparent;
      color: #94a3b8;
      font-weight: 500;
      font-size: 0.78rem;
      padding: 0.38rem 0.85rem;
      border-radius: 8px;
      border: 1px solid var(--border-accent);
      transition: all 0.15s;
    }
    .btn-action-outline:hover {
      color: #fff;
      border-color: #475569;
    }

    /* Modal Styling */
    .modal-content-compact {
      background-color: #0e1424;
      border: 1px solid var(--border-accent);
      border-radius: 16px;
      color: var(--text-main);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
    }
    .modal-header-compact {
      border-bottom: 1px solid var(--border-color);
      padding: 1rem 1.35rem;
    }
    .modal-footer-compact {
      border-top: 1px solid var(--border-color);
      padding: 0.85rem 1.35rem;
    }

    .form-input-compact {
      background-color: #090d16;
      border: 1px solid var(--border-accent);
      color: #fff;
      font-size: 0.825rem;
      border-radius: 8px;
      padding: 0.45rem 0.75rem;
    }
    .form-input-compact:focus {
      background-color: #090d16;
      border-color: #38bdf8;
      color: #fff;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }

    /* Progress bar */
    .progress-bar-container {
      width: 54px;
      height: 5px;
      border-radius: 99px;
      background: #1c273c;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 99px;
    }

    /* Preset Chips */
    .chip-item {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      background: #151e33;
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

    /* Split Side Panel inside Profile Modal */
    .profile-split-container {
      display: flex;
      gap: 1rem;
      transition: all 0.25s ease;
    }
    .profile-table-side {
      flex: 1 1 100%;
      transition: all 0.25s ease;
    }
    .profile-table-side.is-split {
      flex: 1 1 58%;
    }
    .profile-editor-side {
      display: none;
      flex: 1 1 42%;
      background: var(--bg-side);
      border: 1px solid var(--border-accent);
      border-radius: 12px;
      padding: 1.15rem;
      animation: fadeInRight 0.2s ease;
    }
    .profile-editor-side.is-active {
      display: block;
    }

    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .matrix-row-active {
      background-color: rgba(56, 189, 248, 0.12) !important;
      border-left: 3px solid #38bdf8 !important;
    }
  </style>
</head>
<body>

  <!-- Sticky Navbar -->
  <header class="sticky-top header-nav">
    <div class="d-flex align-items-center justify-content-between">
      
      <!-- Left: Logo & Navigation -->
      <div class="d-flex align-items-center gap-2.5">
        <span style="color: #38bdf8; font-weight: 800; font-size: 1.25rem;">♠</span>
        <span class="fw-bold text-white fs-6 d-none d-sm-inline">Casino Takip</span>
        <span class="text-secondary opacity-40 d-none d-sm-inline">·</span>
        <span class="text-slate fw-medium" style="font-size: 0.825rem;">Raporlar</span>

        <!-- Year Switcher -->
        <div class="d-flex align-items-center gap-1 ms-2.5" id="yearButtons">
          <button class="btn-year-tab" onclick="setYear(2025)">2025</button>
          <button class="btn-year-tab active" onclick="setYear(2026)">2026</button>
          <button class="btn-year-tab" onclick="setYear(2027)">2027</button>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="d-flex align-items-center gap-2">
        <!-- Live Currency Rates -->
        <div class="d-none d-md-flex align-items-center gap-2.5 px-3 py-1 rounded-3" style="background: #090d16; border: 1px solid var(--border-color); font-size: 0.74rem;">
          <span class="text-secondary">USD:</span> <strong class="text-white font-mono" id="rateUSD">₺<?= number_format($rates['usd'], 2) ?></strong>
          <span class="text-secondary opacity-30">|</span>
          <span class="text-secondary">EUR:</span> <strong class="text-white font-mono" id="rateEUR">₺<?= number_format($rates['eur'], 2) ?></strong>
        </div>

        <button class="btn-action-primary d-flex align-items-center gap-1" onclick="openAddCasinoModal()">
          <span>+</span> <span class="d-none d-sm-inline">Casino Ekle</span>
        </button>

        <button class="btn-action-outline d-flex align-items-center gap-1" onclick="openArchiveModal()">
          <span>📦</span> <span class="d-none d-sm-inline">Arşiv</span>
          <span class="badge ms-1" style="background: rgba(56,189,248,0.15); color: #38bdf8; font-size: 0.65rem;" id="badgeArchive">0</span>
        </button>

        <button class="btn-action-outline d-flex align-items-center gap-1" onclick="openExpensesModal()">
          <span>💸</span> <span class="d-none d-sm-inline">Giderler</span>
        </button>

        <button class="btn-action-outline" style="padding: 0.38rem 0.65rem;" onclick="exportReportsToExcel()" title="Excel İndir">
          <i class="fa-solid fa-file-excel text-success"></i>
        </button>

        <button class="btn-action-outline" style="padding: 0.38rem 0.65rem;" onclick="loadData()" title="Yenile">
          <i class="fa-solid fa-rotate-right" id="refreshIcon"></i>
        </button>
      </div>

    </div>
  </header>

  <!-- Main Content Container -->
  <main class="main-container">
    
    <!-- 4 Summary KPI Cards -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-sm-3">
        <div class="card-kpi">
          <div class="kpi-title">Toplam Beklenen</div>
          <div class="kpi-val text-white font-mono" id="cardTotalUSD">$0.00</div>
          <div class="kpi-sub font-mono" id="cardTotalTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-sm-3">
        <div class="card-kpi">
          <div class="kpi-title" id="labelCollected">Tahsil Edilen</div>
          <div class="kpi-val font-mono" style="color: var(--success);" id="cardCollectedUSD">$0.00</div>
          <div class="kpi-sub font-mono" id="cardCollectedTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-sm-3">
        <div class="card-kpi">
          <div class="kpi-title" id="labelOutstanding">Bekleyen Borç</div>
          <div class="kpi-val font-mono" style="color: var(--danger);" id="cardOutstandingUSD">$0.00</div>
          <div class="kpi-sub font-mono" id="cardOutstandingTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-sm-3">
        <div class="card-kpi">
          <div class="kpi-title">Tahsilat Oranı</div>
          <div class="kpi-val font-mono" style="color: #38bdf8;" id="cardRatePercent">%0.0</div>
          <div class="kpi-sub d-flex align-items-center gap-2" style="margin-top: 0.4rem;">
            <div class="progress-bar-container w-100" style="height: 4px;">
              <div class="progress-bar-fill" id="cardProgressBar" style="width: 0%; background: #38bdf8;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Casino Reports Table Panel -->
    <div class="table-panel">
      <!-- Panel Header -->
      <div class="table-panel-header">
        <h2 class="m-0 fw-semibold text-white" style="font-size: 0.875rem;">
          Casino Raporu — <span id="titleYear">2026</span><span id="titleMonthBadge"></span>
        </h2>

        <div class="d-flex align-items-center gap-3">
          <select class="form-input-compact" id="monthFilter" style="font-weight: 600;" onchange="filterMonth(this.value)">
            <option value="0">Tüm Yıl</option>
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
          <span class="text-secondary d-none d-sm-inline" style="font-size: 0.75rem;" id="casinoCountBadge">0 casino</span>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-responsive">
        <table class="table-rep">
          <thead>
            <tr>
              <th onclick="sortTable('name')" style="cursor: pointer;">CASİNO <i class="fa-solid fa-sort ms-1 opacity-30"></i></th>
              <th onclick="sortTable('months')" class="text-center" style="cursor: pointer; width: 60px;">AY <i class="fa-solid fa-sort ms-1 opacity-30"></i></th>
              <th onclick="sortTable('total')" class="text-end" style="cursor: pointer;">BEKLENEN <i class="fa-solid fa-sort ms-1 opacity-30"></i></th>
              <th onclick="sortTable('collected')" class="text-end" style="cursor: pointer;">TAHSİL <i class="fa-solid fa-sort ms-1 opacity-30"></i></th>
              <th onclick="sortTable('outstanding')" class="text-end" style="cursor: pointer;">BEKLEYEN <i class="fa-solid fa-sort ms-1 opacity-30"></i></th>
              <th onclick="sortTable('rate')" class="text-end" style="cursor: pointer; width: 110px;">ORAN % <i class="fa-solid fa-sort ms-1 opacity-30"></i></th>
              <th class="text-center" style="width: 40px;"></th>
            </tr>
          </thead>
          <tbody id="tableBody">
            <tr>
              <td colspan="7" class="text-center py-5 text-secondary">
                <div class="spinner-border spinner-border-sm text-info me-2" role="status"></div> Yükleniyor...
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="text-white" style="font-size: 0.78rem;">TOPLAM</td>
              <td class="text-center text-secondary font-mono" id="footMonths">-</td>
              <td class="text-end font-mono" id="footTotal">-</td>
              <td class="text-end font-mono" style="color: var(--success);" id="footCollected">-</td>
              <td class="text-end font-mono" style="color: var(--danger);" id="footOutstanding">-</td>
              <td class="text-end font-mono" style="color: #38bdf8;" id="footRate">%0.0</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

  </main>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- PROFİL MODAL & YAN YANA AÇILAN BORÇ DÜZENLEME PANELİ -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="profileModal" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style="max-width: 1050px;">
      <div class="modal-content modal-content-compact">
        <!-- Modal Header -->
        <div class="modal-header modal-header-compact d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2.5">
            <span class="rounded-3 p-1.5 px-2.5" style="background: rgba(56,189,248,0.1); color: #38bdf8; font-size: 1rem;">👤</span>
            <div>
              <h6 class="modal-title fw-bold text-white m-0" id="profileModalTitle">Casino</h6>
              <small class="text-secondary" style="font-size: 0.72rem;" id="profileModalSub">Profil · Hareket Geçmişi</small>
            </div>
          </div>
          
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-secondary btn-sm py-1 px-3 rounded-2" style="font-size: 0.75rem;" onclick="archiveCurrentProfileCasino()">
              📦 Arşivle
            </button>
            <button type="button" class="btn-close btn-close-white" style="font-size: 0.8rem;" data-bs-dismiss="modal"></button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="modal-body p-3.5">
          <!-- Summary 3-Column Card -->
          <div class="row g-2.5 text-center mb-3.5">
            <div class="col-4">
              <div class="p-2.5 rounded-3" style="background: #090d16; border: 1px solid var(--border-color);">
                <div class="text-secondary" style="font-size: 0.72rem;">Beklenen</div>
                <strong class="text-white font-mono" style="font-size: 1rem;" id="profTotalUSD">$0.00</strong>
                <div class="text-secondary font-mono" style="font-size: 0.68rem;" id="profTotalTRY">₺0,00</div>
              </div>
            </div>
            <div class="col-4">
              <div class="p-2.5 rounded-3" style="background: #090d16; border: 1px solid var(--border-color);">
                <div class="text-secondary" style="font-size: 0.72rem;">Tahsil Edilen</div>
                <strong class="font-mono" style="color: var(--success); font-size: 1rem;" id="profCollectedUSD">$0.00</strong>
                <div class="text-secondary font-mono" style="font-size: 0.68rem;" id="profCollectedTRY">₺0,00</div>
              </div>
            </div>
            <div class="col-4">
              <div class="p-2.5 rounded-3" style="background: #090d16; border: 1px solid var(--border-color);">
                <div class="text-secondary" style="font-size: 0.72rem;">Bekleyen</div>
                <strong class="font-mono" style="color: var(--danger); font-size: 1rem;" id="profOutstandingUSD">$0.00</strong>
                <div class="text-secondary font-mono" style="font-size: 0.68rem;" id="profOutstandingTRY">₺0,00</div>
              </div>
            </div>
          </div>

          <!-- Tab Navigation -->
          <ul class="nav nav-pills mb-2.5 gap-1.5 border-bottom pb-2" style="font-size: 0.78rem;">
            <li class="nav-item">
              <button class="nav-link active py-1 px-3 rounded-2" data-bs-toggle="pill" data-bs-target="#tabTable">📊 Tablo</button>
            </li>
            <li class="nav-item">
              <button class="nav-link py-1 px-3 rounded-2" data-bs-toggle="pill" data-bs-target="#tabTimeline">🕒 Hareketler</button>
            </li>
            <li class="nav-item">
              <button class="nav-link py-1 px-3 rounded-2" data-bs-toggle="pill" data-bs-target="#tabInfo">ℹ️ Bilgiler</button>
            </li>
            <li class="nav-item">
              <button class="nav-link py-1 px-3 rounded-2" data-bs-toggle="pill" data-bs-target="#tabNotes">📝 Notlar</button>
            </li>
          </ul>

          <div class="tab-content pt-1">
            
            <!-- ══ TAB 1: SPLIT TABLO & SAĞ PANEL DÜZENLEYİCİ ══ -->
            <div class="tab-pane fade show active" id="tabTable">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex gap-1" id="profMatrixYearButtons"></div>
                <span class="text-secondary" style="font-size: 0.72rem;">* Satıra tıkla, sağ panelde anında düzenle</span>
              </div>

              <!-- Split Container -->
              <div class="profile-split-container" id="profileSplitContainer">
                
                <!-- Sol Taraf: Aylık Tablo -->
                <div class="profile-table-side" id="profileTableSide">
                  <div class="table-responsive rounded-2 border" style="border-color: var(--border-color) !important; max-height: 52vh;">
                    <table class="table-rep w-100">
                      <thead class="sticky-top" style="background: #0f1626;">
                        <tr>
                          <th style="width: 85px;">AY</th>
                          <th class="text-end">FEE (₺)</th>
                          <th class="text-end">BORÇ (₺)</th>
                          <th class="text-end">ÖDENEN (₺)</th>
                          <th class="text-end">KALAN (₺)</th>
                          <th class="text-center" style="width: 75px;">DURUM</th>
                        </tr>
                      </thead>
                      <tbody id="profileMatrixBody"></tbody>
                    </table>
                  </div>
                </div>

                <!-- Sağ Taraf: Yan Panel Borç & Tahsilat Düzenleyici (Modal içinde modal yerine!) -->
                <div class="profile-editor-side" id="profileEditorSide">
                  <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style="border-color: var(--border-color) !important;">
                    <h6 class="fw-bold text-white m-0 d-flex align-items-center gap-1.5" style="font-size: 0.85rem;" id="sideEditorTitle">
                      <i class="fa-solid fa-pen-to-square text-info"></i> Ay Düzenle
                    </h6>
                    <button class="btn btn-link text-secondary btn-sm p-0" onclick="closeSideEditor()" title="Kapat">
                      <i class="fa-solid fa-xmark fs-6"></i>
                    </button>
                  </div>

                  <!-- Quick Presets -->
                  <div class="mb-3">
                    <span class="text-secondary d-block mb-1.5" style="font-size: 0.7rem; font-weight: 600;">HIZLI KALEM EKLE</span>
                    <div class="d-flex flex-wrap gap-1">
                      <span class="chip-item" onclick="quickAddPreset('MAKİNA KİRASI')">+ Makina</span>
                      <span class="chip-item" onclick="quickAddPreset('DEPOZİTO')">+ Depozito</span>
                      <span class="chip-item" onclick="quickAddPreset('SERVER ÜCRETİ')">+ Server</span>
                      <span class="chip-item" onclick="quickAddPreset('RTP')">+ RTP</span>
                      <span class="chip-item" onclick="quickAddPreset('KİRA')">+ Kira</span>
                      <span class="chip-item" onclick="quickAddPreset('SABİT-FEE')">+ Sabit-Fee</span>
                      <span class="chip-item" onclick="quickAddPreset('FEE')">+ Fee</span>
                    </div>
                  </div>

                  <!-- Debt Items -->
                  <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-1.5">
                      <span class="text-secondary fw-semibold" style="font-size: 0.72rem;">BORÇ KALEMLERİ</span>
                      <button class="btn-badge-profil py-0.5" onclick="addDebtItemRow()">+ Kalem</button>
                    </div>
                    <div id="debtItemsContainer" class="space-y-1.5" style="max-height: 22vh; overflow-y: auto;"></div>
                    
                    <div class="p-2 rounded-2 mt-2 d-flex justify-content-between align-items-center font-mono" style="background: #090d16; border: 1px solid var(--border-color); font-size: 0.78rem;">
                      <span class="text-secondary">Kalemler Toplamı:</span>
                      <strong class="text-white" id="debtItemsLiveTotal">₺0,00</strong>
                    </div>
                  </div>

                  <!-- Quick Payment Entry -->
                  <div class="p-2.5 rounded-2 mb-3" style="background: #090d16; border: 1px solid var(--border-color);">
                    <div class="d-flex justify-content-between align-items-center mb-1.5">
                      <span class="text-success fw-semibold" style="font-size: 0.72rem;">+ TAHSİLAT / ÖDEME GİR</span>
                      <small class="text-secondary font-mono" style="font-size: 0.7rem;" id="feeCurrentPaidAmount">Ödenen: ₺0,00</small>
                    </div>
                    <div class="row g-1.5">
                      <div class="col-6">
                        <input type="number" step="0.01" class="form-input-compact w-100 font-mono" id="feeNewPayment" placeholder="Tutar (₺)">
                      </div>
                      <div class="col-6">
                        <input type="text" class="form-input-compact w-100" id="feePaymentNote" placeholder="Ödeme Notu">
                      </div>
                    </div>
                  </div>

                  <!-- General Note -->
                  <div class="mb-3">
                    <input type="text" class="form-input-compact w-100" id="feeGeneralNote" placeholder="Bu ay için genel not...">
                  </div>

                  <!-- Save Button in Side Panel -->
                  <div class="d-flex justify-content-end gap-2">
                    <button type="button" class="btn-action-outline py-1 px-3" onclick="closeSideEditor()">Kapat</button>
                    <button type="button" class="btn-action-primary py-1 px-4" onclick="saveFeeRowData()">Kaydet</button>
                  </div>
                </div>

              </div>
            </div>

            <!-- ══ TAB 2: TIMELINE ══ -->
            <div class="tab-pane fade" id="tabTimeline">
              <div class="row g-2 mb-3">
                <div class="col-4">
                  <select class="form-input-compact w-100" id="timelineTypeFilter" onchange="renderProfileTimeline()">
                    <option value="all">Tüm Hareketler</option>
                    <option value="payment">Sadece Ödemeler (+)</option>
                    <option value="entry">Sadece Borç Girişleri (-)</option>
                  </select>
                </div>
                <div class="col-8">
                  <input type="text" class="form-input-compact w-100" id="timelineSearch" placeholder="Arama yap..." oninput="renderProfileTimeline()">
                </div>
              </div>
              <div id="profileTimelineContainer" style="max-height: 48vh; overflow-y: auto;"></div>
            </div>

            <!-- ══ TAB 3: BİLGİLER ══ -->
            <div class="tab-pane fade" id="tabInfo">
              <form onsubmit="saveCasinoInfoSettings(event)" class="p-3 rounded-2" style="background: #090d16; border: 1px solid var(--border-color); max-width: 520px;">
                <div class="mb-3">
                  <label class="small text-secondary mb-1">Casino İsmi</label>
                  <input type="text" class="form-input-compact w-100" id="editInfoName" required>
                </div>
                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label class="small text-secondary mb-1">Fee Türü</label>
                    <select class="form-input-compact w-100" id="editInfoFeeType">
                      <option value="percent">Yüzdelik (%)</option>
                      <option value="fixed">Sabit Fee</option>
                      <option value="none">Fee Yok</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="small text-secondary mb-1">Fee Oranı (%)</label>
                    <input type="number" step="0.1" class="form-input-compact w-100 font-mono" id="editInfoFeeRate">
                  </div>
                </div>
                <div class="d-flex justify-content-end">
                  <button type="submit" class="btn-action-primary">Kaydet</button>
                </div>
              </form>
            </div>

            <!-- ══ TAB 4: NOTLAR ══ -->
            <div class="tab-pane fade" id="tabNotes">
              <div class="p-3 rounded-2" style="background: #090d16; border: 1px solid var(--border-color);">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="small text-secondary fw-semibold">ÖZEL CASİNO NOTLARI</span>
                  <small class="text-secondary" style="font-size: 0.7rem;" id="notesLastUpdated">-</small>
                </div>
                <textarea class="form-input-compact w-100 font-mono" id="profileNotesText" rows="7" placeholder="Casino ile ilgili özel notlar, anlaşma detayları..."></textarea>
                <div class="d-flex justify-content-end mt-2.5">
                  <button class="btn-action-primary" onclick="saveProfileNote()">Notu Kaydet</button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- COMPACT MODAL: CASINO EKLE                            -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="addCasinoModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 420px;">
      <div class="modal-content modal-content-compact">
        <div class="modal-header modal-header-compact">
          <h6 class="modal-title fw-bold text-white m-0">+ Yeni Casino Ekle</h6>
          <button type="button" class="btn-close btn-close-white" style="font-size: 0.8rem;" data-bs-dismiss="modal"></button>
        </div>
        <form onsubmit="submitAddCasino(event)">
          <div class="modal-body p-3.5 space-y-2.5">
            <div class="mb-3">
              <label class="small text-secondary mb-1">Casino Adı</label>
              <input type="text" class="form-input-compact w-100" id="addName" required placeholder="Örn: ELEXUS VIP">
            </div>
            <div class="row g-2">
              <div class="col-6">
                <label class="small text-secondary mb-1">Fee Türü</label>
                <select class="form-input-compact w-100" id="addFeeType" onchange="toggleFeeRate(this.value)">
                  <option value="percent">Yüzdelik (%)</option>
                  <option value="fixed">Sabit Fee</option>
                  <option value="none">Fee Yok</option>
                </select>
              </div>
              <div class="col-6" id="addFeeRateContainer">
                <label class="small text-secondary mb-1">Fee Oranı (%)</label>
                <input type="number" step="0.1" class="form-input-compact w-100 font-mono" id="addFeeRate" value="6.0">
              </div>
            </div>
          </div>
          <div class="modal-footer modal-footer-compact">
            <button type="button" class="btn-action-outline" data-bs-dismiss="modal">İptal</button>
            <button type="submit" class="btn-action-primary">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- COMPACT MODAL: ARŞİV                                  -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="archiveModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 460px;">
      <div class="modal-content modal-content-compact">
        <div class="modal-header modal-header-compact">
          <h6 class="modal-title fw-bold text-white m-0">📦 Arşivlenen Casinolar</h6>
          <button type="button" class="btn-close btn-close-white" style="font-size: 0.8rem;" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-3">
          <div id="archiveListContainer" style="max-height: 48vh; overflow-y: auto;">
            <p class="text-secondary text-center py-4 m-0">Arşivde casino bulunmuyor.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- COMPACT MODAL: GİDERLER                               -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="expensesModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 520px;">
      <div class="modal-content modal-content-compact">
        <div class="modal-header modal-header-compact">
          <h6 class="modal-title fw-bold text-white m-0">💸 Aylık Giderler</h6>
          <button type="button" class="btn-close btn-close-white" style="font-size: 0.8rem;" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-3.5">
          <form onsubmit="submitAddExpense(event)" class="p-3 rounded-2 mb-3" style="background: #090d16; border: 1px solid var(--border-color);">
            <div class="row g-2">
              <div class="col-6">
                <input type="text" class="form-input-compact w-100" id="expName" required placeholder="Gider Adı">
              </div>
              <div class="col-3">
                <input type="number" step="0.01" class="form-input-compact w-100 font-mono" id="expAmount" required placeholder="Tutar">
              </div>
              <div class="col-3">
                <select class="form-input-compact w-100" id="expCurrency">
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div class="col-8 mt-2">
                <select class="form-input-compact w-100" id="expMonth">
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
              <div class="col-4 mt-2 text-end">
                <button type="submit" class="btn-action-primary w-100 py-1.5">Ekle</button>
              </div>
            </div>
          </form>

          <div class="table-responsive rounded-2 border" style="border-color: var(--border-color) !important; max-height: 38vh;">
            <table class="table-rep w-100">
              <thead>
                <tr>
                  <th>GİDER</th>
                  <th>AY</th>
                  <th class="text-end">TUTAR</th>
                  <th style="width: 35px;"></th>
                </tr>
              </thead>
              <tbody id="expensesTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bootstrap 5 JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Core Script -->
  <script>
    const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    
    let currentYear = 2026;
    let selectedMonth = 0;
    let rates = { usd: <?= (float)$rates['usd'] ?>, eur: <?= (float)$rates['eur'] ?> };
    let appData = { casinos: [], fee_rows: [] };
    let sortKey = 'total';
    let sortDir = 'desc';
    let currentActiveProfile = null;
    let currentProfileMatrixYear = 2026;
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

    async function loadData() {
      const refreshIcon = document.getElementById('refreshIcon');
      if (refreshIcon) refreshIcon.classList.add('fa-spin');

      try {
        const res = await fetch(`api.php?action=get_reports&year=${currentYear}`);
        const data = await res.json();
        if (data.success) {
          appData = data;
          if (data.rates) rates = data.rates;
          document.getElementById('badgeArchive').innerText = data.archived_count || 0;
          render();
        }
      } catch(e) {
        console.error('Veri yükleme hatası:', e);
      } finally {
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
      }
    }

    function setYear(y) {
      currentYear = y;
      document.getElementById('titleYear').innerText = y;
      document.querySelectorAll('#yearButtons .btn-year-tab').forEach(btn => {
        btn.classList.toggle('active', btn.innerText == y);
      });
      loadData();
    }

    function filterMonth(m) {
      selectedMonth = parseInt(m);
      document.getElementById('titleMonthBadge').innerHTML = selectedMonth !== 0 ? ` · <span style="color: #38bdf8;">${MONTHS[selectedMonth]}</span>` : '';
      document.getElementById('labelCollected').innerText = selectedMonth === 0 ? 'Tahsil Edilen' : `Tahsil Edilen (${MONTHS[selectedMonth]})`;
      document.getElementById('labelOutstanding').innerText = selectedMonth === 0 ? 'Bekleyen Borç' : `Bekleyen (${MONTHS[selectedMonth]})`;
      render();
    }

    function casinoStats(casino) {
      const rows = appData.fee_rows.filter(r => r.casino_id === casino.id);
      const total = rows.reduce((s, r) => s + (Number(r.turnover) || 0), 0);
      const scoped = selectedMonth === 0 ? rows : rows.filter(r => r.month === selectedMonth);
      const scopedTotal = scoped.reduce((s, r) => s + (Number(r.turnover) || 0), 0);
      const collected = scoped.reduce((s, r) => s + (Number(r.paid_amount) || 0), 0);
      const outstanding = Math.max(0, scopedTotal - collected);
      const rate = scopedTotal > 0 ? (collected / scopedTotal) * 100 : 0;
      const months = rows.length;
      return { total, scopedTotal, collected, outstanding, rate, months };
    }

    function sortTable(key) {
      if (sortKey === key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey = key;
        sortDir = 'desc';
      }
      render();
    }

    function render() {
      const tbody = document.getElementById('tableBody');
      const casinos = appData.casinos || [];
      document.getElementById('casinoCountBadge').innerText = `${casinos.length} casino`;

      if (casinos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-secondary">Kayıtlı casino bulunamadı.</td></tr>';
        return;
      }

      const tableData = casinos.map(c => ({ casino: c, ...casinoStats(c) })).sort((a, b) => {
        const mult = sortDir === 'asc' ? 1 : -1;
        if (sortKey === 'name') return a.casino.name.localeCompare(b.casino.name, 'tr') * mult;
        return ((Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0)) * mult;
      });

      const totals = tableData.reduce((s, r) => ({
        total: s.total + (Number(r.total) || 0),
        scopedTotal: s.scopedTotal + (Number(r.scopedTotal) || 0),
        collected: s.collected + (Number(r.collected) || 0),
        outstanding: s.outstanding + (Number(r.outstanding) || 0),
        months: s.months + r.months
      }), { total: 0, scopedTotal: 0, collected: 0, outstanding: 0, months: 0 });

      const overallRate = totals.scopedTotal > 0 ? (totals.collected / totals.scopedTotal) * 100 : 0;

      // KPI Cards
      document.getElementById('cardTotalUSD').innerText = '$' + fmtUSD(toUSD(totals.scopedTotal));
      document.getElementById('cardTotalTRY').innerText = '₺' + fmt(totals.scopedTotal);

      document.getElementById('cardCollectedUSD').innerText = '$' + fmtUSD(toUSD(totals.collected));
      document.getElementById('cardCollectedTRY').innerText = '₺' + fmt(totals.collected);

      document.getElementById('cardOutstandingUSD').innerText = '$' + fmtUSD(toUSD(totals.outstanding));
      document.getElementById('cardOutstandingTRY').innerText = '₺' + fmt(totals.outstanding);

      document.getElementById('cardRatePercent').innerText = '%' + overallRate.toFixed(1);
      document.getElementById('cardProgressBar').style.width = Math.min(100, overallRate) + '%';
      document.getElementById('cardProgressBar').style.background = overallRate >= 100 ? '#22c55e' : overallRate > 50 ? '#38bdf8' : '#f43f5e';

      // Table Rows
      tbody.innerHTML = tableData.map(row => {
        const c = row.casino;
        const rateColor = row.rate >= 100 ? '#22c55e' : row.rate > 50 ? '#38bdf8' : '#f43f5e';
        const progressBg = row.rate >= 100 ? '#22c55e' : row.rate > 50 ? '#38bdf8' : '#f43f5e';

        return `
          <tr onclick="openProfileModal(${c.id})">
            <td>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="fw-semibold text-white">${c.name}</span>
                <button class="btn-badge-profil" onclick="event.stopPropagation(); openProfileModal(${c.id})">
                  👤 Profil
                </button>
                <button class="btn-badge-archive" onclick="event.stopPropagation(); archiveCasino(${c.id}, '${c.name.replace(/'/g, "\\'")}')">
                  📦 Arşivle
                </button>
              </div>
            </td>
            <td class="text-center text-secondary font-mono">${row.months}</td>
            <td class="text-end">
              <div class="text-white font-mono">$${fmtUSD(toUSD(row.total))}</div>
              <div class="text-secondary font-mono" style="font-size: 0.7rem;">₺${fmt(row.total)}</div>
            </td>
            <td class="text-end" style="color: ${row.collected > 0 ? 'var(--success)' : '#475569'};">
              <div class="font-mono">$${fmtUSD(toUSD(row.collected))}</div>
              <div class="opacity-60 font-mono" style="font-size: 0.7rem;">₺${fmt(row.collected)}</div>
            </td>
            <td class="text-end" style="color: ${row.outstanding > 0 ? 'var(--danger)' : '#475569'};">
              <div class="font-mono">$${fmtUSD(toUSD(row.outstanding))}</div>
              <div class="opacity-60 font-mono" style="font-size: 0.7rem;">₺${fmt(row.outstanding)}</div>
            </td>
            <td class="text-end">
              <div class="d-flex align-items-center justify-content-end gap-2">
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${Math.min(100, row.rate)}%; background: ${progressBg};"></div>
                </div>
                <span class="fw-semibold font-mono" style="color: ${rateColor}; font-size: 0.78rem; width: 38px;">%${row.rate.toFixed(0)}</span>
              </div>
            </td>
            <td class="text-center text-secondary opacity-40">
              →
            </td>
          </tr>
        `;
      }).join('');

      // Footer
      document.getElementById('footMonths').innerText = totals.months;
      document.getElementById('footTotal').innerHTML = `$${fmtUSD(toUSD(totals.total))}<br><span class="text-secondary fw-normal font-mono" style="font-size: 0.7rem;">₺${fmt(totals.total)}</span>`;
      document.getElementById('footCollected').innerHTML = `$${fmtUSD(toUSD(totals.collected))}<br><span class="text-secondary fw-normal font-mono" style="font-size: 0.7rem;">₺${fmt(totals.collected)}</span>`;
      document.getElementById('footOutstanding').innerHTML = `$${fmtUSD(toUSD(totals.outstanding))}<br><span class="text-secondary fw-normal font-mono" style="font-size: 0.7rem;">₺${fmt(totals.outstanding)}</span>`;
      document.getElementById('footRate').innerText = `%${overallRate.toFixed(1)}`;
    }

    // ═════════════════════════════════════════════════════
    // PROFIL MODALI VE SAĞ PANEL DÜZENLEYİCİ
    // ═════════════════════════════════════════════════════
    async function openProfileModal(casinoId) {
      const res = await fetch(`api.php?action=get_profile&casino_id=${casinoId}`);
      const data = await res.json();
      if (!data.success) return;

      currentActiveProfile = data;
      const c = data.casino;

      document.getElementById('profileModalTitle').innerText = c.name;
      const feeLabel = c.fee_type === 'percent' ? `%${c.fee_rate} Fee` : (c.fee_type === 'fixed' ? 'Sabit Fee' : 'Fee Yok');
      document.getElementById('profileModalSub').innerText = `Profil · Hareket Geçmişi · ${feeLabel}`;

      document.getElementById('editInfoName').value = c.name;
      document.getElementById('editInfoFeeType').value = c.fee_type;
      document.getElementById('editInfoFeeRate').value = c.fee_rate;
      document.getElementById('profileNotesText').value = data.notes || '';

      const feeRows = data.fee_rows || [];
      const total = feeRows.reduce((s, r) => s + (Number(r.turnover) || 0), 0);
      const collected = feeRows.reduce((s, r) => s + (Number(r.paid_amount) || 0), 0);
      const outstanding = Math.max(0, total - collected);

      document.getElementById('profTotalUSD').innerText = '$' + fmtUSD(toUSD(total));
      document.getElementById('profTotalTRY').innerText = '₺' + fmt(total);
      document.getElementById('profCollectedUSD').innerText = '$' + fmtUSD(toUSD(collected));
      document.getElementById('profCollectedTRY').innerText = '₺' + fmt(collected);
      document.getElementById('profOutstandingUSD').innerText = '$' + fmtUSD(toUSD(outstanding));
      document.getElementById('profOutstandingTRY').innerText = '₺' + fmt(outstanding);

      currentProfileMatrixYear = currentYear;
      closeSideEditor();
      renderProfileMatrixYears();
      renderProfileMatrixTable();
      renderProfileTimeline();

      new bootstrap.Modal(document.getElementById('profileModal')).show();
    }

    function renderProfileMatrixYears() {
      const container = document.getElementById('profMatrixYearButtons');
      const years = [2025, 2026, 2027];
      container.innerHTML = years.map(y => `
        <button class="btn-year-tab ${y === currentProfileMatrixYear ? 'active' : ''}" onclick="currentProfileMatrixYear = ${y}; closeSideEditor(); renderProfileMatrixYears(); renderProfileMatrixTable();">
          ${y}
        </button>
      `).join('');
    }

    function renderProfileMatrixTable() {
      const tbody = document.getElementById('profileMatrixBody');
      const rowsForYear = (currentActiveProfile.fee_rows || []).filter(r => r.year === currentProfileMatrixYear);
      const rowByMonth = new Map(rowsForYear.map(r => [r.month, r]));

      let html = '';
      for (let m = 1; m <= 12; m++) {
        const r = rowByMonth.get(m);
        const turnover = r ? (Number(r.turnover) || 0) : 0;
        const feeAmount = r ? (Number(r.fee_amount) || 0) : 0;
        const paidAmount = r ? (Number(r.paid_amount) || 0) : 0;
        const rem = Math.max(0, turnover - paidAmount);

        let statusCell = '<span class="text-secondary opacity-30">—</span>';
        if (turnover > 0 || paidAmount > 0) {
          if (turnover > 0 && paidAmount >= turnover) {
            statusCell = '<span class="badge" style="background: rgba(34,197,94,0.15); color: #22c55e; font-size: 0.68rem;">✓ Ödendi</span>';
          } else if (paidAmount > 0) {
            statusCell = '<span class="badge" style="background: rgba(56,189,248,0.15); color: #38bdf8; font-size: 0.68rem;">≈ Kısmi</span>';
          } else {
            statusCell = '<span class="badge" style="background: rgba(244,63,94,0.15); color: #f43f5e; font-size: 0.68rem;">✗ Bekliyor</span>';
          }
        }

        const isActiveRow = currentEditingMonth === m;

        html += `
          <tr class="${isActiveRow ? 'matrix-row-active' : ''}" onclick="openSideEditor(${m})">
            <td class="fw-semibold text-white">${MONTHS[m]}</td>
            <td class="text-end font-mono">${feeAmount > 0 ? '₺' + fmt(feeAmount) : '—'}</td>
            <td class="text-end font-mono">${turnover > 0 ? '₺' + fmt(turnover) : '—'}</td>
            <td class="text-end font-mono" style="color: var(--success);">${paidAmount > 0 ? '₺' + fmt(paidAmount) : '—'}</td>
            <td class="text-end font-mono" style="color: ${rem > 0 ? 'var(--danger)' : '#64748b'};">${rem > 0 ? '₺' + fmt(rem) : (turnover > 0 ? '₺0,00' : '—')}</td>
            <td class="text-center">${statusCell}</td>
          </tr>
        `;
      }

      tbody.innerHTML = html;
    }

    // SAĞ PANEL: Pop-up yerine yan panelde düzenleme!
    function openSideEditor(month) {
      currentEditingMonth = month;
      const casinoId = currentActiveProfile.casino.id;
      const year = currentProfileMatrixYear;

      document.getElementById('sideEditorTitle').innerHTML = `<i class="fa-solid fa-pen-to-square text-info"></i> ${MONTHS[month]} ${year} Düzenle`;
      document.getElementById('feeNewPayment').value = '';
      document.getElementById('feePaymentNote').value = '';

      const existing = (currentActiveProfile.fee_rows || []).find(r => r.year === year && r.month === month);
      currentDebtItems = existing && existing.debt_items ? JSON.parse(JSON.stringify(existing.debt_items)) : [];
      document.getElementById('feeGeneralNote').value = existing ? existing.note || '' : '';
      document.getElementById('feeCurrentPaidAmount').innerText = 'Ödenen: ₺' + fmt(existing ? existing.paid_amount : 0);

      document.getElementById('profileTableSide').classList.add('is-split');
      document.getElementById('profileEditorSide').classList.add('is-active');

      renderDebtItems();
      renderProfileMatrixTable();
    }

    function closeSideEditor() {
      currentEditingMonth = null;
      document.getElementById('profileTableSide').classList.remove('is-split');
      document.getElementById('profileEditorSide').classList.remove('is-active');
      renderProfileMatrixTable();
    }

    function renderDebtItems() {
      const container = document.getElementById('debtItemsContainer');
      if (currentDebtItems.length === 0) {
        container.innerHTML = '<p class="text-secondary text-center py-2 m-0" style="font-size: 0.74rem;">Henüz borç kalemi yok.</p>';
        updateDebtItemsLiveTotal();
        return;
      }
      container.innerHTML = currentDebtItems.map((item, idx) => `
        <div class="row g-1 align-items-center p-1.5 rounded-2 mb-1" style="background: #090d16; border: 1px solid var(--border-color);">
          <div class="col-5">
            <input type="text" class="form-input-compact w-100" value="${item.name || ''}" placeholder="Kalem Adı" oninput="currentDebtItems[${idx}].name = this.value">
          </div>
          <div class="col-4">
            <input type="number" step="0.01" class="form-input-compact w-100 font-mono" value="${item.amount || ''}" placeholder="Tutar" oninput="currentDebtItems[${idx}].amount = parseFloat(this.value) || 0; updateDebtItemsLiveTotal();">
          </div>
          <div class="col-2">
            <select class="form-input-compact w-100" onchange="currentDebtItems[${idx}].currency = this.value; updateDebtItemsLiveTotal();">
              <option value="TRY" ${item.currency === 'TRY' ? 'selected' : ''}>TRY</option>
              <option value="USD" ${item.currency === 'USD' ? 'selected' : ''}>USD</option>
              <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>EUR</option>
            </select>
          </div>
          <div class="col-1 text-end">
            <button class="btn btn-link text-danger btn-sm p-0" onclick="currentDebtItems.splice(${idx}, 1); renderDebtItems();"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      `).join('');
      updateDebtItemsLiveTotal();
    }

    function updateDebtItemsLiveTotal() {
      let totalTRY = 0;
      currentDebtItems.forEach(item => {
        let amt = Number(item.amount) || 0;
        if (item.currency === 'USD') amt *= rates.usd;
        if (item.currency === 'EUR') amt *= rates.eur;
        totalTRY += amt;
      });
      document.getElementById('debtItemsLiveTotal').innerText = '₺' + fmt(totalTRY);
    }

    function addDebtItemRow() {
      currentDebtItems.push({ name: 'FEE', amount: 0, currency: 'TRY', paid: false });
      renderDebtItems();
    }

    function quickAddPreset(presetName) {
      let curr = 'EUR';
      if (presetName === 'FEE') curr = 'TRY';
      if (presetName === 'SABİT-FEE') curr = 'USD';
      currentDebtItems.push({ name: presetName, amount: 0, currency: curr, paid: false });
      renderDebtItems();
    }

    async function saveFeeRowData() {
      if (!currentActiveProfile || currentEditingMonth === null) return;
      const casino_id = currentActiveProfile.casino.id;
      const year = currentProfileMatrixYear;
      const month = currentEditingMonth;
      const note = document.getElementById('feeGeneralNote').value;
      const newPayment = parseFloat(document.getElementById('feeNewPayment').value) || 0;
      const paymentNote = document.getElementById('feePaymentNote').value;

      let totalTRY = 0;
      currentDebtItems.forEach(item => {
        let amt = Number(item.amount) || 0;
        if (item.currency === 'USD') amt *= rates.usd;
        if (item.currency === 'EUR') amt *= rates.eur;
        totalTRY += amt;
      });

      const existing = (currentActiveProfile.fee_rows || []).find(r => r.year === year && r.month === month);
      let paid_amount = existing ? Number(existing.paid_amount) || 0 : 0;

      await fetch('api.php?action=save_fee_row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          casino_id, year, month,
          turnover: totalTRY,
          fee_amount: totalTRY,
          paid_amount,
          status: paid_amount >= totalTRY && totalTRY > 0 ? 1 : 0,
          note,
          debt_items: currentDebtItems
        })
      });

      if (newPayment > 0) {
        // Refresh to get fee_row ID
        const res = await fetch(`api.php?action=get_profile&casino_id=${casino_id}`);
        const freshProfile = await res.json();
        const updatedRow = (freshProfile.fee_rows || []).find(r => r.year === year && r.month === month);
        if (updatedRow) {
          await fetch('api.php?action=add_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fee_row_id: updatedRow.id,
              paid_amount: newPayment,
              note: paymentNote
            })
          });
        }
      }

      Swal.fire({ icon: 'success', title: 'Kaydedildi', timer: 700, showConfirmButton: false });
      
      // Refresh active profile without closing modal
      const res = await fetch(`api.php?action=get_profile&casino_id=${casino_id}`);
      const data = await res.json();
      if (data.success) {
        currentActiveProfile = data;
        const feeRows = data.fee_rows || [];
        const total = feeRows.reduce((s, r) => s + (Number(r.turnover) || 0), 0);
        const collected = feeRows.reduce((s, r) => s + (Number(r.paid_amount) || 0), 0);
        const outstanding = Math.max(0, total - collected);

        document.getElementById('profTotalUSD').innerText = '$' + fmtUSD(toUSD(total));
        document.getElementById('profTotalTRY').innerText = '₺' + fmt(total);
        document.getElementById('profCollectedUSD').innerText = '$' + fmtUSD(toUSD(collected));
        document.getElementById('profCollectedTRY').innerText = '₺' + fmt(collected);
        document.getElementById('profOutstandingUSD').innerText = '$' + fmtUSD(toUSD(outstanding));
        document.getElementById('profOutstandingTRY').innerText = '₺' + fmt(outstanding);

        renderProfileMatrixTable();
        renderProfileTimeline();
      }

      loadData();
    }

    function renderProfileTimeline() {
      const container = document.getElementById('profileTimelineContainer');
      const typeFilter = document.getElementById('timelineTypeFilter').value;
      const search = (document.getElementById('timelineSearch').value || '').trim().toLowerCase();

      const txs = (currentActiveProfile.transactions || []).map(t => ({
        kind: 'payment',
        amount: Number(t.paid_amount) || 0,
        note: t.note || 'Ödeme',
        date: t.created_at
      }));

      const entries = (currentActiveProfile.fee_rows || [])
        .filter(r => (Number(r.turnover) || 0) > 0)
        .map(r => ({
          kind: 'entry',
          amount: Number(r.turnover) || 0,
          note: `${MONTHS[r.month]} ${r.year} Borç: ` + (r.debt_items || []).map(i => `${i.name} (${i.amount} ${i.currency})`).join(', '),
          date: r.created_at || `${r.year}-${String(r.month).padStart(2,'0')}-01`
        }));

      let all = [...txs, ...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

      if (typeFilter !== 'all') all = all.filter(e => e.kind === typeFilter);
      if (search) all = all.filter(e => e.note.toLowerCase().includes(search));

      if (all.length === 0) {
        container.innerHTML = '<p class="text-secondary text-center py-4 m-0" style="font-size: 0.78rem;">Hareket bulunamadı.</p>';
        return;
      }

      container.innerHTML = all.map(e => `
        <div class="d-flex align-items-center justify-content-between p-2.5 rounded-2 mb-1.5" style="background: #090d16; border: 1px solid var(--border-color); font-size: 0.78rem;">
          <div>
            <strong class="font-mono" style="color: ${e.kind === 'payment' ? 'var(--success)' : '#38bdf8'}; font-size: 0.85rem;">${e.kind === 'payment' ? '+' : ''}₺${fmt(e.amount)}</strong>
            <small class="text-secondary d-block" style="font-size: 0.72rem;">${e.note}</small>
          </div>
          <small class="text-secondary font-mono" style="font-size: 0.7rem;">${new Date(e.date).toLocaleDateString('tr-TR')}</small>
        </div>
      `).join('');
    }

    async function saveProfileNote() {
      if (!currentActiveProfile) return;
      const notes = document.getElementById('profileNotesText').value;
      await fetch('api.php?action=save_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casino_id: currentActiveProfile.casino.id, notes })
      });
      document.getElementById('notesLastUpdated').innerText = 'Kaydedildi: ' + new Date().toLocaleTimeString('tr-TR');
      Swal.fire({ icon: 'success', title: 'Not Kaydedildi', timer: 800, showConfirmButton: false });
    }

    async function saveCasinoInfoSettings(e) {
      e.preventDefault();
      if (!currentActiveProfile) return;

      const name = document.getElementById('editInfoName').value.trim();
      const fee_type = document.getElementById('editInfoFeeType').value;
      const fee_rate = parseFloat(document.getElementById('editInfoFeeRate').value) || 0;

      await fetch('api.php?action=edit_casino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentActiveProfile.casino.id, name, fee_type, fee_rate })
      });

      Swal.fire({ icon: 'success', title: 'Güncellendi', timer: 800, showConfirmButton: false });
      loadData();
    }

    async function archiveCurrentProfileCasino() {
      if (!currentActiveProfile) return;
      bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
      archiveCasino(currentActiveProfile.casino.id, currentActiveProfile.casino.name);
    }

    // Add Casino
    function openAddCasinoModal() {
      document.getElementById('addName').value = '';
      document.getElementById('addFeeRate').value = '6.0';
      new bootstrap.Modal(document.getElementById('addCasinoModal')).show();
    }
    function toggleFeeRate(type) {
      document.getElementById('addFeeRateContainer').style.display = type === 'none' ? 'none' : 'block';
    }
    async function submitAddCasino(e) {
      e.preventDefault();
      const name = document.getElementById('addName').value.trim();
      const fee_type = document.getElementById('addFeeType').value;
      const fee_rate = parseFloat(document.getElementById('addFeeRate').value) || 0;

      const res = await fetch('api.php?action=add_casino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fee_type, fee_rate })
      });
      const data = await res.json();
      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('addCasinoModal')).hide();
        Swal.fire({ icon: 'success', title: 'Casino Eklendi', timer: 900, showConfirmButton: false });
        loadData();
      }
    }

    // Archive
    async function archiveCasino(id, name) {
      const confirm = await Swal.fire({
        title: 'Arşivlensin mi?',
        text: `"${name}" arşive taşınacak.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#38bdf8',
        cancelButtonColor: '#334155',
        confirmButtonText: 'Evet, Arşivle',
        cancelButtonText: 'İptal'
      });
      if (confirm.isConfirmed) {
        await fetch('api.php?action=archive_casino', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        Swal.fire({ icon: 'success', title: 'Arşivlendi', timer: 800, showConfirmButton: false });
        loadData();
      }
    }

    async function openArchiveModal() {
      const res = await fetch('api.php?action=get_archive');
      const data = await res.json();
      const container = document.getElementById('archiveListContainer');
      const list = data.list || [];

      if (list.length === 0) {
        container.innerHTML = '<p class="text-secondary text-center py-4 m-0" style="font-size: 0.78rem;">Arşivde casino bulunmuyor.</p>';
      } else {
        container.innerHTML = list.map(item => `
          <div class="d-flex align-items-center justify-content-between p-2.5 rounded-2 mb-1.5" style="background: #090d16; border: 1px solid var(--border-color); font-size: 0.78rem;">
            <div>
              <strong class="text-white d-block">${item.name}</strong>
              <small class="text-secondary" style="font-size: 0.7rem;">${item.fee_type === 'percent' ? '%' + item.fee_rate : item.fee_type}</small>
            </div>
            <button class="btn-badge-profil" onclick="restoreCasino(${item.id})">
              ↩ Geri Yükle
            </button>
          </div>
        `).join('');
      }

      new bootstrap.Modal(document.getElementById('archiveModal')).show();
    }

    async function restoreCasino(id) {
      await fetch('api.php?action=restore_casino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      bootstrap.Modal.getInstance(document.getElementById('archiveModal')).hide();
      Swal.fire({ icon: 'success', title: 'Geri Yüklendi', timer: 800, showConfirmButton: false });
      loadData();
    }

    // Expenses
    async function openExpensesModal() {
      const res = await fetch(`api.php?action=get_expenses&year=${currentYear}`);
      const data = await res.json();
      const tbody = document.getElementById('expensesTableBody');
      const list = data.expenses || [];

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-secondary" style="font-size: 0.78rem;">Kayıtlı gider yok.</td></tr>';
      } else {
        tbody.innerHTML = list.map(e => `
          <tr>
            <td class="fw-semibold text-white">${e.name}</td>
            <td>${MONTHS[e.month]}</td>
            <td class="text-end font-mono" style="color: var(--danger); font-weight: 600;">${fmt(e.amount)} ${e.currency}</td>
            <td class="text-end">
              <button class="btn btn-link text-danger btn-sm p-0" onclick="deleteExpense(${e.id})"><i class="fa-solid fa-xmark"></i></button>
            </td>
          </tr>
        `).join('');
      }

      new bootstrap.Modal(document.getElementById('expensesModal')).show();
    }

    async function submitAddExpense(e) {
      e.preventDefault();
      const name = document.getElementById('expName').value;
      const amount = parseFloat(document.getElementById('expAmount').value) || 0;
      const currency = document.getElementById('expCurrency').value;
      const month = parseInt(document.getElementById('expMonth').value);

      await fetch('api.php?action=add_expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount, currency, year: currentYear, month })
      });

      document.getElementById('expName').value = '';
      document.getElementById('expAmount').value = '';
      openExpensesModal();
    }

    async function deleteExpense(id) {
      await fetch('api.php?action=delete_expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      openExpensesModal();
    }

    // Excel Export
    function exportReportsToExcel() {
      const casinos = appData.casinos || [];
      const data = casinos.map(c => {
        const stats = casinoStats(c);
        return {
          'Casino': c.name,
          'Ay Sayısı': stats.months,
          'Beklenen (USD)': Number(toUSD(stats.total).toFixed(2)),
          'Beklenen (TRY)': Number(stats.total.toFixed(2)),
          'Tahsil (USD)': Number(toUSD(stats.collected).toFixed(2)),
          'Tahsil (TRY)': Number(stats.collected.toFixed(2)),
          'Bekleyen (USD)': Number(toUSD(stats.outstanding).toFixed(2)),
          'Bekleyen (TRY)': Number(stats.outstanding.toFixed(2)),
          'Tahsilat Oranı %': Number(stats.rate.toFixed(1))
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Rapor ${currentYear}`);
      XLSX.writeFile(wb, `Casino_Raporu_${currentYear}.xlsx`);
    }

    document.addEventListener('DOMContentLoaded', () => {
      loadData();
    });
  </script>
</body>
</html>
