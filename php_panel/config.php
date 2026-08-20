<?php
// =====================================================
// Casino Takip - Veritabanı ve Sistem Yapılandırması
// =====================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('PANEL_PASSWORD', '3535');

define('DB_HOST', 'localhost');
define('DB_NAME', 'u664375310_casinotakip');
define('DB_USER', 'u664375310_casinotakip');
define('DB_PASS', 'Dogukan123,.');
define('DB_CHARSET', 'utf8mb4');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            try {
                $dsnFallback = "mysql:host=127.0.0.1;dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
                $pdo = new PDO($dsnFallback, DB_USER, DB_PASS, $options);
            } catch (PDOException $e2) {
                die(json_encode(['error' => 'Veritabanı bağlantı hatası: ' . $e->getMessage()]));
            }
        }
    }
    return $pdo;
}

function checkAuth() {
    if (empty($_SESSION['casino_logged_in'])) {
        header('Location: login.php');
        exit;
    }
}

function checkApiAuth() {
    if (empty($_SESSION['casino_logged_in'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Yetkisiz erişim. Lütfen giriş yapın.']);
        exit;
    }
}

// TCMB Döviz Kurlarını Çek
function getExchangeRates() {
    $cacheFile = __DIR__ . '/rates_cache.json';
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 1800)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if ($cached) return $cached;
    }

    $usd = 47.91;
    $eur = 55.46;

    try {
        $ctx = stream_context_create(['http' => ['timeout' => 3]]);
        $xmlStr = @file_get_contents('https://www.tcmb.gov.tr/kurlar/today.xml', false, $ctx);
        if ($xmlStr) {
            $xml = @simplexml_load_string($xmlStr);
            if ($xml) {
                foreach ($xml->Currency as $curr) {
                    if ((string)$curr['CurrencyCode'] === 'USD') {
                        $usd = (float)str_replace(',', '.', (string)$curr->BanknoteSelling ?: (string)$curr->ForexSelling);
                    }
                    if ((string)$curr['CurrencyCode'] === 'EUR') {
                        $eur = (float)str_replace(',', '.', (string)$curr->BanknoteSelling ?: (string)$curr->ForexSelling);
                    }
                }
            }
        }
    } catch (Exception $e) {}

    $rates = ['usd' => $usd, 'eur' => $eur, 'updated_at' => date('Y-m-d H:i:s')];
    @file_put_contents($cacheFile, json_encode($rates));
    return $rates;
}
