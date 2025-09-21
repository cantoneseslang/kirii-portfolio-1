const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { google } = require('googleapis');
const winston = require('winston');
const moment = require('moment');

// ログ設定
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'sync.log' })
  ]
});

// 設定読み込み
const config = require('./config');

// Google Drive API設定
const auth = new google.auth.GoogleAuth({
  keyFile: config.GOOGLE_CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

class CertificateSyncSystem {
  constructor() {
    this.isRunning = false;
    this.processedFiles = new Set();
    this.setupGoogleDrive();
  }

  // Google Drive API初期化
  async setupGoogleDrive() {
    try {
      await auth.getClient();
      logger.info('Google Drive API認証成功');
    } catch (error) {
      logger.error('Google Drive API認証失敗:', error.message);
      process.exit(1);
    }
  }

  // メイン実行
  async start() {
    if (this.isRunning) {
      logger.warn('システムは既に実行中です');
      return;
    }

    logger.info('=== 認証書同期システム開始 ===');
    logger.info(`監視フォルダ: ${config.SOURCE_FOLDER}`);
    logger.info(`対象フォルダID: ${config.TARGET_FOLDER_ID}`);
    logger.info(`最大ファイルサイズ: ${config.MAX_FILE_SIZE / 1024 / 1024}MB`);

    this.isRunning = true;

    // 初回同期実行
    await this.initialSync();

    // ファイル監視開始
    this.startFileWatcher();

    // 定期同期（バックアップ）
    this.startPeriodicSync();

    logger.info('システム開始完了');
  }

  // 初回同期
  async initialSync() {
    logger.info('初回同期実行中...');
    
    try {
      if (!fs.existsSync(config.SOURCE_FOLDER)) {
        logger.error(`監視フォルダが存在しません: ${config.SOURCE_FOLDER}`);
        return;
      }

      const files = fs.readdirSync(config.SOURCE_FOLDER, { withFileTypes: true });
      const fileCount = files.filter(file => file.isFile()).length;
      
      logger.info(`処理対象ファイル数: ${fileCount}`);

      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(config.SOURCE_FOLDER, file.name);
          await this.processFile(filePath);
        }
      }

      logger.info('初回同期完了');
    } catch (error) {
      logger.error('初回同期エラー:', error.message);
    }
  }

  // ファイル監視開始
  startFileWatcher() {
    logger.info('ファイル監視開始');

    const watcher = chokidar.watch(config.SOURCE_FOLDER, {
      ignored: /(^|[\/\\])\../, // 隠しファイルを無視
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', async (filePath) => {
        logger.info(`新規ファイル検知: ${path.basename(filePath)}`);
        await this.processFile(filePath);
      })
      .on('change', async (filePath) => {
        logger.info(`ファイル変更検知: ${path.basename(filePath)}`);
        await this.processFile(filePath);
      })
      .on('error', (error) => {
        logger.error('ファイル監視エラー:', error.message);
      });

    // プロセス終了時のクリーンアップ
    process.on('SIGINT', () => {
      logger.info('システム終了中...');
      watcher.close();
      process.exit(0);
    });
  }

  // 定期同期（バックアップ）
  startPeriodicSync() {
    setInterval(async () => {
      logger.info('定期同期実行...');
      await this.initialSync();
    }, config.POLL_INTERVAL);
  }

  // ファイル処理
  async processFile(filePath) {
    try {
      const fileName = path.basename(filePath);
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;

      // ファイルサイズチェック
      if (fileSize > config.MAX_FILE_SIZE) {
        logger.warn(`ファイルサイズが大きすぎます: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
        return;
      }

      // ファイル拡張子チェック
      if (!this.isValidFileType(fileName)) {
        logger.warn(`サポートされていないファイル形式: ${fileName}`);
        return;
      }

      // カテゴリ判定
      const category = this.determineCategory(fileName);
      logger.info(`ファイル分類: ${fileName} → ${category}`);

      // 対象フォルダIDを取得
      const targetFolderId = await this.getOrCreateCategoryFolder(category);

      // ファイルが既に存在するかチェック
      const existingFileId = await this.findExistingFile(fileName, targetFolderId);

      if (existingFileId) {
        // 既存ファイルの更新日時をチェック
        const existingFile = await drive.files.get({
          fileId: existingFileId,
          fields: 'modifiedTime'
        });

        const existingModifiedTime = new Date(existingFile.data.modifiedTime);
        const localModifiedTime = fileStats.mtime;

        if (localModifiedTime <= existingModifiedTime) {
          logger.info(`変更なし: ${fileName}`);
          return;
        }

        // ファイルを更新
        await this.updateFile(filePath, existingFileId, fileName);
        logger.info(`ファイル更新完了: ${fileName} → ${category}`);
      } else {
        // 新規ファイルをアップロード
        await this.uploadFile(filePath, fileName, targetFolderId);
        logger.info(`ファイルアップロード完了: ${fileName} → ${category}`);
      }

      this.processedFiles.add(fileName);

    } catch (error) {
      logger.error(`ファイル処理エラー: ${path.basename(filePath)}`, error.message);
    }
  }

  // ファイル形式チェック
  isValidFileType(fileName) {
    const allowedExtensions = ['.pdf', '.xlsx', '.xls', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(fileName).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  // カテゴリ判定
  determineCategory(fileName) {
    const name = fileName.toLowerCase();
    
    if (name.includes('powder') || name.includes('粉末')) return 'Powder Coating';
    if (name.includes('pvdf')) return 'PVDF coating';
    if (name.includes('company') || name.includes('cert') || name.includes('会社') || name.includes('org')) return 'Company Cert';
    if (name.includes('galvanized') || name.includes('亜鉛')) return 'Galvanized Steel Panel';
    if (name.includes('stainless') || name.includes('ステンレス')) return 'Stainless Steel';
    if (name.includes('gypsum') || name.includes('石膏')) return 'Gypsum Board, M2Tech & Cement Board';
    if (name.includes('standard') || name.includes('標準') || name.includes('bd') || name.includes('en')) return 'Standards - pdf for reference';
    if (name.includes('mill') || name.includes('mill cert')) return 'Mill Cert';
    if (name.includes('metal')) return 'Metal';
    if (name.includes('ceiling')) return 'Ceiling System';
    if (name.includes('cement')) return 'Cement Board';
    if (name.includes('acoustic') || name.includes('sound')) return 'Acoustic Material';
    if (name.includes('water') || name.includes('水性')) return 'Water Based Coating';
    if (name.includes('wooden') || name.includes('木')) return 'Wooden Sticker';
    if (name.includes('tai') || name.includes('泰山')) return 'Tai Shan 泰山';
    if (name.includes('sum')) return 'Sum-Powder Coating';
    if (name.includes('mk')) return 'MK';
    if (name.includes('red')) return 'RED';
    if (name.includes('soundex')) return 'Soundex';
    if (name.includes('teegrid') || name.includes('tee')) return 'Tee Grid';
    if (name.includes('test') || name.includes('テスト')) return 'Test Standard Info';
    if (name.includes('new') || name.includes('新')) return 'New Element 新元素';
    if (name.includes('m6') || name.includes('螺絲')) return 'M6 Stud Bolt (M6 螺絲)';
    if (name.includes('kirii')) return 'Kirii HK';
    if (name.includes('泰石') || name.includes('mineral')) return '泰石Mineral Wool';
    if (name.includes('阿克蘇')) return '阿克蘇';
    
    return 'Root Files';
  }

  // カテゴリフォルダ取得/作成
  async getOrCreateCategoryFolder(categoryName) {
    try {
      // 既存フォルダを検索
      const response = await drive.files.list({
        q: `name='${categoryName}' and parents in '${config.TARGET_FOLDER_ID}' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id)'
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // 新規フォルダ作成
      const folderMetadata = {
        name: categoryName,
        parents: [config.TARGET_FOLDER_ID],
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      logger.info(`新規フォルダ作成: ${categoryName}`);
      return folder.data.id;

    } catch (error) {
      logger.error(`フォルダ作成エラー: ${categoryName}`, error.message);
      return config.TARGET_FOLDER_ID; // フォールバック
    }
  }

  // 既存ファイル検索
  async findExistingFile(fileName, folderId) {
    try {
      const response = await drive.files.list({
        q: `name='${fileName}' and parents in '${folderId}'`,
        fields: 'files(id)'
      });

      return response.data.files.length > 0 ? response.data.files[0].id : null;
    } catch (error) {
      logger.error(`既存ファイル検索エラー: ${fileName}`, error.message);
      return null;
    }
  }

  // ファイルアップロード
  async uploadFile(filePath, fileName, folderId) {
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: this.getMimeType(fileName),
      body: fs.createReadStream(filePath)
    };

    await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });
  }

  // ファイル更新
  async updateFile(filePath, fileId, fileName) {
    const media = {
      mimeType: this.getMimeType(fileName),
      body: fs.createReadStream(filePath)
    };

    await drive.files.update({
      fileId: fileId,
      media: media
    });
  }

  // MIMEタイプ取得
  getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // 統計情報取得
  getStats() {
    return {
      isRunning: this.isRunning,
      processedFiles: this.processedFiles.size,
      processedFileList: Array.from(this.processedFiles)
    };
  }
}

// メイン実行
async function main() {
  const syncSystem = new CertificateSyncSystem();
  await syncSystem.start();

  // 統計情報を定期的に出力
  setInterval(() => {
    const stats = syncSystem.getStats();
    logger.info(`統計: 処理済みファイル数 ${stats.processedFiles}`);
  }, 300000); // 5分間隔
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  logger.error('未処理の例外:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未処理のPromise拒否:', reason);
  process.exit(1);
});

// 実行
if (require.main === module) {
  main().catch(error => {
    logger.error('システム起動エラー:', error);
    process.exit(1);
  });
}

module.exports = CertificateSyncSystem;

