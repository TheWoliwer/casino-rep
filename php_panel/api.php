<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';
checkApiAuth();

$pdo = getDB();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Arşiv listesini çek
function getArchiveList($pdo) {
    $stmt = $pdo->prepare("SELECT v FROM settings WHERE k = 'casino_archive' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();
    if (!$row || empty($row['v'])) return [];
    $data = json_decode($row['v'], true);
    return is_array($data) ? $data : [];
}

// Arşiv listesini kaydet
function saveArchiveList($pdo, $list) {
    $stmt = $pdo->prepare("INSERT INTO settings (k, v) VALUES ('casino_archive', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)");
    $stmt->execute([json_encode($list, JSON_UNESCAPED_UNICODE)]);
}

// Request body JSON
$input = json_decode(file_get_contents('php://input'), true) ?: [];

try {
    switch ($action) {
        // -----------------------------------------------------
        // Rapor ve Ana Tablo Verisi
        // -----------------------------------------------------
        case 'get_reports':
            $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
            $rates = getExchangeRates();
            $archiveList = getArchiveList($pdo);
            $archivedIds = array_column($archiveList, 'id');

            // Tüm Casinolar
            $casinosStmt = $pdo->query("SELECT * FROM casinos ORDER BY sort_order ASC, id ASC");
            $allCasinos = $casinosStmt->fetchAll();

            $activeCasinos = [];
            foreach ($allCasinos as $c) {
                if (!in_array((int)$c['id'], $archivedIds)) {
                    $c['id'] = (int)$c['id'];
                    $c['fee_rate'] = (float)$c['fee_rate'];
                    $c['sort_order'] = (int)$c['sort_order'];
                    $activeCasinos[] = $c;
                }
            }

            // Fee Rows (Yıl Filtreli)
            $feeStmt = $pdo->prepare("SELECT * FROM fee_rows WHERE year = ? ORDER BY id ASC");
            $feeStmt->execute([$year]);
            $feeRows = $feeStmt->fetchAll();

            foreach ($feeRows as &$r) {
                $r['id'] = (int)$r['id'];
                $r['casino_id'] = (int)$r['casino_id'];
                $r['year'] = (int)$r['year'];
                $r['month'] = (int)$r['month'];
                $r['turnover'] = (float)$r['turnover'];
                $r['fee_amount'] = (float)$r['fee_amount'];
                $r['paid_amount'] = (float)$r['paid_amount'];
                $r['status'] = (int)$r['status'];
                $r['debt_items'] = !empty($r['debt_items']) ? json_decode($r['debt_items'], true) : [];
            }

            echo json_encode([
                'success' => true,
                'year' => $year,
                'rates' => $rates,
                'casinos' => $activeCasinos,
                'fee_rows' => $feeRows,
                'archived_count' => count($archiveList)
            ], JSON_UNESCAPED_UNICODE);
            break;

        // -----------------------------------------------------
        // Casino Profil / Geçmiş Detayları
        // -----------------------------------------------------
        case 'get_profile':
            $casinoId = (int)($_GET['casino_id'] ?? 0);
            if (!$casinoId) throw new Exception('Geçersiz Casino ID');

            $cStmt = $pdo->prepare("SELECT * FROM casinos WHERE id = ? LIMIT 1");
            $cStmt->execute([$casinoId]);
            $casino = $cStmt->fetch();
            if (!$casino) throw new Exception('Casino bulunamadı');

            $casino['id'] = (int)$casino['id'];
            $casino['fee_rate'] = (float)$casino['fee_rate'];

            // Tüm Yıllardaki Fee Satırları
            $feeStmt = $pdo->prepare("SELECT * FROM fee_rows WHERE casino_id = ? ORDER BY year DESC, month ASC");
            $feeStmt->execute([$casinoId]);
            $feeRows = $feeStmt->fetchAll();

            $feeRowIds = [];
            foreach ($feeRows as &$r) {
                $r['id'] = (int)$r['id'];
                $r['casino_id'] = (int)$r['casino_id'];
                $r['year'] = (int)$r['year'];
                $r['month'] = (int)$r['month'];
                $r['turnover'] = (float)$r['turnover'];
                $r['fee_amount'] = (float)$r['fee_amount'];
                $r['paid_amount'] = (float)$r['paid_amount'];
                $r['status'] = (int)$r['status'];
                $r['debt_items'] = !empty($r['debt_items']) ? json_decode($r['debt_items'], true) : [];
                $feeRowIds[] = $r['id'];
            }

            // Ödeme Hareketleri
            $transactions = [];
            if (!empty($feeRowIds)) {
                $inQuery = implode(',', array_fill(0, count($feeRowIds), '?'));
                $txStmt = $pdo->prepare("SELECT * FROM transactions WHERE fee_row_id IN ($inQuery) ORDER BY created_at DESC");
                $txStmt->execute($feeRowIds);
                $transactions = $txStmt->fetchAll();
                foreach ($transactions as &$t) {
                    $t['id'] = (int)$t['id'];
                    $t['fee_row_id'] = (int)$t['fee_row_id'];
                    $t['paid_amount'] = (float)$t['paid_amount'];
                }
            }

            // Notlar (Settings'den)
            $noteKey = 'note_' . $casinoId;
            $nStmt = $pdo->prepare("SELECT v FROM settings WHERE k = ? LIMIT 1");
            $nStmt->execute([$noteKey]);
            $noteRow = $nStmt->fetch();
            $notes = '';
            if ($noteRow && !empty($noteRow['v'])) {
                $noteData = json_decode($noteRow['v'], true);
                $notes = $noteData['notes'] ?? $noteRow['v'];
            }

            echo json_encode([
                'success' => true,
                'casino' => $casino,
                'fee_rows' => $feeRows,
                'transactions' => $transactions,
                'notes' => $notes,
                'rates' => getExchangeRates()
            ], JSON_UNESCAPED_UNICODE);
            break;

        // -----------------------------------------------------
        // Casino Ekle
        // -----------------------------------------------------
        case 'add_casino':
            $name = trim($input['name'] ?? '');
            $fee_type = $input['fee_type'] ?? 'percent';
            $fee_rate = (float)($input['fee_rate'] ?? 0);
            $fee_currency = $input['fee_currency'] ?? 'TRY';

            if (empty($name)) throw new Exception('Casino ismi zorunludur');

            $maxStmt = $pdo->query("SELECT MAX(sort_order) as m FROM casinos");
            $maxOrder = ((int)$maxStmt->fetch()['m']) + 1;

            $stmt = $pdo->prepare("INSERT INTO casinos (name, fee_type, fee_rate, fee_currency, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$name, $fee_type, $fee_rate, $fee_currency, $maxOrder]);

            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;

        // -----------------------------------------------------
        // Casino Düzenle
        // -----------------------------------------------------
        case 'edit_casino':
            $id = (int)($input['id'] ?? 0);
            $name = trim($input['name'] ?? '');
            $fee_type = $input['fee_type'] ?? 'percent';
            $fee_rate = (float)($input['fee_rate'] ?? 0);

            if (!$id || empty($name)) throw new Exception('Geçersiz parametre');

            $stmt = $pdo->prepare("UPDATE casinos SET name = ?, fee_type = ?, fee_rate = ? WHERE id = ?");
            $stmt->execute([$name, $fee_type, $fee_rate, $id]);

            echo json_encode(['success' => true]);
            break;

        // -----------------------------------------------------
        // Casino Arşivle
        // -----------------------------------------------------
        case 'archive_casino':
            $id = (int)($input['id'] ?? 0);
            if (!$id) throw new Exception('Geçersiz ID');

            $cStmt = $pdo->prepare("SELECT * FROM casinos WHERE id = ? LIMIT 1");
            $cStmt->execute([$id]);
            $casino = $cStmt->fetch();
            if (!$casino) throw new Exception('Casino bulunamadı');

            $archiveList = getArchiveList($pdo);
            $existingIdx = -1;
            foreach ($archiveList as $idx => $item) {
                if ((int)$item['id'] === $id) { $existingIdx = $idx; break; }
            }

            $entry = [
                'id' => (int)$casino['id'],
                'name' => $casino['name'],
                'fee_type' => $casino['fee_type'],
                'fee_rate' => (float)$casino['fee_rate'],
                'fee_currency' => $casino['fee_currency'],
                'archivedAt' => date('c')
            ];

            if ($existingIdx >= 0) {
                $archiveList[$existingIdx] = $entry;
            } else {
                $archiveList[] = $entry;
            }

            saveArchiveList($pdo, $archiveList);
            echo json_encode(['success' => true]);
            break;

        // -----------------------------------------------------
        // Casino Arşivden Geri Yükle
        // -----------------------------------------------------
        case 'restore_casino':
            $id = (int)($input['id'] ?? 0);
            if (!$id) throw new Exception('Geçersiz ID');

            $archiveList = getArchiveList($pdo);
            $newList = array_values(array_filter($archiveList, function($item) use ($id) {
                return (int)$item['id'] !== $id;
            }));

            saveArchiveList($pdo, $newList);
            echo json_encode(['success' => true]);
            break;

        // -----------------------------------------------------
        // Arşiv Listesini Getir
        // -----------------------------------------------------
        case 'get_archive':
            echo json_encode([
                'success' => true,
                'list' => getArchiveList($pdo)
            ], JSON_UNESCAPED_UNICODE);
            break;

        // -----------------------------------------------------
        // Fee Satırı & Borç Kalemleri Kaydet
        // -----------------------------------------------------
        case 'save_fee_row':
            $casino_id = (int)($input['casino_id'] ?? 0);
            $year = (int)($input['year'] ?? 0);
            $month = (int)($input['month'] ?? 0);
            $turnover = (float)($input['turnover'] ?? 0);
            $fee_amount = (float)($input['fee_amount'] ?? 0);
            $paid_amount = (float)($input['paid_amount'] ?? 0);
            $status = (int)($input['status'] ?? 0);
            $note = $input['note'] ?? '';
            $debt_items = json_encode($input['debt_items'] ?? [], JSON_UNESCAPED_UNICODE);

            if (!$casino_id || !$year || !$month) throw new Exception('Eksik bilgi');

            $stmt = $pdo->prepare("
                INSERT INTO fee_rows (casino_id, year, month, turnover, fee_amount, paid_amount, status, note, debt_items)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    turnover = VALUES(turnover),
                    fee_amount = VALUES(fee_amount),
                    paid_amount = VALUES(paid_amount),
                    status = VALUES(status),
                    note = VALUES(note),
                    debt_items = VALUES(debt_items)
            ");
            $stmt->execute([$casino_id, $year, $month, $turnover, $fee_amount, $paid_amount, $status, $note, $debt_items]);

            echo json_encode(['success' => true]);
            break;

        // -----------------------------------------------------
        // Ödeme Ekle (Transaction)
        // -----------------------------------------------------
        case 'add_payment':
            $fee_row_id = (int)($input['fee_row_id'] ?? 0);
            $paid_amount = (float)($input['paid_amount'] ?? 0);
            $note = $input['note'] ?? '';

            if (!$fee_row_id || $paid_amount <= 0) throw new Exception('Geçersiz ödeme bilgisi');

            // Transaction ekle
            $txStmt = $pdo->prepare("INSERT INTO transactions (fee_row_id, paid_amount, note) VALUES (?, ?, ?)");
            $txStmt->execute([$fee_row_id, $paid_amount, $note]);

            // fee_row paid_amount'u güncelle
            $sumStmt = $pdo->prepare("SELECT SUM(paid_amount) as total FROM transactions WHERE fee_row_id = ?");
            $sumStmt->execute([$fee_row_id]);
            $totalPaid = (float)$sumStmt->fetch()['total'];

            $upStmt = $pdo->prepare("UPDATE fee_rows SET paid_amount = ? WHERE id = ?");
            $upStmt->execute([$totalPaid, $fee_row_id]);

            echo json_encode(['success' => true, 'new_paid_amount' => $totalPaid]);
            break;

        // -----------------------------------------------------
        // Not Kaydet
        // -----------------------------------------------------
        case 'save_note':
            $casinoId = (int)($input['casino_id'] ?? 0);
            $notes = $input['notes'] ?? '';
            if (!$casinoId) throw new Exception('Geçersiz Casino ID');

            $key = 'note_' . $casinoId;
            $val = json_encode(['notes' => $notes, 'updatedAt' => date('c')], JSON_UNESCAPED_UNICODE);

            $stmt = $pdo->prepare("INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)");
            $stmt->execute([$key, $val]);

            echo json_encode(['success' => true]);
            break;

        // -----------------------------------------------------
        // Giderler (Expenses)
        // -----------------------------------------------------
        case 'get_expenses':
            $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
            $stmt = $pdo->prepare("
                SELECT e.*, c.name as casino_name 
                FROM expenses e 
                LEFT JOIN casinos c ON e.casino_id = c.id 
                WHERE e.year = ? 
                ORDER BY e.month ASC, e.created_at DESC
            ");
            $stmt->execute([$year]);
            $expenses = $stmt->fetchAll();
            echo json_encode(['success' => true, 'expenses' => $expenses], JSON_UNESCAPED_UNICODE);
            break;

        case 'add_expense':
            $name = trim($input['name'] ?? '');
            $amount = (float)($input['amount'] ?? 0);
            $currency = $input['currency'] ?? 'TRY';
            $year = (int)($input['year'] ?? date('Y'));
            $month = (int)($input['month'] ?? date('n'));
            $note = $input['note'] ?? '';
            $casino_id = !empty($input['casino_id']) ? (int)$input['casino_id'] : null;

            if (empty($name) || $amount <= 0) throw new Exception('Eksik gider bilgisi');

            $stmt = $pdo->prepare("INSERT INTO expenses (name, amount, currency, year, month, note, casino_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $amount, $currency, $year, $month, $note, $casino_id]);

            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;

        case 'delete_expense':
            $id = (int)($input['id'] ?? 0);
            if (!$id) throw new Exception('Geçersiz ID');

            $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;

        // -----------------------------------------------------
        // Preset Etiketleri & Varsayılan Para Birimi
        // -----------------------------------------------------
        case 'get_presets':
            $stmt = $pdo->prepare("SELECT k, v FROM settings WHERE k IN ('ct_presets', 'ct_default_currency')");
            $stmt->execute();
            $rows = $stmt->fetchAll();
            $presets = ['MAKİNA KİRASI', 'DEPOZİTO', 'SERVER ÜCRETİ', 'RTP', 'KİRA', 'SABİT-FEE', 'FEE'];
            $currency = 'TRY';
            foreach ($rows as $r) {
                if ($r['k'] === 'ct_presets' && !empty($r['v'])) {
                    $decoded = json_decode($r['v'], true);
                    if (is_array($decoded) && count($decoded) > 0) $presets = $decoded;
                }
                if ($r['k'] === 'ct_default_currency' && !empty($r['v'])) {
                    $currency = $r['v'];
                }
            }
            echo json_encode(['success' => true, 'presets' => $presets, 'default_currency' => $currency], JSON_UNESCAPED_UNICODE);
            break;

        case 'save_presets':
            if (isset($input['presets']) && is_array($input['presets'])) {
                $stmt = $pdo->prepare("INSERT INTO settings (k, v) VALUES ('ct_presets', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)");
                $stmt->execute([json_encode($input['presets'], JSON_UNESCAPED_UNICODE)]);
            }
            if (isset($input['default_currency'])) {
                $stmt = $pdo->prepare("INSERT INTO settings (k, v) VALUES ('ct_default_currency', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)");
                $stmt->execute([$input['default_currency']]);
            }
            echo json_encode(['success' => true]);
            break;

        default:
            throw new Exception('Bilinmeyen eylem');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
