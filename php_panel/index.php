<?php
require_once __DIR__ . '/config.php';
$rates = getExchangeRates();
?>
<!DOCTYPE html>
<html lang="tr" data-bs-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Casino Takip & Finansal Rapor Paneli</title>
  
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- FontAwesome 6 Pro/Free -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- Google Fonts: Inter & JetBrains Mono -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- SweetAlert2 -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <!-- SheetJS (Excel Dışa Aktarma) -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

  <style>
    :root {
      --bg-base: #0a0a14;
      --bg-surface: #121222;
      --bg-card: #16162a;
      --bg-card-alt: #1a1a32;
      --bg-card-hover: #1f1f3d;
      --border-color: #242442;
      --border-accent: #2e2e54;
      --accent: #fbbf24;
      --accent-hover: #f59e0b;
      --accent-dim: rgba(251, 191, 36, 0.12);
      --success: #22c55e;
      --success-dim: rgba(34, 197, 94, 0.12);
      --danger: #ef4444;
      --danger-dim: rgba(239, 68, 68, 0.12);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-base);
      color: var(--text-main);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    
    .font-mono { font-family: 'JetBrains Mono', monospace; }

    /* Navbar */
    .navbar-custom {
      background-color: rgba(15, 15, 28, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      padding: 0.85rem 1.5rem;
    }

    /* KPI Cards */
    .card-kpi {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }
    .card-kpi:hover {
      border-color: rgba(251, 191, 36, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -10px rgba(0,0,0,0.5);
    }

    /* Table */
    .table-container {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }
    .table-custom {
      margin-bottom: 0;
      color: var(--text-main);
    }
    .table-custom thead th {
      background-color: #0e0e1a;
      border-bottom: 1px solid var(--border-accent);
      color: var(--text-muted);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 1rem 1.15rem;
    }
    .table-custom tbody tr {
      border-bottom: 1px solid #1a1a2e;
      transition: background-color 0.15s ease;
    }
    .table-custom tbody tr:hover {
      background-color: var(--bg-card-hover);
    }
    .table-custom td {
      padding: 0.95rem 1.15rem;
      vertical-align: middle;
    }

    /* Buttons */
    .btn-gold {
      background-color: var(--accent);
      color: #0b0b14;
      font-weight: 700;
      border: none;
      transition: all 0.2s ease;
    }
    .btn-gold:hover {
      background-color: var(--accent-hover);
      color: #000;
      transform: scale(1.02);
    }
    
    .btn-year {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.35rem 0.9rem;
      border-radius: 10px;
      transition: all 0.2s;
    }
    .btn-year.active {
      background: var(--accent);
      color: #0b0b14;
      border-color: var(--accent);
    }

    .btn-profile-badge {
      background: rgba(251, 191, 36, 0.08);
      color: var(--accent);
      border: 1px solid rgba(251, 191, 36, 0.35);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .btn-profile-badge:hover {
      background: var(--accent);
      color: #000;
      border-color: var(--accent);
    }

    .btn-archive-badge {
      background: rgba(148, 163, 184, 0.08);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.25);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .btn-archive-badge:hover {
      background: #334155;
      color: #fff;
    }

    /* Modals */
    .modal-content-dark {
      background-color: #121222;
      border: 1px solid var(--border-accent);
      border-radius: 20px;
      color: var(--text-main);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
    }
    .modal-header-dark {
      border-bottom: 1px solid var(--border-color);
      padding: 1.25rem 1.5rem;
    }
    .modal-footer-dark {
      border-top: 1px solid var(--border-color);
      padding: 1rem 1.5rem;
    }

    .form-control-dark, .form-select-dark {
      background-color: #0c0c16;
      border: 1px solid var(--border-accent);
      color: #fff;
      border-radius: 10px;
    }
    .form-control-dark:focus, .form-select-dark:focus {
      background-color: #0c0c16;
      border-color: var(--accent);
      color: #fff;
      box-shadow: 0 0 0 0.25rem rgba(251, 191, 36, 0.15);
    }

    .progress-thin {
      height: 6px;
      border-radius: 4px;
      background-color: #1c1c34;
    }

    /* Preset Chips */
    .chip-preset {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.3rem 0.65rem;
      border-radius: 8px;
      background: #181830;
      border: 1px solid var(--border-accent);
      color: #cbd5e1;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip-preset:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-dim);
    }

    /* Excel Matrix Cells */
    .matrix-cell {
      padding: 0.6rem 0.8rem;
      border-radius: 8px;
      text-align: right;
      font-size: 0.78rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .matrix-paid { background: rgba(34, 197, 94, 0.1); color: var(--success); border: 1px solid rgba(34, 197, 94, 0.25); }
    .matrix-partial { background: rgba(251, 191, 36, 0.1); color: var(--accent); border: 1px solid rgba(251, 191, 36, 0.25); }
    .matrix-debt { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.25); }
    .matrix-empty { color: var(--text-dim); }

    /* Custom Nav Pills */
    .nav-pills-dark .nav-link {
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.5rem 1.1rem;
      border-radius: 10px;
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .nav-pills-dark .nav-link.active {
      background: var(--accent-dim);
      color: var(--accent);
      border-color: rgba(251, 191, 36, 0.35);
    }

    /* Scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0a0a12; }
    ::-webkit-scrollbar-thumb { background: #282844; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #3c3c66; }
  </style>
</head>
<body>

  <!-- Navbar -->
  <nav class="navbar navbar-expand-lg navbar-custom sticky-top">
    <div class="container-fluid">
      <a class="navbar-brand d-flex align-items-center gap-2.5 fw-bold text-white fs-5" href="#">
        <span class="d-inline-flex align-items-center justify-content-center rounded-3 px-2 py-1" style="background: var(--accent-dim); color: var(--accent); font-size: 1.2rem;">♠</span>
        <span>Casino Takip <span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 ms-1 fw-normal" style="font-size: 0.65rem;">PRO</span></span>
      </a>

      <!-- Live Currency Rates -->
      <div class="d-none d-md-flex align-items-center gap-3 ms-4 px-3 py-1.5 rounded-pill" style="background: #141424; border: 1px solid var(--border-color); font-size: 0.78rem;">
        <div><span class="text-muted">USD/TRY:</span> <strong class="text-white font-mono" id="rateUSD">₺<?= number_format($rates['usd'], 2) ?></strong></div>
        <div class="vr bg-secondary opacity-25"></div>
        <div><span class="text-muted">EUR/TRY:</span> <strong class="text-white font-mono" id="rateEUR">₺<?= number_format($rates['eur'], 2) ?></strong></div>
      </div>

      <div class="ms-auto d-flex align-items-center gap-2">
        <!-- Year Switcher -->
        <div class="btn-group me-2" id="yearButtons">
          <button class="btn btn-year" onclick="setYear(2025)">2025</button>
          <button class="btn btn-year active" onclick="setYear(2026)">2026</button>
          <button class="btn btn-year" onclick="setYear(2027)">2027</button>
        </div>

        <button class="btn btn-gold btn-sm px-3 rounded-pill d-flex align-items-center gap-1.5" onclick="openAddCasinoModal()">
          <i class="fa-solid fa-plus"></i> Casino Ekle
        </button>

        <button class="btn btn-outline-secondary btn-sm px-3 rounded-pill d-flex align-items-center gap-1.5" onclick="openArchiveModal()">
          <i class="fa-solid fa-box-archive"></i> Arşiv <span class="badge bg-warning text-dark ms-1" id="badgeArchive">0</span>
        </button>

        <button class="btn btn-outline-secondary btn-sm px-3 rounded-pill d-flex align-items-center gap-1.5" onclick="openExpensesModal()">
          <i class="fa-solid fa-receipt"></i> Giderler
        </button>

        <button class="btn btn-outline-secondary btn-sm rounded-circle" style="width: 32px; height: 32px; padding: 0;" onclick="exportReportsToExcel()" title="Excel İndir">
          <i class="fa-solid fa-file-excel text-success"></i>
        </button>

        <button class="btn btn-outline-secondary btn-sm rounded-circle" style="width: 32px; height: 32px; padding: 0;" onclick="loadData()" title="Yenile">
          <i class="fa-solid fa-rotate-right" id="refreshIcon"></i>
        </button>
      </div>
    </div>
  </nav>

  <!-- Main Container -->
  <div class="container-fluid py-4 px-3 px-md-4">
    
    <!-- Top Summary KPI Cards -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <div class="card-kpi">
          <div class="text-muted small fw-semibold mb-1 d-flex justify-content-between">
            <span>Toplam Beklenen</span>
            <i class="fa-solid fa-wallet opacity-50"></i>
          </div>
          <div class="fs-4 fw-bold text-white font-mono" id="cardTotalUSD">$0.00</div>
          <div class="small text-muted font-mono" id="cardTotalTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card-kpi">
          <div class="text-muted small fw-semibold mb-1 d-flex justify-content-between">
            <span>Tahsil Edilen</span>
            <i class="fa-solid fa-circle-check text-success opacity-75"></i>
          </div>
          <div class="fs-4 fw-bold text-success font-mono" id="cardCollectedUSD">$0.00</div>
          <div class="small text-muted font-mono" id="cardCollectedTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card-kpi">
          <div class="text-muted small fw-semibold mb-1 d-flex justify-content-between">
            <span>Bekleyen Borç</span>
            <i class="fa-solid fa-circle-exclamation text-danger opacity-75"></i>
          </div>
          <div class="fs-4 fw-bold text-danger font-mono" id="cardOutstandingUSD">$0.00</div>
          <div class="small text-muted font-mono" id="cardOutstandingTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card-kpi">
          <div class="text-muted small fw-semibold mb-1 d-flex justify-content-between">
            <span>Tahsilat Oranı</span>
            <i class="fa-solid fa-chart-pie opacity-50"></i>
          </div>
          <div class="fs-4 fw-bold text-warning font-mono" id="cardRatePercent">%0.0</div>
          <div class="progress progress-thin mt-2">
            <div class="progress-bar bg-warning" id="cardProgressBar" style="width: 0%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Title & Month Filter -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
      <div class="d-flex align-items-center gap-2">
        <h5 class="fw-bold m-0 text-white">Casino Raporu — <span id="titleYear">2026</span></h5>
        <span class="badge bg-dark border border-secondary border-opacity-25 text-muted px-2.5 py-1" style="font-size: 0.75rem;" id="casinoCountBadge">0 casino</span>
      </div>

      <!-- Month Filter Dropdown -->
      <div class="d-flex align-items-center gap-2">
        <label class="small text-muted d-none d-sm-block">Dönem:</label>
        <select class="form-select form-select-sm form-select-dark" id="monthFilter" style="width: 140px; font-weight: 600;" onchange="filterMonth(this.value)">
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
      </div>
    </div>

    <!-- Casino Reports Table -->
    <div class="table-container shadow-sm">
      <div class="table-responsive">
        <table class="table table-custom table-hover align-middle">
          <thead>
            <tr>
              <th onclick="sortTable('name')" style="cursor: pointer;">CASİNO <i class="fa-solid fa-sort ms-1 opacity-40"></i></th>
              <th onclick="sortTable('months')" class="text-center" style="cursor: pointer; width: 80px;">AY <i class="fa-solid fa-sort ms-1 opacity-40"></i></th>
              <th onclick="sortTable('total')" class="text-end" style="cursor: pointer;">BEKLENEN <i class="fa-solid fa-sort ms-1 opacity-40"></i></th>
              <th onclick="sortTable('collected')" class="text-end" style="cursor: pointer;">TAHSİL <i class="fa-solid fa-sort ms-1 opacity-40"></i></th>
              <th onclick="sortTable('outstanding')" class="text-end" style="cursor: pointer;">BEKLEYEN <i class="fa-solid fa-sort ms-1 opacity-40"></i></th>
              <th onclick="sortTable('rate')" class="text-end" style="cursor: pointer; width: 140px;">ORAN % <i class="fa-solid fa-sort ms-1 opacity-40"></i></th>
              <th class="text-end" style="width: 80px;">İŞLEM</th>
            </tr>
          </thead>
          <tbody id="tableBody">
            <tr>
              <td colspan="7" class="text-center py-5 text-muted">
                <div class="spinner-border spinner-border-sm text-warning me-2" role="status"></div> Veriler yükleniyor...
              </td>
            </tr>
          </tbody>
          <tfoot class="border-top" style="background: #0c0c16; font-weight: 700;">
            <tr>
              <td class="text-white">TOPLAM</td>
              <td class="text-center text-muted font-mono" id="footMonths">-</td>
              <td class="text-end font-mono" id="footTotal">-</td>
              <td class="text-end text-success font-mono" id="footCollected">-</td>
              <td class="text-end text-danger font-mono" id="footOutstanding">-</td>
              <td class="text-end text-warning font-mono" id="footRate">%0.0</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- MODAL: PROFİL & MATRIX DETAYLARI (FULL REPLICA)       -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="profileModal" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content modal-content-dark">
        <!-- Modal Header -->
        <div class="modal-header modal-header-dark d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-3 p-2.5 d-flex align-items-center justify-content-center" style="background: var(--accent-dim); color: var(--accent); font-size: 1.3rem;">
              <i class="fa-solid fa-user-tie"></i>
            </div>
            <div>
              <h5 class="modal-title fw-bold text-white m-0" id="profileModalTitle">Casino Adı</h5>
              <small class="text-muted" id="profileModalSub">Profil · Hareket Geçmişi</small>
            </div>
          </div>
          
          <div class="d-flex align-items-center gap-2">
            <!-- Dropdown Seçenekler -->
            <div class="dropdown">
              <button class="btn btn-outline-secondary btn-sm rounded-pill px-3 dropdown-toggle" data-bs-toggle="dropdown">
                <i class="fa-solid fa-ellipsis me-1"></i> Seçenekler
              </button>
              <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow-lg" style="background: #16162a; border-color: var(--border-accent);">
                <li>
                  <a class="dropdown-item text-warning d-flex align-items-center gap-2 py-2" href="#" onclick="archiveCurrentProfileCasino()">
                    <i class="fa-solid fa-box-archive"></i> Bu Casinoyu Arşivle
                  </a>
                </li>
              </ul>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="modal-body p-4">
          <!-- Top Overall Summary Cards -->
          <div class="p-3 rounded-4 mb-4" style="background: #0d0d1a; border: 1px solid var(--border-color);">
            <div class="row g-2 text-center mb-3">
              <div class="col-4">
                <div class="p-2.5 rounded-3" style="background: #141426;">
                  <small class="text-muted d-block mb-1" style="font-size: 0.72rem;">Beklenen</small>
                  <strong class="fs-5 text-white font-mono" id="profTotalUSD">$0.00</strong>
                  <div class="small text-muted font-mono" id="profTotalTRY" style="font-size: 0.7rem;">₺0,00</div>
                </div>
              </div>
              <div class="col-4">
                <div class="p-2.5 rounded-3" style="background: #141426;">
                  <small class="text-muted d-block mb-1" style="font-size: 0.72rem;">Tahsil Edilen</small>
                  <strong class="fs-5 text-success font-mono" id="profCollectedUSD">$0.00</strong>
                  <div class="small text-muted font-mono" id="profCollectedTRY" style="font-size: 0.7rem;">₺0,00</div>
                </div>
              </div>
              <div class="col-4">
                <div class="p-2.5 rounded-3" style="background: #141426;">
                  <small class="text-muted d-block mb-1" style="font-size: 0.72rem;">Bekleyen</small>
                  <strong class="fs-5 text-danger font-mono" id="profOutstandingUSD">$0.00</strong>
                  <div class="small text-muted font-mono" id="profOutstandingTRY" style="font-size: 0.7rem;">₺0,00</div>
                </div>
              </div>
            </div>

            <!-- Rate Progress -->
            <div>
              <div class="d-flex justify-content-between small text-muted mb-1" style="font-size: 0.72rem;">
                <span>Tüm zamanlar tahsilat oranı</span>
                <strong class="text-warning font-mono" id="profRateLabel">%0.0</strong>
              </div>
              <div class="progress progress-thin">
                <div class="progress-bar bg-warning" id="profProgressBar" style="width: 0%;"></div>
              </div>
            </div>
          </div>

          <!-- Tab Navigation -->
          <ul class="nav nav-pills nav-pills-dark mb-3 gap-2 border-bottom pb-2" id="profileTabs">
            <li class="nav-item">
              <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#tabTable">📊 Tablo</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" data-bs-toggle="pill" data-bs-target="#tabTimeline">🕒 Hareketler</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" data-bs-toggle="pill" data-bs-target="#tabInfo">ℹ️ Bilgiler</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" data-bs-toggle="pill" data-bs-target="#tabNotes">📝 Notlar</button>
            </li>
          </ul>

          <div class="tab-content pt-2">
            <!-- ══ TAB 1: EXCEL MATRIX TABLO ══ -->
            <div class="tab-pane fade show active" id="tabTable">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="btn-group btn-group-sm" id="profMatrixYearButtons"></div>
                <small class="text-muted" style="font-size: 0.72rem;">* Satıra tıklayarak o ayı düzenleyebilirsin</small>
              </div>

              <div class="table-responsive rounded-3 border" style="border-color: var(--border-color) !important; max-height: 55vh;">
                <table class="table table-custom table-sm mb-0">
                  <thead class="sticky-top" style="background: #0f0f1c; z-index: 5;">
                    <tr>
                      <th style="width: 100px;">AY</th>
                      <th class="text-end">FEE (₺)</th>
                      <th class="text-end">BORÇ TOPLAMI (₺)</th>
                      <th class="text-end">ÖDENEN (₺)</th>
                      <th class="text-end">KALAN (₺)</th>
                      <th class="text-center" style="width: 90px;">DURUM</th>
                      <th class="text-end" style="width: 50px;"></th>
                    </tr>
                  </thead>
                  <tbody id="profileMatrixBody"></tbody>
                  <tfoot class="sticky-bottom" style="background: #0c0c16; font-weight: 700; z-index: 5;">
                    <tr>
                      <td class="text-white">TOPLAM</td>
                      <td class="text-end font-mono" id="profFootFee">-</td>
                      <td class="text-end font-mono" id="profFootTotal">-</td>
                      <td class="text-end text-success font-mono" id="profFootPaid">-</td>
                      <td class="text-end text-danger font-mono" id="profFootRem">-</td>
                      <td colspan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- ══ TAB 2: HAREKET GEÇMİŞİ ══ -->
            <div class="tab-pane fade" id="tabTimeline">
              <!-- Filters -->
              <div class="row g-2 mb-3">
                <div class="col-md-4">
                  <select class="form-select form-select-sm form-select-dark" id="timelineTypeFilter" onchange="renderProfileTimeline()">
                    <option value="all">Tüm Hareketler</option>
                    <option value="payment">Sadece Ödemeler (+)</option>
                    <option value="entry">Sadece Borç Girişleri (-)</option>
                  </select>
                </div>
                <div class="col-md-8">
                  <input type="text" class="form-control form-control-sm form-control-dark" id="timelineSearch" placeholder="Açıklama veya not içinde ara..." oninput="renderProfileTimeline()">
                </div>
              </div>

              <div id="profileTimelineContainer" style="max-height: 52vh; overflow-y: auto;"></div>
            </div>

            <!-- ══ TAB 3: BİLGİLER DÜZENLE ══ -->
            <div class="tab-pane fade" id="tabInfo">
              <form onsubmit="saveCasinoInfoSettings(event)" class="p-3 rounded-3" style="background: #0d0d1a; border: 1px solid var(--border-color); max-width: 600px;">
                <div class="mb-3">
                  <label class="form-label small text-muted">Casino İsmi</label>
                  <input type="text" class="form-control form-control-dark" id="editInfoName" required>
                </div>
                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label class="form-label small text-muted">Fee Türü</label>
                    <select class="form-select form-select-dark" id="editInfoFeeType">
                      <option value="percent">Yüzdelik (%)</option>
                      <option value="fixed">Sabit Fee</option>
                      <option value="none">Fee Yok</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label small text-muted">Fee Oranı (%)</label>
                    <input type="number" step="0.1" class="form-control form-control-dark" id="editInfoFeeRate">
                  </div>
                </div>
                <div class="d-flex justify-content-end">
                  <button type="submit" class="btn btn-gold btn-sm rounded-pill px-4">
                    <i class="fa-solid fa-floppy-disk me-1"></i> Güncelle
                  </button>
                </div>
              </form>
            </div>

            <!-- ══ TAB 4: NOTLAR ══ -->
            <div class="tab-pane fade" id="tabNotes">
              <div class="p-3 rounded-3" style="background: #0d0d1a; border: 1px solid var(--border-color);">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="small text-muted fw-bold">ÖZEL CASINO NOTLARI</label>
                  <small class="text-muted" id="notesLastUpdated">Son güncelleme: -</small>
                </div>
                <textarea class="form-control form-control-dark font-mono" id="profileNotesText" rows="8" placeholder="Casino ile ilgili özel notlar, anlaşma şartları veya iletişim detayları..."></textarea>
                <div class="d-flex justify-content-end mt-3">
                  <button class="btn btn-gold btn-sm rounded-pill px-4" onclick="saveProfileNote()">
                    <i class="fa-solid fa-floppy-disk me-1"></i> Notları Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- MODAL: AY VE BORÇ KALEMLERİ DÜZENLEME (FEE MODAL)    -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="feeModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content modal-content-dark">
        <div class="modal-header modal-header-dark">
          <h5 class="modal-title fw-bold text-white d-flex align-items-center gap-2" id="feeModalTitle">
            <i class="fa-solid fa-calendar-days text-warning"></i> Ay Düzenle
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <input type="hidden" id="feeCasinoId">
          <input type="hidden" id="feeYear">
          <input type="hidden" id="feeMonth">

          <!-- Hızlı Preset Çipleri -->
          <div class="mb-3">
            <label class="small text-muted fw-bold d-block mb-1.5">HIZLI KALEM EKLE</label>
            <div class="d-flex flex-wrap gap-1.5">
              <span class="chip-preset" onclick="quickAddPreset('MAKİNA KİRASI')">+ MAKİNA KİRASI</span>
              <span class="chip-preset" onclick="quickAddPreset('DEPOZİTO')">+ DEPOZİTO</span>
              <span class="chip-preset" onclick="quickAddPreset('SERVER ÜCRETİ')">+ SERVER ÜCRETİ</span>
              <span class="chip-preset" onclick="quickAddPreset('RTP')">+ RTP</span>
              <span class="chip-preset" onclick="quickAddPreset('KİRA')">+ KİRA</span>
              <span class="chip-preset" onclick="quickAddPreset('SABİT-FEE')">+ SABİT-FEE</span>
              <span class="chip-preset" onclick="quickAddPreset('FEE')">+ FEE</span>
            </div>
          </div>

          <!-- Borç Kalemleri Form Listesi -->
          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="small text-muted fw-bold">BORÇ KALEMLERİ LİSTESİ</label>
              <button class="btn btn-outline-warning btn-sm rounded-pill py-0.5 px-2.5" onclick="addDebtItemRow()">
                <i class="fa-solid fa-plus"></i> Yeni Kalem Ekle
              </button>
            </div>
            <div id="debtItemsContainer" class="space-y-2"></div>
            
            <!-- Live Calculated Total -->
            <div class="p-2.5 rounded-3 mt-2 d-flex justify-content-between align-items-center" style="background: #0a0a14; border: 1px solid var(--border-color);">
              <span class="small text-muted">Kalemler Toplamı (TRY):</span>
              <strong class="text-white font-mono fs-6" id="debtItemsLiveTotal">₺0,00</strong>
            </div>
          </div>

          <!-- Yeni Ödeme / Tahsilat Ekleme -->
          <div class="p-3 rounded-3 mb-3" style="background: #0a0a14; border: 1px solid var(--border-color);">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="small text-muted fw-bold text-success"><i class="fa-solid fa-plus-circle me-1"></i> TAHSİLAT / ÖDEME EKLE</label>
              <small class="text-muted" id="feeCurrentPaidAmount">Mevcut Ödenen: ₺0,00</small>
            </div>
            <div class="row g-2">
              <div class="col-md-6">
                <input type="number" step="0.01" class="form-control form-control-dark font-mono" id="feeNewPayment" placeholder="Ödenen Tutar (₺)">
              </div>
              <div class="col-md-6">
                <input type="text" class="form-control form-control-dark" id="feePaymentNote" placeholder="Ödeme Notu (Örn: Banka Transfer)">
              </div>
            </div>
          </div>

          <div class="mb-2">
            <label class="small text-muted">Açıklama / Not</label>
            <input type="text" class="form-control form-control-dark" id="feeGeneralNote" placeholder="Bu ay için genel not...">
          </div>
        </div>
        <div class="modal-footer modal-footer-dark">
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3" data-bs-dismiss="modal">Kapat</button>
          <button type="button" class="btn btn-gold btn-sm rounded-pill px-4" onclick="saveFeeRowData()">Kaydet</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- MODAL: CASINO EKLE                                    -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="addCasinoModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content modal-content-dark">
        <div class="modal-header modal-header-dark">
          <h5 class="modal-title fw-bold text-white"><i class="fa-solid fa-circle-plus text-warning me-2"></i> Yeni Casino Ekle</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <form onsubmit="submitAddCasino(event)">
          <div class="modal-body p-4 space-y-3">
            <div class="mb-3">
              <label class="form-label small text-muted">Casino Adı</label>
              <input type="text" class="form-control form-control-dark" id="addName" required placeholder="Örn: ELEXUS VIP">
            </div>
            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label small text-muted">Fee Türü</label>
                <select class="form-select form-select-dark" id="addFeeType" onchange="toggleFeeRate(this.value)">
                  <option value="percent">Yüzdelik (%)</option>
                  <option value="fixed">Sabit Fee</option>
                  <option value="none">Fee Yok</option>
                </select>
              </div>
              <div class="col-6" id="addFeeRateContainer">
                <label class="form-label small text-muted">Fee Oranı (%)</label>
                <input type="number" step="0.1" class="form-control form-control-dark" id="addFeeRate" value="6.0" placeholder="6.0">
              </div>
            </div>
          </div>
          <div class="modal-footer modal-footer-dark">
            <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill" data-bs-dismiss="modal">İptal</button>
            <button type="submit" class="btn btn-gold btn-sm rounded-pill px-4">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- MODAL: ARŞİVLENEN CASİNOLAR                          -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="archiveModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content modal-content-dark">
        <div class="modal-header modal-header-dark">
          <h5 class="modal-title fw-bold text-white"><i class="fa-solid fa-box-archive text-warning me-2"></i> Arşivlenen Casinolar</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <div id="archiveListContainer">
            <p class="text-muted text-center py-4">Arşivde casino bulunmuyor.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- MODAL: GİDERLER                                       -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="expensesModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content modal-content-dark">
        <div class="modal-header modal-header-dark">
          <h5 class="modal-title fw-bold text-white"><i class="fa-solid fa-receipt text-warning me-2"></i> Aylık Giderler</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <form onsubmit="submitAddExpense(event)" class="p-3 rounded-3 mb-4" style="background: #0e0e1c; border: 1px solid var(--border-color);">
            <h6 class="fw-bold mb-3 text-warning">Yeni Gider Ekle</h6>
            <div class="row g-2">
              <div class="col-md-4">
                <input type="text" class="form-control form-control-dark" id="expName" required placeholder="Gider Adı (Örn: Server)">
              </div>
              <div class="col-md-3">
                <input type="number" step="0.01" class="form-control form-control-dark font-mono" id="expAmount" required placeholder="Tutar">
              </div>
              <div class="col-md-2">
                <select class="form-select form-select-dark" id="expCurrency">
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div class="col-md-3">
                <select class="form-select form-select-dark" id="expMonth">
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
              <div class="col-12 mt-2 d-flex justify-content-end">
                <button type="submit" class="btn btn-gold btn-sm rounded-pill px-4">Gider Ekle</button>
              </div>
            </div>
          </form>

          <div class="table-responsive rounded-3 border" style="border-color: var(--border-color) !important;">
            <table class="table table-custom table-sm mb-0">
              <thead>
                <tr>
                  <th>GİDER ADI</th>
                  <th>AY</th>
                  <th class="text-end">TUTAR</th>
                  <th class="text-end">SİL</th>
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

  <!-- Core Dashboard Application Script -->
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
      document.querySelectorAll('#yearButtons .btn-year').forEach(btn => {
        btn.classList.toggle('active', btn.innerText == y);
      });
      loadData();
    }

    function filterMonth(m) {
      selectedMonth = parseInt(m);
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
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted">Kayıtlı casino bulunamadı.</td></tr>';
        return;
      }

      const tableData = casinos.map(c => ({ casino: c, ...casinoStats(c) })).sort((a, b) => {
        const mult = sortDir === 'asc' ? 1 : -1;
        if (sortKey === 'name') return a.casino.name.localeCompare(b.casino.name, 'tr') * mult;
        return ((Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0)) * mult;
      });

      // Toplamları Hesapla
      const totals = tableData.reduce((s, r) => ({
        total: s.total + (Number(r.total) || 0),
        scopedTotal: s.scopedTotal + (Number(r.scopedTotal) || 0),
        collected: s.collected + (Number(r.collected) || 0),
        outstanding: s.outstanding + (Number(r.outstanding) || 0),
        months: s.months + r.months
      }), { total: 0, scopedTotal: 0, collected: 0, outstanding: 0, months: 0 });

      const overallRate = totals.scopedTotal > 0 ? (totals.collected / totals.scopedTotal) * 100 : 0;

      // KPI Kartları Güncelle
      document.getElementById('cardTotalUSD').innerText = '$' + fmtUSD(toUSD(totals.scopedTotal));
      document.getElementById('cardTotalTRY').innerText = '₺' + fmt(totals.scopedTotal);

      document.getElementById('cardCollectedUSD').innerText = '$' + fmtUSD(toUSD(totals.collected));
      document.getElementById('cardCollectedTRY').innerText = '₺' + fmt(totals.collected);

      document.getElementById('cardOutstandingUSD').innerText = '$' + fmtUSD(toUSD(totals.outstanding));
      document.getElementById('cardOutstandingTRY').innerText = '₺' + fmt(totals.outstanding);

      document.getElementById('cardRatePercent').innerText = '%' + overallRate.toFixed(1);
      document.getElementById('cardProgressBar').style.width = Math.min(100, overallRate) + '%';
      document.getElementById('cardProgressBar').className = 'progress-bar ' + (overallRate >= 100 ? 'bg-success' : overallRate > 50 ? 'bg-warning' : 'bg-danger');

      // Tablo Satırları
      tbody.innerHTML = tableData.map(row => {
        const c = row.casino;
        const rateColor = row.rate >= 100 ? 'text-success' : row.rate > 50 ? 'text-warning' : 'text-danger';
        const progressBg = row.rate >= 100 ? 'bg-success' : row.rate > 50 ? 'bg-warning' : 'bg-danger';

        return `
          <tr>
            <td>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="fw-bold text-white">${c.name}</span>
                <button class="btn btn-profile-badge" onclick="openProfileModal(${c.id})">
                  <i class="fa-solid fa-user me-1"></i> Profil
                </button>
                <button class="btn btn-archive-badge" onclick="archiveCasino(${c.id}, '${c.name.replace(/'/g, "\\'")}')">
                  <i class="fa-solid fa-box-archive me-1"></i> Arşivle
                </button>
              </div>
            </td>
            <td class="text-center text-muted fw-semibold font-mono">${row.months}</td>
            <td class="text-end">
              <div class="fw-bold text-white font-mono">$${fmtUSD(toUSD(row.total))}</div>
              <small class="text-muted font-mono">₺${fmt(row.total)}</small>
            </td>
            <td class="text-end">
              <div class="fw-bold text-success font-mono">$${fmtUSD(toUSD(row.collected))}</div>
              <small class="text-muted font-mono">₺${fmt(row.collected)}</small>
            </td>
            <td class="text-end">
              <div class="fw-bold ${row.outstanding > 0 ? 'text-danger' : 'text-success'} font-mono">$${fmtUSD(toUSD(row.outstanding))}</div>
              <small class="text-muted font-mono">₺${fmt(row.outstanding)}</small>
            </td>
            <td class="text-end">
              <div class="d-flex align-items-center justify-content-end gap-2">
                <div class="progress progress-thin flex-grow-1" style="max-width: 60px;">
                  <div class="progress-bar ${progressBg}" style="width: ${Math.min(100, row.rate)}%"></div>
                </div>
                <span class="fw-bold ${rateColor} font-mono" style="font-size: 0.8rem; width: 45px;">%${row.rate.toFixed(0)}</span>
              </div>
            </td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-secondary rounded-circle" style="width: 28px; height: 28px; padding: 0;" onclick="openQuickFeeModal(${c.id})" title="Ay Düzenle">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      // Alt Toplamlar
      document.getElementById('footMonths').innerText = totals.months;
      document.getElementById('footTotal').innerHTML = `$${fmtUSD(toUSD(totals.total))}<br><small class="text-muted fw-normal font-mono">₺${fmt(totals.total)}</small>`;
      document.getElementById('footCollected').innerHTML = `$${fmtUSD(toUSD(totals.collected))}<br><small class="text-muted fw-normal font-mono">₺${fmt(totals.collected)}</small>`;
      document.getElementById('footOutstanding').innerHTML = `$${fmtUSD(toUSD(totals.outstanding))}<br><small class="text-muted fw-normal font-mono">₺${fmt(totals.outstanding)}</small>`;
      document.getElementById('footRate').innerText = `%${overallRate.toFixed(1)}`;
    }

    // ═════════════════════════════════════════════════════
    // PROFIL MODAL MANTIGI (EXCEL MATRIX & TIMELINE)
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

      // Edit Form fields
      document.getElementById('editInfoName').value = c.name;
      document.getElementById('editInfoFeeType').value = c.fee_type;
      document.getElementById('editInfoFeeRate').value = c.fee_rate;

      // Notlar
      document.getElementById('profileNotesText').value = data.notes || '';

      // Genel Toplamlar
      const feeRows = data.fee_rows || [];
      const total = feeRows.reduce((s, r) => s + (Number(r.turnover) || 0), 0);
      const collected = feeRows.reduce((s, r) => s + (Number(r.paid_amount) || 0), 0);
      const outstanding = Math.max(0, total - collected);
      const rate = total > 0 ? Math.min(100, (collected / total) * 100) : 0;

      document.getElementById('profTotalUSD').innerText = '$' + fmtUSD(toUSD(total));
      document.getElementById('profTotalTRY').innerText = '₺' + fmt(total);

      document.getElementById('profCollectedUSD').innerText = '$' + fmtUSD(toUSD(collected));
      document.getElementById('profCollectedTRY').innerText = '₺' + fmt(collected);

      document.getElementById('profOutstandingUSD').innerText = '$' + fmtUSD(toUSD(outstanding));
      document.getElementById('profOutstandingTRY').innerText = '₺' + fmt(outstanding);

      document.getElementById('profRateLabel').innerText = '%' + rate.toFixed(1);
      document.getElementById('profProgressBar').style.width = rate + '%';
      document.getElementById('profProgressBar').className = 'progress-bar ' + (rate >= 100 ? 'bg-success' : rate > 50 ? 'bg-warning' : 'bg-danger');

      // Yıl Seçici Butonları
      currentProfileMatrixYear = currentYear;
      renderProfileMatrixYears();
      renderProfileMatrixTable();
      renderProfileTimeline();

      new bootstrap.Modal(document.getElementById('profileModal')).show();
    }

    function renderProfileMatrixYears() {
      const container = document.getElementById('profMatrixYearButtons');
      const years = [2025, 2026, 2027];
      container.innerHTML = years.map(y => `
        <button class="btn btn-sm ${y === currentProfileMatrixYear ? 'btn-gold' : 'btn-outline-secondary'}" onclick="currentProfileMatrixYear = ${y}; renderProfileMatrixYears(); renderProfileMatrixTable();">
          ${y}
        </button>
      `).join('');
    }

    function renderProfileMatrixTable() {
      const tbody = document.getElementById('profileMatrixBody');
      const rowsForYear = (currentActiveProfile.fee_rows || []).filter(r => r.year === currentProfileMatrixYear);
      const rowByMonth = new Map(rowsForYear.map(r => [r.month, r]));

      let sumFee = 0, sumTotal = 0, sumPaid = 0, sumRem = 0;

      let html = '';
      for (let m = 1; m <= 12; m++) {
        const r = rowByMonth.get(m);
        const turnover = r ? (Number(r.turnover) || 0) : 0;
        const feeAmount = r ? (Number(r.fee_amount) || 0) : 0;
        const paidAmount = r ? (Number(r.paid_amount) || 0) : 0;
        const rem = Math.max(0, turnover - paidAmount);

        sumFee += feeAmount;
        sumTotal += turnover;
        sumPaid += paidAmount;
        sumRem += rem;

        let statusCell = '<span class="text-dim">—</span>';
        if (turnover > 0 || paidAmount > 0) {
          if (turnover > 0 && paidAmount >= turnover) {
            statusCell = '<span class="badge bg-success bg-opacity-25 text-success">✓ Ödendi</span>';
          } else if (paidAmount > 0) {
            statusCell = '<span class="badge bg-warning bg-opacity-25 text-warning">≈ Kısmi</span>';
          } else {
            statusCell = '<span class="badge bg-danger bg-opacity-25 text-danger">✗ Bekliyor</span>';
          }
        }

        html += `
          <tr style="cursor: pointer;" onclick="openFeeEditModal(${currentActiveProfile.casino.id}, ${currentProfileMatrixYear}, ${m})">
            <td class="fw-bold text-white">${MONTHS[m]}</td>
            <td class="text-end font-mono">${feeAmount > 0 ? '₺' + fmt(feeAmount) : '—'}</td>
            <td class="text-end font-mono">${turnover > 0 ? '₺' + fmt(turnover) : '—'}</td>
            <td class="text-end font-mono text-success">${paidAmount > 0 ? '₺' + fmt(paidAmount) : '—'}</td>
            <td class="text-end font-mono ${rem > 0 ? 'text-danger' : 'text-muted'}">${rem > 0 ? '₺' + fmt(rem) : (turnover > 0 ? '₺0,00' : '—')}</td>
            <td class="text-center">${statusCell}</td>
            <td class="text-end">
              <button class="btn btn-link text-secondary btn-sm p-0" title="Düzenle">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
            </td>
          </tr>
        `;
      }

      tbody.innerHTML = html;
      document.getElementById('profFootFee').innerText = sumFee > 0 ? '₺' + fmt(sumFee) : '—';
      document.getElementById('profFootTotal').innerText = sumTotal > 0 ? '₺' + fmt(sumTotal) : '—';
      document.getElementById('profFootPaid').innerText = sumPaid > 0 ? '₺' + fmt(sumPaid) : '—';
      document.getElementById('profFootRem').innerText = sumRem > 0 ? '₺' + fmt(sumRem) : '—';
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
          note: `${MONTHS[r.month]} ${r.year} Borç / Ciro Girişi: ` + (r.debt_items || []).map(i => `${i.name} (${i.amount} ${i.currency})`).join(', '),
          date: r.created_at || `${r.year}-${String(r.month).padStart(2,'0')}-01`
        }));

      let all = [...txs, ...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

      if (typeFilter !== 'all') {
        all = all.filter(e => e.kind === typeFilter);
      }
      if (search) {
        all = all.filter(e => e.note.toLowerCase().includes(search));
      }

      if (all.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">Filtreye uygun hareket bulunamadı.</p>';
        return;
      }

      container.innerHTML = all.map(e => {
        const isPayment = e.kind === 'payment';
        const color = isPayment ? 'text-success' : 'text-warning';
        const icon = isPayment ? 'fa-arrow-down-long text-success' : 'fa-receipt text-warning';
        const sign = isPayment ? '+' : '';

        return `
          <div class="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2" style="background: #0d0d1a; border: 1px solid var(--border-color);">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle p-2 d-flex align-items-center justify-content-center" style="background: #18182e; width: 36px; height: 36px;">
                <i class="fa-solid ${icon}"></i>
              </div>
              <div>
                <strong class="${color} fs-6 font-mono">${sign}₺${fmt(e.amount)}</strong>
                <small class="text-muted d-block">${e.note}</small>
              </div>
            </div>
            <div class="text-end">
              <small class="text-muted d-block font-mono">${new Date(e.date).toLocaleDateString('tr-TR')}</small>
              <small class="text-dim" style="font-size: 0.68rem;">${new Date(e.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</small>
            </div>
          </div>
        `;
      }).join('');
    }

    async function saveProfileNote() {
      if (!currentActiveProfile) return;
      const notes = document.getElementById('profileNotesText').value;
      await fetch('api.php?action=save_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casino_id: currentActiveProfile.casino.id, notes })
      });
      document.getElementById('notesLastUpdated').innerText = 'Son güncelleme: ' + new Date().toLocaleTimeString('tr-TR');
      Swal.fire({ icon: 'success', title: 'Not Kaydedildi', timer: 1000, showConfirmButton: false });
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

      Swal.fire({ icon: 'success', title: 'Bilgiler Güncellendi', timer: 1000, showConfirmButton: false });
      loadData();
    }

    async function archiveCurrentProfileCasino() {
      if (!currentActiveProfile) return;
      bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
      archiveCasino(currentActiveProfile.casino.id, currentActiveProfile.casino.name);
    }

    // ═════════════════════════════════════════════════════
    // FEE & BORÇ KALEMLERİ MODALI
    // ═════════════════════════════════════════════════════
    function openQuickFeeModal(casinoId) {
      const nowMonth = new Date().getMonth() + 1;
      openFeeEditModal(casinoId, currentYear, nowMonth);
    }

    function openFeeEditModal(casinoId, year, month) {
      document.getElementById('feeCasinoId').value = casinoId;
      document.getElementById('feeYear').value = year;
      document.getElementById('feeMonth').value = month;
      document.getElementById('feeModalTitle').innerHTML = `<i class="fa-solid fa-calendar-days text-warning me-2"></i> ${MONTHS[month]} ${year} Borç & Tahsilat`;
      document.getElementById('feeNewPayment').value = '';
      document.getElementById('feePaymentNote').value = '';

      const existing = appData.fee_rows.find(r => r.casino_id == casinoId && r.year == year && r.month == month);
      currentDebtItems = existing && existing.debt_items ? JSON.parse(JSON.stringify(existing.debt_items)) : [];
      document.getElementById('feeGeneralNote').value = existing ? existing.note || '' : '';
      document.getElementById('feeCurrentPaidAmount').innerText = 'Mevcut Ödenen: ₺' + fmt(existing ? existing.paid_amount : 0);

      renderDebtItems();
      new bootstrap.Modal(document.getElementById('feeModal')).show();
    }

    function renderDebtItems() {
      const container = document.getElementById('debtItemsContainer');
      if (currentDebtItems.length === 0) {
        container.innerHTML = '<p class="text-muted small py-2">Henüz borç kalemi eklenmemiş. Yukarıdaki hızlı butonları kullanabilirsiniz.</p>';
        updateDebtItemsLiveTotal();
        return;
      }
      container.innerHTML = currentDebtItems.map((item, idx) => `
        <div class="row g-2 align-items-center p-2.5 rounded-3 mb-2" style="background: #141428; border: 1px solid var(--border-color);">
          <div class="col-4">
            <input type="text" class="form-control form-control-sm form-control-dark font-mono" value="${item.name || ''}" placeholder="Kalem Adı" oninput="currentDebtItems[${idx}].name = this.value">
          </div>
          <div class="col-4">
            <input type="number" step="0.01" class="form-control form-control-sm form-control-dark font-mono" value="${item.amount || ''}" placeholder="Tutar" oninput="currentDebtItems[${idx}].amount = parseFloat(this.value) || 0; updateDebtItemsLiveTotal();">
          </div>
          <div class="col-3">
            <select class="form-select form-select-sm form-select-dark font-mono" onchange="currentDebtItems[${idx}].currency = this.value; updateDebtItemsLiveTotal();">
              <option value="TRY" ${item.currency === 'TRY' ? 'selected' : ''}>TRY (₺)</option>
              <option value="USD" ${item.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
              <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
            </select>
          </div>
          <div class="col-1 text-end">
            <button class="btn btn-link text-danger btn-sm p-0" onclick="currentDebtItems.splice(${idx}, 1); renderDebtItems();"><i class="fa-solid fa-trash"></i></button>
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
      const casino_id = parseInt(document.getElementById('feeCasinoId').value);
      const year = parseInt(document.getElementById('feeYear').value);
      const month = parseInt(document.getElementById('feeMonth').value);
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

      const existing = appData.fee_rows.find(r => r.casino_id == casino_id && r.year == year && r.month == month);
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
        await loadData();
        const updatedRow = appData.fee_rows.find(r => r.casino_id == casino_id && r.year == year && r.month == month);
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

      bootstrap.Modal.getInstance(document.getElementById('feeModal')).hide();
      Swal.fire({ icon: 'success', title: 'Kaydedildi', timer: 1000, showConfirmButton: false });
      loadData();
      if (currentActiveProfile && currentActiveProfile.casino.id === casino_id) {
        openProfileModal(casino_id);
      }
    }

    // Casino Ekleme
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
        Swal.fire({ icon: 'success', title: 'Casino Eklendi', timer: 1200, showConfirmButton: false });
        loadData();
      }
    }

    // Arşivleme
    async function archiveCasino(id, name) {
      const confirm = await Swal.fire({
        title: 'Arşivlensin mi?',
        text: `"${name}" arşive taşınacak. İstediğiniz zaman geri yükleyebilirsiniz.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#334155',
        confirmButtonText: 'Evet, Arşivle',
        cancelButtonText: 'İptal'
      });
      if (confirm.isConfirmed) {
        const res = await fetch('api.php?action=archive_casino', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'Arşivlendi', timer: 1000, showConfirmButton: false });
          loadData();
        }
      }
    }

    async function openArchiveModal() {
      const res = await fetch('api.php?action=get_archive');
      const data = await res.json();
      const container = document.getElementById('archiveListContainer');
      const list = data.list || [];

      if (list.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">Arşivde casino bulunmuyor.</p>';
      } else {
        container.innerHTML = list.map(item => `
          <div class="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2" style="background: #0d0d1a; border: 1px solid var(--border-color);">
            <div>
              <strong class="text-white d-block">${item.name}</strong>
              <small class="text-muted">${item.fee_type === 'percent' ? '%' + item.fee_rate : item.fee_type}</small>
            </div>
            <button class="btn btn-outline-success btn-sm rounded-pill px-3" onclick="restoreCasino(${item.id})">
              <i class="fa-solid fa-rotate-left me-1"></i> Geri Yükle
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
      Swal.fire({ icon: 'success', title: 'Casino Geri Yüklendi', timer: 1000, showConfirmButton: false });
      loadData();
    }

    // Giderler
    async function openExpensesModal() {
      const res = await fetch(`api.php?action=get_expenses&year=${currentYear}`);
      const data = await res.json();
      const tbody = document.getElementById('expensesTableBody');
      const list = data.expenses || [];

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Kayıtlı gider bulunmuyor.</td></tr>';
      } else {
        tbody.innerHTML = list.map(e => `
          <tr>
            <td class="fw-bold text-white">${e.name}</td>
            <td>${MONTHS[e.month]}</td>
            <td class="text-end fw-bold text-danger font-mono">${fmt(e.amount)} ${e.currency}</td>
            <td class="text-end">
              <button class="btn btn-link text-danger btn-sm p-0" onclick="deleteExpense(${e.id})"><i class="fa-solid fa-trash"></i></button>
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
