const fs = require('fs');
const path = require('path');
const CertificateSyncSystem = require('./local_sync');

// テスト用の設定
const testConfig = {
  SOURCE_FOLDER: './test_files', // テスト用フォルダ
  TARGET_FOLDER_ID: '1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It',
  GOOGLE_CREDENTIALS_PATH: './credentials.json',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  POLL_INTERVAL: 10000, // 10秒
  LOG_LEVEL: 'debug'
};

// テスト用フォルダの作成
function createTestFolder() {
  if (!fs.existsSync(testConfig.SOURCE_FOLDER)) {
    fs.mkdirSync(testConfig.SOURCE_FOLDER, { recursive: true });
    console.log('テストフォルダを作成しました:', testConfig.SOURCE_FOLDER);
  }
}

// テストファイルの作成
function createTestFiles() {
  const testFiles = [
    {
      name: 'test_powder_coating.pdf',
      content: 'Test PDF content for powder coating',
      category: 'Powder Coating'
    },
    {
      name: 'test_pvdf_coating.pdf',
      content: 'Test PDF content for PVDF coating',
      category: 'PVDF coating'
    },
    {
      name: 'test_company_cert.pdf',
      content: 'Test PDF content for company certificate',
      category: 'Company Cert'
    },
    {
      name: 'test_galvanized_steel.pdf',
      content: 'Test PDF content for galvanized steel',
      category: 'Galvanized Steel Panel'
    },
    {
      name: 'test_stainless_steel.pdf',
      content: 'Test PDF content for stainless steel',
      category: 'Stainless Steel'
    },
    {
      name: 'test_gypsum_board.pdf',
      content: 'Test PDF content for gypsum board',
      category: 'Gypsum Board, M2Tech & Cement Board'
    },
    {
      name: 'test_standard_bd.pdf',
      content: 'Test PDF content for BD standard',
      category: 'Standards - pdf for reference'
    },
    {
      name: 'test_mill_cert.pdf',
      content: 'Test PDF content for mill certificate',
      category: 'Mill Cert'
    },
    {
      name: 'test_metal.pdf',
      content: 'Test PDF content for metal',
      category: 'Metal'
    },
    {
      name: 'test_ceiling_system.pdf',
      content: 'Test PDF content for ceiling system',
      category: 'Ceiling System'
    },
    {
      name: 'test_cement_board.pdf',
      content: 'Test PDF content for cement board',
      category: 'Cement Board'
    },
    {
      name: 'test_acoustic_material.pdf',
      content: 'Test PDF content for acoustic material',
      category: 'Acoustic Material'
    },
    {
      name: 'test_water_based_coating.pdf',
      content: 'Test PDF content for water based coating',
      category: 'Water Based Coating'
    },
    {
      name: 'test_wooden_sticker.pdf',
      content: 'Test PDF content for wooden sticker',
      category: 'Wooden Sticker'
    },
    {
      name: 'test_tai_shan.pdf',
      content: 'Test PDF content for Tai Shan',
      category: 'Tai Shan 泰山'
    },
    {
      name: 'test_sum_powder.pdf',
      content: 'Test PDF content for sum powder coating',
      category: 'Sum-Powder Coating'
    },
    {
      name: 'test_mk.pdf',
      content: 'Test PDF content for MK',
      category: 'MK'
    },
    {
      name: 'test_red.pdf',
      content: 'Test PDF content for RED',
      category: 'RED'
    },
    {
      name: 'test_soundex.pdf',
      content: 'Test PDF content for Soundex',
      category: 'Soundex'
    },
    {
      name: 'test_tee_grid.pdf',
      content: 'Test PDF content for Tee Grid',
      category: 'Tee Grid'
    },
    {
      name: 'test_standard_info.pdf',
      content: 'Test PDF content for test standard info',
      category: 'Test Standard Info'
    },
    {
      name: 'test_new_element.pdf',
      content: 'Test PDF content for new element',
      category: 'New Element 新元素'
    },
    {
      name: 'test_m6_stud_bolt.pdf',
      content: 'Test PDF content for M6 stud bolt',
      category: 'M6 Stud Bolt (M6 螺絲)'
    },
    {
      name: 'test_kirii_hk.pdf',
      content: 'Test PDF content for Kirii HK',
      category: 'Kirii HK'
    },
    {
      name: 'test_mineral_wool.pdf',
      content: 'Test PDF content for mineral wool',
      category: '泰石Mineral Wool'
    },
    {
      name: 'test_akso.pdf',
      content: 'Test PDF content for 阿克蘇',
      category: '阿克蘇'
    },
    {
      name: 'test_root_file.pdf',
      content: 'Test PDF content for root file',
      category: 'Root Files'
    }
  ];

  testFiles.forEach(file => {
    const filePath = path.join(testConfig.SOURCE_FOLDER, file.name);
    fs.writeFileSync(filePath, file.content);
    console.log(`テストファイル作成: ${file.name} → ${file.category}`);
  });
}

// テストファイルの削除
function cleanupTestFiles() {
  if (fs.existsSync(testConfig.SOURCE_FOLDER)) {
    fs.rmSync(testConfig.SOURCE_FOLDER, { recursive: true, force: true });
    console.log('テストファイルを削除しました');
  }
}

// テスト実行
async function runTest() {
  console.log('=== 認証書同期システム テスト開始 ===');

  try {
    // テスト環境の準備
    createTestFolder();
    createTestFiles();

    // 設定をテスト用に変更
    const originalConfig = require('./config');
    Object.assign(originalConfig, testConfig);

    // システムの初期化
    const syncSystem = new CertificateSyncSystem();

    // 統計情報の表示
    console.log('初期統計:', syncSystem.getStats());

    // システム開始
    console.log('システム開始中...');
    await syncSystem.start();

    // 5秒待機
    console.log('5秒待機中...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 統計情報の表示
    console.log('実行後統計:', syncSystem.getStats());

    // テストファイルの更新
    console.log('テストファイルを更新中...');
    const updateFile = path.join(testConfig.SOURCE_FOLDER, 'test_powder_coating.pdf');
    fs.writeFileSync(updateFile, 'Updated test PDF content for powder coating');

    // 5秒待機
    console.log('5秒待機中...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 最終統計情報の表示
    console.log('最終統計:', syncSystem.getStats());

    console.log('=== テスト完了 ===');

  } catch (error) {
    console.error('テストエラー:', error);
  } finally {
    // クリーンアップ
    cleanupTestFiles();
  }
}

// テスト実行
if (require.main === module) {
  runTest().catch(error => {
    console.error('テスト実行エラー:', error);
    process.exit(1);
  });
}

module.exports = {
  runTest,
  createTestFolder,
  createTestFiles,
  cleanupTestFiles
};

