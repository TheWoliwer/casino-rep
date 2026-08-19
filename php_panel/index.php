<?php
require_once __DIR__ . '/config.php';
$rates = getExchangeRates();
?>
<!DOCTYPE html>
<html lang="tr" data-bs-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Casino Takip & Rapor Paneli</title>
  
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- FontAwesome 6 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- Google Fonts: Inter -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <!-- SweetAlert2 -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

  <style>
    :root {
      --bg-base: #0a0a12;
      --bg-card: #141422;
      --bg-card-hover: #1b1b2f;
      --bg-accent: #1e1e34;
      --border-color: #24243e;
      --accent-gold: #fbbf24;
      --accent-green: #22c55e;
      --accent-red: #ef4444;
      --text-muted: #8e8ea8;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-base);
      color: #e2e8f0;
      min-height: 100vh;
    }
    
    .navbar-custom {
      background-color: #0f0f1c;
      border-bottom: 1px solid var(--border-color);
      padding: 0.85rem 1.5rem;
    }
    
    .card-kpi {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.25rem;
      transition: all 0.2s ease;
    }
    .card-kpi:hover {
      border-color: rgba(251, 191, 36, 0.3);
      transform: translateY(-2px);
    }
    
    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      overflow: hidden;
    }
    
    .table-custom {
      margin-bottom: 0;
      color: #e2e8f0;
    }
    .table-custom thead th {
      background-color: #121220;
      border-bottom: 1px solid var(--border-color);
      color: #94a3b8;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 1rem 1rem;
    }
    .table-custom tbody tr {
      border-bottom: 1px solid #1a1a2e;
      transition: background-color 0.15s ease;
    }
    .table-custom tbody tr:hover {
      background-color: var(--bg-card-hover);
    }
    .table-custom td {
      padding: 0.9rem 1rem;
      vertical-align: middle;
    }
    
    .btn-gold {
      background-color: var(--accent-gold);
      color: #000;
      font-weight: 600;
      border: none;
    }
    .btn-gold:hover {
      background-color: #f59e0b;
      color: #000;
    }
    
    .btn-year {
      background: transparent;
      color: #94a3b8;
      border: 1px solid var(--border-color);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: 8px;
    }
    .btn-year.active {
      background: var(--accent-gold);
      color: #000;
      border-color: var(--accent-gold);
    }
    
    .badge-percent {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }
    
    .modal-content-dark {
      background-color: #141424;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      color: #e2e8f0;
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
      background-color: #0e0e1a;
      border: 1px solid var(--border-color);
      color: #fff;
      border-radius: 10px;
    }
    .form-control-dark:focus, .form-select-dark:focus {
      background-color: #0e0e1a;
      border-color: var(--accent-gold);
      color: #fff;
      box-shadow: 0 0 0 0.25rem rgba(251, 191, 36, 0.15);
    }
    
    .progress-thin {
      height: 6px;
      border-radius: 3px;
      background-color: #1e1e34;
    }
    
    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0a0a12; }
    ::-webkit-scrollbar-thumb { background: #2a2a44; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #3a3a5e; }
  </style>
</head>
<body>

  <!-- Navbar -->
  <nav class="navbar navbar-expand-lg navbar-custom sticky-top">
    <div class="container-fluid">
      <a class="navbar-brand d-flex items-center gap-2 fw-bold text-white fs-5" href="#">
        <span style="color: var(--accent-gold); font-size: 1.4rem;">♠</span> Casino Takip & Raporlar
      </a>

      <!-- Kur Bilgisi -->
      <div class="d-none d-md-flex align-items-center gap-3 ms-4 px-3 py-1 rounded-pill" style="background: #141424; border: 1px solid var(--border-color); font-size: 0.75rem;">
        <div><span class="text-muted">USD:</span> <strong class="text-white" id="rateUSD">₺<?= number_format($rates['usd'], 2) ?></strong></div>
        <div class="vr bg-secondary opacity-25"></div>
        <div><span class="text-muted">EUR:</span> <strong class="text-white" id="rateEUR">₺<?= number_format($rates['eur'], 2) ?></strong></div>
      </div>

      <div class="ms-auto d-flex align-items-center gap-2">
        <!-- Yıl Butonları -->
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

        <button class="btn btn-outline-secondary btn-sm rounded-circle" style="width: 32px; height: 32px; padding: 0;" onclick="loadData()" title="Yenile">
          <i class="fa-solid fa-rotate-right" id="refreshIcon"></i>
        </button>
      </div>
    </div>
  </nav>

  <!-- Ana İçerik -->
  <div class="container-fluid py-4 px-3 px-md-4">
    
    <!-- Üst KPI Özet Kartları -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <div class="card-kpi">
          <div class="text-muted small fw-medium mb-1"><i class="fa-solid fa-wallet me-1"></i> Toplam Beklenen</div>
          <div class="fs-4 fw-bold text-white" id="cardTotalUSD">$0.00</div>
          <div class="small text-muted" id="cardTotalTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card-kpi">
          <div class="text-muted small fw-medium mb-1"><i class="fa-solid fa-circle-check text-success me-1"></i> Tahsil Edilen</div>
          <div class="fs-4 fw-bold text-success" id="cardCollectedUSD">$0.00</div>
          <div class="small text-muted" id="cardCollectedTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card-kpi">
          <div class="text-muted small fw-medium mb-1"><i class="fa-solid fa-circle-exclamation text-danger me-1"></i> Bekleyen Borç</div>
          <div class="fs-4 fw-bold text-danger" id="cardOutstandingUSD">$0.00</div>
          <div class="small text-muted" id="cardOutstandingTRY">₺0,00</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card-kpi">
          <div class="text-muted small fw-medium mb-1"><i class="fa-solid fa-chart-pie me-1"></i> Tahsilat Oranı</div>
          <div class="fs-4 fw-bold text-warning" id="cardRatePercent">%0.0</div>
          <div class="progress progress-thin mt-2">
            <div class="progress-bar bg-warning" id="cardProgressBar" style="width: 0%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Başlık ve Filtre Çubuğu -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
      <h5 class="fw-bold m-0 d-flex align-items-center gap-2">
        <span>Casino Raporu — <span id="titleYear">2026</span></span>
        <span class="badge bg-dark border text-muted px-2 py-1" style="font-size: 0.75rem;" id="casinoCountBadge">0 casino</span>
      </h5>

      <!-- Ay Filtresi -->
      <div class="d-flex align-items-center gap-2">
        <select class="form-select form-select-sm form-select-dark" id="monthFilter" style="width: 140px;" onchange="filterMonth(this.value)">
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

    <!-- Casino Rapor Tablosu -->
    <div class="table-container shadow-sm">
      <div class="table-responsive">
        <table class="table table-custom table-hover align-middle">
          <thead>
            <tr>
              <th onclick="sortTable('name')" style="cursor: pointer;">CASİNO <i class="fa-solid fa-sort ms-1 opacity-50"></i></th>
              <th onclick="sortTable('months')" class="text-center" style="cursor: pointer; width: 80px;">AY <i class="fa-solid fa-sort ms-1 opacity-50"></i></th>
              <th onclick="sortTable('total')" class="text-end" style="cursor: pointer;">BEKLENEN <i class="fa-solid fa-sort ms-1 opacity-50"></i></th>
              <th onclick="sortTable('collected')" class="text-end" style="cursor: pointer;">TAHSİL <i class="fa-solid fa-sort ms-1 opacity-50"></i></th>
              <th onclick="sortTable('outstanding')" class="text-end" style="cursor: pointer;">BEKLEYEN <i class="fa-solid fa-sort ms-1 opacity-50"></i></th>
              <th onclick="sortTable('rate')" class="text-end" style="cursor: pointer; width: 140px;">ORAN % <i class="fa-solid fa-sort ms-1 opacity-50"></i></th>
              <th class="text-end" style="width: 100px;">İŞLEMLER</th>
            </tr>
          </thead>
          <tbody id="tableBody">
            <tr>
              <td colspan="7" class="text-center py-5 text-muted">
                <div class="spinner-border spinner-border-sm text-warning me-2" role="status"></div> Veriler yükleniyor...
              </td>
            </tr>
          </tbody>
          <tfoot class="border-top" style="background: #0d0d18; font-weight: 700;">
            <tr>
              <td class="text-white">TOPLAM</td>
              <td class="text-center text-muted" id="footMonths">-</td>
              <td class="text-end" id="footTotal">-</td>
              <td class="text-end text-success" id="footCollected">-</td>
              <td class="text-end text-danger" id="footOutstanding">-</td>
              <td class="text-end text-warning" id="footRate">%0.0</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
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
  <!-- MODAL: CASINO PROFİLİ & HAREKET GEÇMİŞİ              -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="profileModal" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content modal-content-dark">
        <div class="modal-header modal-header-dark d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-3 p-2 bg-warning bg-opacity-10 text-warning fs-5">
              <i class="fa-solid fa-user-tie"></i>
            </div>
            <div>
              <h5 class="modal-title fw-bold text-white m-0" id="profileModalTitle">Casino Adı</h5>
              <small class="text-muted" id="profileModalSub">Profil & Hareket Geçmişi</small>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <!-- Üst Özet -->
          <div class="row g-2 mb-4 text-center">
            <div class="col-4">
              <div class="p-3 rounded-3" style="background: #0d0d1a; border: 1px solid var(--border-color);">
                <small class="text-muted d-block mb-1">Toplam Beklenen</small>
                <strong class="fs-5 text-white" id="profTotalUSD">$0.00</strong>
                <div class="small text-muted" id="profTotalTRY">₺0,00</div>
              </div>
            </div>
            <div class="col-4">
              <div class="p-3 rounded-3" style="background: #0d0d1a; border: 1px solid var(--border-color);">
                <small class="text-muted d-block mb-1">Tahsil Edilen</small>
                <strong class="fs-5 text-success" id="profCollectedUSD">$0.00</strong>
                <div class="small text-muted" id="profCollectedTRY">₺0,00</div>
              </div>
            </div>
            <div class="col-4">
              <div class="p-3 rounded-3" style="background: #0d0d1a; border: 1px solid var(--border-color);">
                <small class="text-muted d-block mb-1">Bekleyen Borç</small>
                <strong class="fs-5 text-danger" id="profOutstandingUSD">$0.00</strong>
                <div class="small text-muted" id="profOutstandingTRY">₺0,00</div>
              </div>
            </div>
          </div>

          <!-- Sekmeler -->
          <ul class="nav nav-pills mb-3 border-bottom pb-2 gap-2" id="profileTabs">
            <li class="nav-item">
              <button class="nav-link active btn-sm rounded-pill" data-bs-toggle="pill" data-bs-target="#tabTable">📊 Aylık Borç & Cirolar</button>
            </li>
            <li class="nav-item">
              <button class="nav-link btn-sm rounded-pill" data-bs-toggle="pill" data-bs-target="#tabTimeline">🕒 Ödeme Geçmişi</button>
            </li>
            <li class="nav-item">
              <button class="nav-link btn-sm rounded-pill" data-bs-toggle="pill" data-bs-target="#tabNotes">📝 Notlar</button>
            </li>
          </ul>

          <div class="tab-content">
            <!-- Sekme 1: Aylık Tablo -->
            <div class="tab-pane fade show active" id="tabTable">
              <div class="table-responsive rounded-3 border" style="border-color: var(--border-color) !important;">
                <table class="table table-custom table-sm mb-0">
                  <thead style="background: #0f0f1c;">
                    <tr>
                      <th>AY / YIL</th>
                      <th class="text-end">CİRO / BORÇ (₺)</th>
                      <th class="text-end">ÖDENEN (₺)</th>
                      <th class="text-end">KALAN (₺)</th>
                      <th>KALEMLER</th>
                      <th class="text-center">DURUM</th>
                      <th class="text-end">DÜZENLE</th>
                    </tr>
                  </thead>
                  <tbody id="profileMonthsBody"></tbody>
                </table>
              </div>
            </div>

            <!-- Sekme 2: Ödeme Geçmişi Timeline -->
            <div class="tab-pane fade" id="tabTimeline">
              <div id="profileTimelineBody" class="space-y-2"></div>
            </div>

            <!-- Sekme 3: Notlar -->
            <div class="tab-pane fade" id="tabNotes">
              <textarea class="form-control form-control-dark" id="profileNotesText" rows="6" placeholder="Bu casino için özel notlarınızı buraya yazabilirsiniz..."></textarea>
              <div class="d-flex justify-content-end mt-2">
                <button class="btn btn-gold btn-sm rounded-pill px-4" onclick="saveProfileNote()">
                  <i class="fa-solid fa-floppy-disk me-1"></i> Notu Kaydet
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- MODAL: AY VE BORÇ KALEMLERİ DÜZENLEME                 -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div class="modal fade" id="feeModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content modal-content-dark">
        <div class="modal-header modal-header-dark">
          <h5 class="modal-title fw-bold text-white" id="feeModalTitle">Ay Düzenle</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <input type="hidden" id="feeCasinoId">
          <input type="hidden" id="feeYear">
          <input type="hidden" id="feeMonth">

          <!-- Borç Kalemleri Listesi -->
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="small text-muted fw-bold">BORÇ KALEMLERİ</label>
              <button class="btn btn-outline-warning btn-sm rounded-pill py-0 px-2" onclick="addDebtItemRow()">
                <i class="fa-solid fa-plus"></i> Kalem Ekle
              </button>
            </div>
            <div id="debtItemsContainer" class="space-y-2"></div>
          </div>

          <!-- Hızlı Ödeme Girişi -->
          <div class="p-3 rounded-3 mb-3" style="background: #0e0e1c; border: 1px solid var(--border-color);">
            <label class="small text-muted fw-bold mb-2 d-block">TAHSİLAT / ÖDEME EKLE</label>
            <div class="row g-2">
              <div class="col-6">
                <input type="number" step="0.01" class="form-control form-control-dark" id="feeNewPayment" placeholder="Tutar (₺)">
              </div>
              <div class="col-6">
                <input type="text" class="form-control form-control-dark" id="feePaymentNote" placeholder="Ödeme Notu (Örn: Havale)">
              </div>
            </div>
          </div>

          <div class="mb-2">
            <label class="small text-muted">Açıklama / Genel Not</label>
            <input type="text" class="form-control form-control-dark" id="feeGeneralNote" placeholder="Bu ay için genel not...">
          </div>
        </div>
        <div class="modal-footer modal-footer-dark">
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill" data-bs-dismiss="modal">Kapat</button>
          <button type="button" class="btn btn-gold btn-sm rounded-pill px-4" onclick="saveFeeRowData()">Kaydet</button>
        </div>
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
          <!-- Gider Ekle Formu -->
          <form onsubmit="submitAddExpense(event)" class="p-3 rounded-3 mb-4" style="background: #0e0e1c; border: 1px solid var(--border-color);">
            <h6 class="fw-bold mb-3 text-warning">Yeni Gider Ekle</h6>
            <div class="row g-2">
              <div class="col-md-4">
                <input type="text" class="form-control form-control-dark" id="expName" required placeholder="Gider Adı (Örn: Server)">
              </div>
              <div class="col-md-3">
                <input type="number" step="0.01" class="form-control form-control-dark" id="expAmount" required placeholder="Tutar">
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

          <!-- Gider Listesi -->
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

  <!-- Uygulama Scripti -->
  <script>
    const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    
    let currentYear = 2026;
    let selectedMonth = 0;
    let rates = { usd: <?= (float)$rates['usd'] ?>, eur: <?= (float)$rates['eur'] ?> };
    let appData = { casinos: [], fee_rows: [] };
    let sortKey = 'total';
    let sortDir = 'desc';
    let currentActiveCasino = null;

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
                <button class="btn btn-outline-warning btn-sm py-0 px-2 rounded-pill" style="font-size: 0.7rem;" onclick="openProfileModal(${c.id})">
                  <i class="fa-solid fa-user me-1"></i> Profil
                </button>
                <button class="btn btn-outline-secondary btn-sm py-0 px-2 rounded-pill" style="font-size: 0.7rem;" onclick="archiveCasino(${c.id}, '${c.name.replace(/'/g, "\\'")}')">
                  <i class="fa-solid fa-box-archive me-1"></i> Arşivle
                </button>
              </div>
            </td>
            <td class="text-center text-muted fw-semibold">${row.months}</td>
            <td class="text-end">
              <div class="fw-bold text-white">$${fmtUSD(toUSD(row.total))}</div>
              <small class="text-muted">₺${fmt(row.total)}</small>
            </td>
            <td class="text-end">
              <div class="fw-bold text-success">$${fmtUSD(toUSD(row.collected))}</div>
              <small class="text-muted">₺${fmt(row.collected)}</small>
            </td>
            <td class="text-end">
              <div class="fw-bold ${row.outstanding > 0 ? 'text-danger' : 'text-success'}">$${fmtUSD(toUSD(row.outstanding))}</div>
              <small class="text-muted">₺${fmt(row.outstanding)}</small>
            </td>
            <td class="text-end">
              <div class="d-flex align-items-center justify-content-end gap-2">
                <div class="progress progress-thin flex-grow-1" style="max-width: 60px;">
                  <div class="progress-bar ${progressBg}" style="width: ${Math.min(100, row.rate)}%"></div>
                </div>
                <span class="fw-bold ${rateColor}" style="font-size: 0.8rem; width: 45px;">%${row.rate.toFixed(0)}</span>
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
      document.getElementById('footTotal').innerHTML = `$${fmtUSD(toUSD(totals.total))}<br><small class="text-muted fw-normal">₺${fmt(totals.total)}</small>`;
      document.getElementById('footCollected').innerHTML = `$${fmtUSD(toUSD(totals.collected))}<br><small class="text-muted fw-normal">₺${fmt(totals.collected)}</small>`;
      document.getElementById('footOutstanding').innerHTML = `$${fmtUSD(toUSD(totals.outstanding))}<br><small class="text-muted fw-normal">₺${fmt(totals.outstanding)}</small>`;
      document.getElementById('footRate').innerText = `%${overallRate.toFixed(1)}`;
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

    // Arşiv Modalı
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

    // Casino Profil Modalı
    async function openProfileModal(casinoId) {
      const res = await fetch(`api.php?action=get_profile&casino_id=${casinoId}`);
      const data = await res.json();
      if (!data.success) return;

      currentActiveCasino = data.casino;
      document.getElementById('profileModalTitle').innerText = data.casino.name;
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

      // Aylık Tablo
      const tbody = document.getElementById('profileMonthsBody');
      if (feeRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Kayıtlı ay bulunamadı.</td></tr>';
      } else {
        tbody.innerHTML = feeRows.map(r => {
          const rem = Math.max(0, r.turnover - r.paid_amount);
          const isPaid = r.turnover > 0 && r.paid_amount >= r.turnover;
          const statusBadge = isPaid 
            ? '<span class="badge bg-success bg-opacity-25 text-success">Ödendi</span>'
            : (r.paid_amount > 0 ? '<span class="badge bg-warning bg-opacity-25 text-warning">Kısmi</span>' : '<span class="badge bg-danger bg-opacity-25 text-danger">Bekliyor</span>');

          const itemsSummary = (r.debt_items || []).map(i => `${i.name}: ${i.amount} ${i.currency}`).join(', ') || '—';

          return `
            <tr>
              <td class="fw-bold text-white">${MONTHS[r.month]} ${r.year}</td>
              <td class="text-end font-monospace">₺${fmt(r.turnover)}</td>
              <td class="text-end text-success font-monospace">₺${fmt(r.paid_amount)}</td>
              <td class="text-end text-danger font-monospace">₺${fmt(rem)}</td>
              <td class="small text-muted" style="max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${itemsSummary}</td>
              <td class="text-center">${statusBadge}</td>
              <td class="text-end">
                <button class="btn btn-outline-secondary btn-sm py-0 px-2 rounded-pill" onclick="openFeeEditModal(${r.casino_id}, ${r.year}, ${r.month})">
                  <i class="fa-solid fa-pen"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }

      // Timeline
      const timeline = document.getElementById('profileTimelineBody');
      const txs = data.transactions || [];
      if (txs.length === 0) {
        timeline.innerHTML = '<p class="text-muted text-center py-4">Henüz ödeme hareketi bulunmuyor.</p>';
      } else {
        timeline.innerHTML = txs.map(t => `
          <div class="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2" style="background: #0d0d1a; border: 1px solid var(--border-color);">
            <div>
              <strong class="text-success fs-6">+₺${fmt(t.paid_amount)}</strong>
              <small class="text-muted d-block">${t.note || 'Ödeme'}</small>
            </div>
            <small class="text-muted">${new Date(t.created_at).toLocaleDateString('tr-TR')} ${new Date(t.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</small>
          </div>
        `).join('');
      }

      new bootstrap.Modal(document.getElementById('profileModal')).show();
    }

    async function saveProfileNote() {
      if (!currentActiveCasino) return;
      const notes = document.getElementById('profileNotesText').value;
      await fetch('api.php?action=save_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casino_id: currentActiveCasino.id, notes })
      });
      Swal.fire({ icon: 'success', title: 'Not Kaydedildi', timer: 1000, showConfirmButton: false });
    }

    // Fee & Kalem Düzenleme
    let currentDebtItems = [];

    function openQuickFeeModal(casinoId) {
      const nowMonth = new Date().getMonth() + 1;
      openFeeEditModal(casinoId, currentYear, nowMonth);
    }

    function openFeeEditModal(casinoId, year, month) {
      document.getElementById('feeCasinoId').value = casinoId;
      document.getElementById('feeYear').value = year;
      document.getElementById('feeMonth').value = month;
      document.getElementById('feeModalTitle').innerText = `${MONTHS[month]} ${year} Düzenle`;
      document.getElementById('feeNewPayment').value = '';
      document.getElementById('feePaymentNote').value = '';

      const existing = appData.fee_rows.find(r => r.casino_id == casinoId && r.year == year && r.month == month);
      currentDebtItems = existing && existing.debt_items ? [...existing.debt_items] : [];
      document.getElementById('feeGeneralNote').value = existing ? existing.note || '' : '';

      renderDebtItems();
      new bootstrap.Modal(document.getElementById('feeModal')).show();
    }

    function renderDebtItems() {
      const container = document.getElementById('debtItemsContainer');
      if (currentDebtItems.length === 0) {
        container.innerHTML = '<p class="text-muted small py-2">Kalem eklemek için yukarıdaki butona basın.</p>';
        return;
      }
      container.innerHTML = currentDebtItems.map((item, idx) => `
        <div class="row g-2 align-items-center p-2 rounded-2 mb-2" style="background: #141426;">
          <div class="col-4">
            <input type="text" class="form-control form-control-sm form-control-dark" value="${item.name || ''}" placeholder="Kalem Adı" onchange="currentDebtItems[${idx}].name = this.value">
          </div>
          <div class="col-4">
            <input type="number" step="0.01" class="form-control form-control-sm form-control-dark" value="${item.amount || ''}" placeholder="Tutar" onchange="currentDebtItems[${idx}].amount = parseFloat(this.value) || 0">
          </div>
          <div class="col-3">
            <select class="form-select form-select-sm form-select-dark" onchange="currentDebtItems[${idx}].currency = this.value">
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
    }

    function addDebtItemRow() {
      currentDebtItems.push({ name: 'FEE', amount: 0, currency: 'TRY', paid: false });
      renderDebtItems();
    }

    async function saveFeeRowData() {
      const casino_id = parseInt(document.getElementById('feeCasinoId').value);
      const year = parseInt(document.getElementById('feeYear').value);
      const month = parseInt(document.getElementById('feeMonth').value);
      const note = document.getElementById('feeGeneralNote').value;
      const newPayment = parseFloat(document.getElementById('feeNewPayment').value) || 0;
      const paymentNote = document.getElementById('feePaymentNote').value;

      // Toplam turnover hesapla (Döviz kurları ile TL'ye çevir)
      let totalTRY = 0;
      currentDebtItems.forEach(item => {
        let amt = Number(item.amount) || 0;
        if (item.currency === 'USD') amt *= rates.usd;
        if (item.currency === 'EUR') amt *= rates.eur;
        totalTRY += amt;
      });

      const existing = appData.fee_rows.find(r => r.casino_id == casino_id && r.year == year && r.month == month);
      let paid_amount = existing ? Number(existing.paid_amount) || 0 : 0;

      // Önce fee_row kaydet
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

      // Eğer yeni ödeme girildiyse transaction ekle
      if (newPayment > 0) {
        // En güncel fee_row ID'sini al
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
            <td class="text-end fw-bold text-danger">${fmt(e.amount)} ${e.currency}</td>
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

    // Sayfa Yüklendiğinde
    document.addEventListener('DOMContentLoaded', () => {
      loadData();
    });
  </script>
</body>
</html>
