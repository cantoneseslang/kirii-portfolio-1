function updateAluminumPriceSheet() {
  try {
    // 直近の営業日を取得（土曜日と日曜日を除く）
    const today = new Date();
    let mostRecentBusinessDay = new Date(today);

    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0) { // 日曜日
      mostRecentBusinessDay.setDate(today.getDate() - 2); // 金曜日に戻す
    } else if (dayOfWeek === 6) { // 土曜日
      mostRecentBusinessDay.setDate(today.getDate() - 1); // 金曜日に戻す
    }

    // 最新の記事を見つける関数（変更なし）
    function findLatestArticle(baseUrl, marketType) {
      try {
        const response = UrlFetchApp.fetch(baseUrl);
        const html = response.getContentText();
        Logger.log(`${baseUrl} からHTMLを取得しました`);
        const $ = Cheerio.load(html);

        let marketPattern = marketType === "changjiang" ? "长江有色铝板价格行情" : "南海有色（灵通）铝锭价格";
        Logger.log(`検索市場パターン: ${marketPattern}`);

        const foundLinks = [];
        $('a').each(function() {
          const linkText = $(this).text().trim();
          const href = $(this).attr('href');

          if (href && linkText) {
            const isDateRangeArticle = linkText.includes('～') || linkText.includes('-') || linkText.includes('至');
            if (!isDateRangeArticle &&
                ((marketType === "changjiang" && linkText.includes("长江") && linkText.includes("铝板价格")) ||
                 (marketType === "nanhai" && linkText.includes("南海") && linkText.includes("铝锭价格")))) {
              let fullUrl = href.startsWith('/') ? `https://market.cnal.com${href}` : 
                           href.startsWith('http') ? href : `${baseUrl}/${href}`;
              const dateMatch = fullUrl.match(/\/(\d{4})\/(\d{2})-(\d{2})\//);
              if (dateMatch) {
                const urlYear = parseInt(dateMatch[1]);
                const urlMonth = parseInt(dateMatch[2]);
                const urlDay = parseInt(dateMatch[3]);
                const urlDate = new Date(urlYear, urlMonth - 1, urlDay);
                const chineseDateFormat = `${urlMonth}月${urlDay}日`;
                foundLinks.push({ text: linkText, url: fullUrl, date: urlDate, chineseDate: chineseDateFormat });
                Logger.log(`単日記事リンク: ${linkText} (${fullUrl})`);
              }
            }
          }
        });

        foundLinks.sort((a, b) => b.date - a.date);
        return foundLinks.length > 0 ? { url: foundLinks[0].url, title: foundLinks[0].text } : { url: baseUrl, title: "" };
      } catch (error) {
        Logger.log(`記事検索エラー: ${error.toString()}`);
        return null;
      }
    }

    // 価格データを抽出する関数（変更なし）
    function extractPriceData(url, marketType) {
      try {
        const response = UrlFetchApp.fetch(url);
        const html = response.getContentText();
        Logger.log(`HTMLコンテンツが正常に取得されました： ${url}`);
        const $ = Cheerio.load(html);

        const title = $('h1.tit').text().trim() || $('.tit').text().trim();
        Logger.log(`抽出されたタイトル: ${title}`);
        const dateTime = $('li.time').text().trim() || $('.time').text().trim();
        Logger.log(`抽出された日時: ${dateTime}`);
        let extractedDate = "";
        const dateMatch = title.match(/(\d+)月(\d+)日/);
        if (dateMatch) {
          const year = new Date().getFullYear();
          extractedDate = `${year}/${parseInt(dateMatch[1])}/${parseInt(dateMatch[2])}`;
          Logger.log(`タイトルから抽出された日付: ${extractedDate}`);
        }

        if (marketType === "changjiang") {
          let changjiangPrice = "";
          // テーブル内の価格を探す - HTMLテーブルの構造を詳細に解析
          const tables = $('table');
          Logger.log(`ページ内のテーブル数: ${tables.length}`);
          
          tables.each(function(tableIndex) {
            // テーブル全体の内容を確認
            const tableHtml = $(this).html();
            const tableText = $(this).text().trim();
            Logger.log(`テーブル${tableIndex + 1}のヘッダー: ${tableText.slice(0, 100)}`);
            
            // より詳細なテーブル構造のデバッグ情報
            const rows = $(this).find('tr');
            Logger.log(`テーブル${tableIndex + 1}の行数: ${rows.length}`);
            
            // 行ごとに詳細をログ出力
            rows.each(function(rowIndex) {
              const rowText = $(this).text().trim();
              const rowCells = $(this).find('th, td').map((_, el) => $(el).text().trim()).get();
              Logger.log(`行${rowIndex + 1}のテキスト: ${rowText.slice(0, 100)}`);
              Logger.log(`行${rowIndex + 1}のセル: [${rowCells.join('], [')}]`);
              
              // 「铝」が含まれる行かつ数字を含む行を特定（アルミニウムデータ行）
              if (rowText.includes('铝') && /\d{5}/.test(rowText)) {
                // 行のセルから直接日均价を取得する
                if (rowCells.length >= 3 && /^\d{5,6}$/.test(rowCells[2])) {
                  changjiangPrice = rowCells[2];
                  Logger.log(`アルミニウム行のセルから直接日均价を取得しました: ${changjiangPrice}`);
                  return false; // 内側のループを終了
                } else {
                  Logger.log(`アルミニウム行のセル構造: ${JSON.stringify(rowCells)}`);
                }
              }
            });
            
            // 上記で取得できなかった場合のバックアップ方法
            if (!changjiangPrice) {
              // テーブルから「铝」行を再検索し、別の方法で抽出
              rows.each(function(rowIndex) {
                const row = $(this);
                const rowText = row.text().trim();
                
                if (rowText.includes('铝') && /20\d{3}/.test(rowText)) {
                  // 行のテキストをセルに分割して直接取得を試みる
                  const cells = row.find('td');
                  Logger.log(`铝行のセル数: ${cells.length}`);
                  
                  // セルが正しく取得できていれば、日均价の位置（通常は3番目）から取得
                  cells.each(function(cellIndex) {
                    const cellText = $(this).text().trim();
                    Logger.log(`セル${cellIndex + 1}の内容: ${cellText}`);
                    
                    // 5桁の数字パターンにマッチし、価格範囲（20890-20930）ではないものを探す
                    if (/^20\d{3}$/.test(cellText) && !cellText.includes('-')) {
                      changjiangPrice = cellText;
                      Logger.log(`セルから日均价を直接取得しました: ${changjiangPrice}`);
                      return false;
                    }
                  });
                  
                  if (changjiangPrice) return false;
                }
              });
            }
            
            // ヘッダーと日均价の関係から抽出する方法
            if (!changjiangPrice && tableText.includes('日均价')) {
              // ヘッダー行を特定
              const headerRow = rows.find((_, el) => $(el).text().includes('日均价')).first();
              if (headerRow.length > 0) {
                Logger.log(`日均价を含むヘッダー行を見つけました`);
                
                // ヘッダーセルの位置を特定
                const headerCells = headerRow.find('th, td');
                let riJunJiaIndex = -1;
                
                headerCells.each(function(i) {
                  if ($(this).text().includes('日均价')) {
                    riJunJiaIndex = i;
                    Logger.log(`日均价カラムのインデックス: ${i}`);
                    return false;
                  }
                });
                
                // 「铝」を含む行を検索
                if (riJunJiaIndex !== -1) {
                  rows.each(function() {
                    const rowText = $(this).text();
                    if (rowText.includes('铝') && /20\d{3}/.test(rowText)) {
                      const cells = $(this).find('td');
                      if (cells.length > riJunJiaIndex) {
                        const cellValue = cells.eq(riJunJiaIndex).text().trim();
                        if (/^20\d{3}$/.test(cellValue)) {
                          changjiangPrice = cellValue;
                          Logger.log(`日均价カラムから直接値を取得しました: ${changjiangPrice}`);
                          return false;
                        }
                      }
                    }
                  });
                }
              }
            }
            
            // さらにバックアップの方法として、テーブルセルのHTMLソースを検査
            if (!changjiangPrice) {
              $('td').each(function() {
                const cellText = $(this).text().trim();
                // 20910のような5桁の数字で、価格範囲ではないものを探す
                if (/^20\d{3}$/.test(cellText) && !cellText.includes('-')) {
                  // 前後のセルをチェックしてアルミニウム行かどうか確認
                  const parentRow = $(this).parent('tr');
                  if (parentRow.text().includes('铝')) {
                    changjiangPrice = cellText;
                    Logger.log(`テーブルセルから直接20910形式の値を見つけました: ${changjiangPrice}`);
                    return false;
                  }
                }
              });
            }
          });

          // テーブルで見つからない場合、記事のテキスト内で特定のパターンを探す
          if (!changjiangPrice) {
            Logger.log(`テーブル検索で価格が見つからなかったため、コンテンツ全体を検索します`);
            const articleText = $('.article').text() || $('body').text();
            
            // パターン: 金属类别、价格区间、日均价パターンの抽出
            const tablePatternInText = articleText.match(/金属类别.*?价格区间.*?日均价.*?铝.*?(\d{5,6})-(\d{5,6}).*?(\d{5,6})/s);
            if (tablePatternInText && tablePatternInText[3]) {
              changjiangPrice = tablePatternInText[3];
              Logger.log(`コンテンツからテーブルパターンで日均价を抽出しました: ${changjiangPrice}`);
            } else {
              // パターン: "铝" + 価格範囲 + 日均价
              const aluminumPattern = articleText.match(/铝.*?(\d{5,6})-(\d{5,6}).*?(\d{5,6})/);
              if (aluminumPattern && aluminumPattern[3]) {
                changjiangPrice = aluminumPattern[3];
                Logger.log(`コンテンツからアルミニウムパターンで日均价を抽出しました: ${changjiangPrice}`);
              } else {
                // パターン: 直接"日均价"の後の数字を探す
                const riJunJiaMatch = articleText.match(/日均价[:：]?\s*(\d{5,6})/);
                if (riJunJiaMatch) {
                  changjiangPrice = riJunJiaMatch[1];
                  Logger.log(`コンテンツから「日均价」直接パターンで長江価格を見つけました: ${changjiangPrice}`);
                } else {
                  // パターン: "价格区间" と "日均价" の間の数値パターンを探す
                  const rangeAverageMatch = articleText.match(/价格区间[^]*?(\d{5,6})-(\d{5,6})[^]*?日均价[^]*?(\d{5,6})/);
                  if (rangeAverageMatch && rangeAverageMatch[3]) {
                    changjiangPrice = rangeAverageMatch[3];
                    Logger.log(`コンテンツから「价格区间-日均价」パターンで長江価格を見つけました: ${changjiangPrice}`);
                  } else {
                    // パターン: 特定のキーワードの近くにある数字を探す
                    const specificPattern = articleText.match(/长江.*?铝.*?价格.*?(\d{5,6})/);
                    if (specificPattern) {
                      changjiangPrice = specificPattern[1];
                      Logger.log(`コンテンツから特定パターンで長江価格を見つけました: ${changjiangPrice}`);
                    } else {
                      // 最終手段: 本文内の数字をより詳細に検索
                      const priceMatchesDetailed = articleText.match(/\b2\d{4}\b/g); // 2万台の数字を探す
                      if (priceMatchesDetailed && priceMatchesDetailed.length > 1) {
                        // 20890と20930の次の数字が20910の可能性が高い
                        changjiangPrice = priceMatchesDetailed[2] || priceMatchesDetailed[0];
                        Logger.log(`コンテンツから数字パターン詳細検索で長江価格を見つけました: ${changjiangPrice}`);
                      } else {
                        // 従来の方法
                        const priceMatches = articleText.match(/\b\d{5,6}\b/g);
                        changjiangPrice = priceMatches ? priceMatches[0] : "";
                        Logger.log(`コンテンツから長江価格を見つけました: ${changjiangPrice}`);
                      }
                    }
                  }
                }
              }
            }
          }
          
          return { title, dateTime, extractedDate, price: changjiangPrice };
        } else if (marketType === "nanhai") {
          let nanhaiPrice = "";
          let foundRow = "";
          
          // まず特定のパターンを持つ行を探す
          $('tr').each(function() {
            const rowText = $(this).text().trim();
            if ((rowText.includes("佛山") || rowText.includes("南海")) && 
                (rowText.includes("A00") || rowText.includes("铝锭") || rowText.includes("铝"))) {
              foundRow = rowText;
              Logger.log(`関連する行が見つかりました: ${rowText}`);
              
              // まず "21000-21100" のような範囲の後の価格を探す (修正されたパターン)
              const rangeMatch = rowText.match(/(\d{5})-(\d{5})(?:.*?)(\d{5})/);
              if (rangeMatch && rangeMatch[3]) {
                nanhaiPrice = rangeMatch[3];
                Logger.log(`南海価格値を正確に見つけました: ${nanhaiPrice}`);
                return false;
              }
              
              // 次に、A00価格が言及されている行から数値を抽出
              const a00Match = rowText.match(/A00.*?(\d{5,6})/i);
              if (a00Match) {
                nanhaiPrice = a00Match[1];
                Logger.log(`A00パターンから南海価格を見つけました: ${nanhaiPrice}`);
                return false;
              }
              
              // その行に含まれるすべての5-6桁の数字を探す
              const priceMatches = rowText.match(/\b\d{5,6}\b/g);
              if (priceMatches && priceMatches.length > 0) {
                // 最後の5-6桁の数字を価格として使用（多くの場合、最終価格が最後に表示される）
                nanhaiPrice = priceMatches[priceMatches.length - 1];
                Logger.log(`行から南海価格を見つけました: ${nanhaiPrice}`);
                return false;
              }
            }
          });
          
          // テーブル検索で見つからない場合、記事のテキスト内で特定のパターンを探す
          if (!nanhaiPrice) {
            Logger.log(`行検索で価格が見つからなかったため、コンテンツ全体を検索します`);
            const articleText = $('.article').text() || $('body').text();
            
            // 「南海」や「佛山」に近い5-6桁の数字を探す
            const specificPattern = articleText.match(/(?:南海|佛山).*?[A00|铝锭].*?(\d{5,6})/);
            if (specificPattern) {
              nanhaiPrice = specificPattern[1];
              Logger.log(`コンテンツから特定パターンで南海価格を見つけました: ${nanhaiPrice}`);
            } else {
              // 前回見つかった既知の価格から近い値を探す (フォールバック)
              const priceMatches = articleText.match(/\b\d{5,6}\b/g);
              if (priceMatches && priceMatches.length > 1) {
                nanhaiPrice = priceMatches[priceMatches.length - 1]; // 最後の5-6桁の数字を使用
                Logger.log(`コンテンツから南海価格を見つけました: ${nanhaiPrice}`);
              }
            }
          }
          
          return { title, dateTime, extractedDate, price: nanhaiPrice };
        }
        return null;
      } catch (error) {
        Logger.log(`データ抽出エラー: ${error.toString()}`);
        return { title: "", dateTime: "", extractedDate: "", price: "" };
      }
    }

    const changjiangBaseUrl = "https://market.cnal.com/changjiang";
    const nanhaiBaseUrl = "https://market.cnal.com/nanhai";

    const changjiangData = findLatestArticle(changjiangBaseUrl, "changjiang");
    const nanhaiData = findLatestArticle(nanhaiBaseUrl, "nanhai");

    if (!changjiangData || !nanhaiData) throw new Error("最新価格記事が見つかりませんでした");

    const changjiangPriceData = extractPriceData(changjiangData.url, "changjiang");
    const nanhaiPriceData = extractPriceData(nanhaiData.url, "nanhai");

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("当天铝锭价格");
    if (!sheet) throw new Error("シート '当天铝锭价格' が見つかりません");

    sheet.insertRowAfter(2);
    let dateStr = changjiangPriceData.extractedDate || nanhaiPriceData.extractedDate || 
                  (mostRecentBusinessDay.getFullYear() + "/" + (mostRecentBusinessDay.getMonth() + 1) + "/" + mostRecentBusinessDay.getDate());

    sheet.getRange("A3").setValue(dateStr);
    sheet.getRange("B3").setValue(changjiangPriceData.price);
    sheet.getRange("J3").setValue(nanhaiPriceData.price);
    sheet.getRange("C4:H4").copyTo(sheet.getRange("C3:H3"), {contentsOnly: false});
    sheet.getRange("K4:P4").copyTo(sheet.getRange("K3:P3"), {contentsOnly: false});

    const comparisonSheet = spreadsheet.getSheetByName("供应商资料及最新铝价与旧价对比");
    if (comparisonSheet) {
      comparisonSheet.getRange("J3").setFormula("='当天铝锭价格'!A3");
      comparisonSheet.getRange("K3").setFormula("='当天铝锭价格'!B3");
      comparisonSheet.getRange("M3").setFormula("='当天铝锭价格'!J3");
      comparisonSheet.getRange("J4").setFormula("='当天铝锭价格'!A4");
      comparisonSheet.getRange("K4").setFormula("='当天铝锭价格'!B4");
      comparisonSheet.getRange("M4").setFormula("='当天铝锭价格'!J4");

      // 数式をsetFormulaで直接設定
      comparisonSheet.getRange("J8").setFormula("=XLOOKUP(DATE(YEAR(J3),MONTH(J3)-3,DAY(J3)),'当天铝锭价格'!A:A,'当天铝锭价格'!A:A,\"\",0,1)");
      comparisonSheet.getRange("J9").setFormula("=INDEX('当天铝锭价格'!A:A,MATCH(MINIFS('当天铝锭价格'!A:A,'当天铝锭价格'!A:A,\">=\"&DATE(2025,1,1)),'当天铝锭价格'!A:A,0))");
      comparisonSheet.getRange("K8").setFormula("=XLOOKUP(DATE(YEAR(J3),MONTH(J3)-3,DAY(J3)),'当天铝锭价格'!A:A,'当天铝锭价格'!B:B,\"\",0,1)");
      comparisonSheet.getRange("K9").setFormula("=INDEX('当天铝锭价格'!B:B,MATCH(MINIFS('当天铝锭价格'!A:A,'当天铝锭价格'!A:A,\">=\"&DATE(2025,1,1)),'当天铝锭价格'!A:A,0))");
      comparisonSheet.getRange("L8").setFormula("=(K3-K8)/K8");
      comparisonSheet.getRange("L9").setFormula("=(K3-K9)/K9");
      comparisonSheet.getRange("M8").setFormula("=VLOOKUP(J8,'当天铝锭价格'!A:J,10,FALSE)");
      comparisonSheet.getRange("M9").setFormula("=VLOOKUP(J9,'当天铝锭价格'!A:J,10,FALSE)");
      comparisonSheet.getRange("N8").setFormula("=(M3-M8)/M8");
      comparisonSheet.getRange("N9").setFormula("=(M3-M9)/M9");

      const now = new Date();
      const updateInfo = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()} 已更新\n${nanhaiData.title} (${nanhaiData.url}),\n${changjiangData.title} (${changjiangData.url})`;
      comparisonSheet.getRange("I10").setValue(updateInfo).setHorizontalAlignment("left");
    }

    SpreadsheetApp.flush();
    Utilities.sleep(5000); // 計算完了を待機

    // Excelエクスポートとメール送信
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheet.getId()}/export?format=xlsx`;
    const params = { method: "get", headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken()}, muteHttpExceptions: true };
    const response = UrlFetchApp.fetch(exportUrl, params);
    const formattedDateForFilename = dateStr.replace(/\//g, '-');
    const blob = response.getBlob().setName(`供应商资料及最新铝价分析表_${formattedDateForFilename}.xlsx`);

    const dateParts = dateStr.split("/");
    const formattedDate = `${dateParts[0]}年${dateParts[1]}月${dateParts[2]}日`;
    const recipient = "bestinksalesman@gmail.com, hirokisakon@kirii.com.hk";
    const subject = `供应商资料及最新铝价分析表更新 - ${formattedDate}`;
    const body = `${formattedDate}供应商资料及最新铝价分析表已经更新。\n\n更新内容:\n- 長江价格: ${changjiangPriceData.price} 元/噸\n- 南海价格: ${nanhaiPriceData.price} 元/噸\n请查看供应商资料及最新铝价分析表。\nhttps://docs.google.com/spreadsheets/d/1RQb5fBTipFZPslbG60vP46DJZ8ZD9D7a7_eaKw718nM/edit?gid=112913047#gid=112913047\n\n如过国内不能参阅如上link请各自下载附件excel表\n请查看附件excel供应商资料及最新铝价分析表。\n\n这由于从佐近电邮自动发信息过来的。`;

    GmailApp.sendEmail(recipient, subject, body, { attachments: [blob], name: "供应商资料及最新铝价分析表自动更新" });
    Logger.log(`メール送信完了: ${recipient}`);

    return "すべての更新が完了しました";
  } catch (e) {
    Logger.log("エラー: " + e.toString());
    return "エラー: " + e.toString();
  }
}

/**
 * Gmailの添付ファイル（Excel）を処理し、指定のスプレッドシートにデータを転記する関数
 */
function processGmailAttachment() {
  const targetSpreadsheetId = "1RQb5fBTipFZPslbG60vP46DJZ8ZD9D7a7_eaKw718nM";
  const targetSheetName = "镀锌板卷价格";
  const searchSubject = "Today Mysteeldata";
  const excelSheetName = "日价格";

  try {
    console.log("processGmailAttachment の実行を開始します");

    // 件名で検索し、最新のメールを取得（既読/未読に関係なく）
    const threads = GmailApp.search(`subject:"${searchSubject}" newer_than:1d`, 0, 1);
    console.log(`検索条件に一致するスレッド数: ${threads.length}`);

    if (threads.length === 0) {
      console.log("対象のメールが見つかりませんでした。処理を終了します。");
      return;
    }

    // 最新のメッセージを取得
    const latestMessage = threads[0].getMessages()[threads[0].getMessageCount() - 1];
    console.log(`処理するメール - 件名: ${latestMessage.getSubject()}`);
    console.log(`処理するメール - 日時: ${latestMessage.getDate()}`);

    // 添付ファイルを確認
    const attachments = latestMessage.getAttachments();
    console.log(`添付ファイル数: ${attachments.length}`);

    let excelAttachment = null;
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      const attachmentName = attachment.getName();
      console.log(`添付ファイル ${i + 1}: ${attachmentName}`);

      // Excelファイルの検索条件を拡張
      if (attachmentName.endsWith('.xls') || attachmentName.endsWith('.xlsx') || 
          attachmentName.includes('Mysteel') || attachmentName.includes('价格')) {
        excelAttachment = attachment;
        console.log(`処理対象のExcelファイルを見つけました: ${attachmentName}`);
        break;
      }
    }

    if (!excelAttachment) {
      console.log("処理対象のExcelファイルが見つかりませんでした。");
      return;
    }

    // --- Google Sheets API を使用してExcelデータを読み取る ---
    // 1. 一時的にGoogle Driveにファイルを保存
    const tempFolder = DriveApp.getRootFolder(); // ルートフォルダを使用（必要に応じて変更）
    const tempFile = tempFolder.createFile(excelAttachment);
    const tempFileId = tempFile.getId();
    Logger.log(`Excelファイルを一時的にDriveに保存しました: ${tempFile.getName()} (ID: ${tempFileId})`);

    // 2. DriveファイルをGoogle Sheets形式に変換 (Sheets APIを使用)
    // この操作には Drive API v2 が必要です。GASエディタの「サービス」で「Drive API」を追加し、バージョンをv2にしてください。
    const convertedSheet = Drive.Files.copy({ mimeType: MimeType.GOOGLE_SHEETS }, tempFileId);
    const convertedSheetId = convertedSheet.id;
    Logger.log(`ファイルをGoogle Sheets形式に変換しました (ID: ${convertedSheetId})`);

    // 3. 変換されたスプレッドシートを開く
    let sourceSpreadsheet;
    let sourceSheet;
    try {
      sourceSpreadsheet = SpreadsheetApp.openById(convertedSheetId);
      sourceSheet = sourceSpreadsheet.getSheetByName(excelSheetName);

      if (!sourceSheet) {
        // 指定されたシート名が見つからない場合、最初のシートを使用するフォールバック
        Logger.log(`Excel内にシート名「${excelSheetName}」が見つかりません。最初のシートを使用します。`);
        const allSheets = sourceSpreadsheet.getSheets();
        if (allSheets.length > 0) {
          sourceSheet = allSheets[0];
          Logger.log(`フォールバックとしてシート「${sourceSheet.getName()}」を使用します。`);
        } else {
          throw new Error("変換されたスプレッドシートにシートが見つかりません。");
        }
      } else {
         Logger.log(`読み取り元シートを取得しました: ${sourceSheet.getName()}`);
      }
    } catch (openError) {
       Logger.log(`変換されたスプレッドシートを開く際にエラーが発生しました: ${openError}`);
       // 一時ファイルを削除
       try { DriveApp.getFileById(tempFileId).setTrashed(true); } catch(e) { Logger.log(`一時ファイル削除エラー(tempFileId): ${e}`);}
       try { DriveApp.getFileById(convertedSheetId).setTrashed(true); } catch(e) { Logger.log(`一時ファイル削除エラー(convertedSheetId): ${e}`);}
       // メールを既読にする
       try { latestMessage.markRead(); Logger.log("エラー発生後、メールを既読にしました。"); } catch(e) { Logger.log(`メール既読化エラー: ${e}`);}
       throw openError; // エラーを再スロー
    }


    // 4. データを取得
    const sourceData = sourceSheet.getDataRange().getValues();
    Logger.log(`読み取り元シートから ${sourceData.length} 行、${sourceData[0] ? sourceData[0].length : 0} 列のデータを取得しました。`);

    // 5. 一時ファイルを削除
    // Drive API v2 を使用しているため、DriveAppではなくDriveサービスで削除
    try { Drive.Files.remove(tempFileId); Logger.log(`一時ファイル (ID: ${tempFileId}) を削除しました。`); } catch(e) { Logger.log(`一時ファイル削除エラー(tempFileId): ${e}`);}
    try { Drive.Files.remove(convertedSheetId); Logger.log(`変換後ファイル (ID: ${convertedSheetId}) を削除しました。`); } catch(e) { Logger.log(`一時ファイル削除エラー(convertedSheetId): ${e}`);}
    // --- 読み取り完了 ---

    // 転記先のスプレッドシートとシートを取得
    const targetSpreadsheet = SpreadsheetApp.openById(targetSpreadsheetId);
    const targetSheet = targetSpreadsheet.getSheetByName(targetSheetName);

    if (!targetSheet) {
      throw new Error(`転記先のスプレッドシートにシート名「${targetSheetName}」が見つかりません。`);
    }
    Logger.log(`転記先シートを取得しました: ${targetSheet.getName()}`);

    // 転記先シートの既存データをクリア
    targetSheet.clearContents();
    Logger.log("転記先シートの既存データをクリアしました。");

    // データを転記先に貼り付け
    if (sourceData.length > 0 && sourceData[0].length > 0) {
      targetSheet.getRange(1, 1, sourceData.length, sourceData[0].length).setValues(sourceData);
      Logger.log(`データを転記先シートに貼り付けました。`);
    } else {
      Logger.log("読み取るデータがありませんでした。");
    }

    // 処理済みのメールを既読にする
    latestMessage.markRead();
    Logger.log("メールを既読にしました。");

    SpreadsheetApp.flush(); // 変更を即時反映

    // --- 完了ログをシートに書き込む ---
    try {
      const comparisonSheet = targetSpreadsheet.getSheetByName("供应商资料及最新铝价与旧价对比");
      if (comparisonSheet) {
        const now = new Date();
        const formattedDateTime = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy年MM月dd日 HH:mm");
        const logMessage = `${formattedDateTime} 已更新\n收集信息源：我的钢铁 https://price.mysteel.com/#/price-search?breedId=1-1`;
        comparisonSheet.getRange("I21").setValue(logMessage).setVerticalAlignment("top").setWrap(true); // 縦位置を上揃えにし、折り返しを有効にする
        Logger.log(`完了ログをシート「供应商资料及最新铝价与旧价对比」のセルI21に書き込みました。`);
      } else {
        Logger.log("シート「供应商资料及最新铝价与旧价对比」が見つからなかったため、完了ログを書き込めませんでした。");
      }
    } catch (logError) {
      Logger.log(`完了ログの書き込み中にエラーが発生しました: ${logError.toString()}`);
    }
    // --- 完了ログ書き込み終了 ---

    console.log("処理が正常に完了しました");
    
    // 処理結果をメールで通知
    const now = new Date();
    GmailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      "データ更新完了通知",
      `処理が完了しました。\n` +
      `更新日時: ${now.toLocaleString()}\n` +
      `処理したメール件名: ${latestMessage.getSubject()}\n` +
      `処理したファイル: ${excelAttachment.getName()}`
    );

  } catch (e) {
    console.error(`エラーが発生しました: ${e.toString()}`);
    console.error(`スタックトレース: ${e.stack}`);
    
    // エラー通知メールの送信
    GmailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      "データ更新エラー通知",
      `処理中にエラーが発生しました。\n` +
      `エラー内容: ${e.toString()}\n\n` +
      `スタックトレース:\n${e.stack}`
    );
    
    throw e;
  }
}

/**
 * グラフデータを更新し、自動的にグラフを更新する関数
 */
function updatePriceChart() {
  normalizeSteelSheetDates();
  normalizeAluminumSheetDates();
  const spreadsheetId = "1RQb5fBTipFZPslbG60vP46DJZ8ZD9D7a7_eaKw718nM";
  const ss = SpreadsheetApp.openById(spreadsheetId);
  
  // データソースシートの取得
  const aluminumSheet = ss.getSheetByName("当天铝锭价格");
  const steelSheet = ss.getSheetByName("镀锌板卷价格");
  
  // グラフ用の新しいシートを取得または作成
  let chartSheet = ss.getSheetByName("価格推移グラフ");
  if (!chartSheet) {
    chartSheet = ss.insertSheet("価格推移グラフ");
  }

  // データ範囲を取得
  const lastRowAlu = aluminumSheet.getLastRow();
  const lastRowSteel = steelSheet.getLastRow();
  
  // アルミデータを取得（日付、長江価格B、南海価格J）
  const aluData = aluminumSheet.getRange(`A3:J${lastRowAlu}`).getValues();
  
  // 鉄鋼板データを取得（日付、5種類の価格B-F）
  const steelData = steelSheet.getRange(`A5:F${lastRowSteel}`).getValues();
  
  // 2024年から最新までのデータのみをフィルタリング
  const startDate = new Date('2024-01-01');
  const endDate = new Date();
  
  // 日付を正しく処理する関数
  function parseDate(dateValue) {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    if (typeof dateValue === 'string') {
      let parts;
      if (dateValue.includes('/')) {
        parts = dateValue.split('/');
      } else if (dateValue.includes('-')) {
        parts = dateValue.split('-');
      }
      if (parts && parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    return null;
  }

  // データを一意の日付でグループ化
  const dateMap = new Map();
  
  // アルミデータの処理
  aluData.forEach((row, idx) => {
    const date = parseDate(row[0]);
    const changjiangPrice = row[1] ? parseFloat(row[1].toString().replace(/[^\d.-]/g, '')) : null;
    const nanhaiPrice = row[9] ? parseFloat(row[9].toString().replace(/[^\d.-]/g, '')) : null;
    if (!date || isNaN(date.getTime())) Logger.log(`  × 日付パース失敗: ${row[0]}`);
    if (changjiangPrice === null || isNaN(changjiangPrice)) Logger.log(`  × 长江価格パース失敗: ${row[1]}`);
    if (nanhaiPrice === null || isNaN(nanhaiPrice)) Logger.log(`  × 南海価格パース失敗: ${row[9]}`);
    if (!row[0] || !row[1] || !row[9]) Logger.log(`  × いずれかの値が空欄: 日付=${row[0]}, 长江=${row[1]}, 南海=${row[9]}`);
    if (!date || isNaN(date.getTime()) || changjiangPrice === null || isNaN(changjiangPrice) || nanhaiPrice === null || isNaN(nanhaiPrice)) return;
    if (date < startDate || date > endDate) return;
    const dateKey = Utilities.formatDate(date, 'Asia/Shanghai', 'yyyy/MM/dd');
    if (changjiangPrice !== null || nanhaiPrice !== null) {
      dateMap.set(dateKey, {
        date: date,
        changjiang: changjiangPrice,
        nanhai: nanhaiPrice,
        steelPrices: Array(5).fill(null)
      });
    }
  });

  // 鉄鋼板データの処理
  steelData.forEach(row => {
    if (!row[0]) return;
    
    try {
      const date = parseDate(row[0]);
      if (!date || isNaN(date.getTime())) return;
      if (date < startDate || date > endDate) return;
      
      const dateKey = Utilities.formatDate(date, 'Asia/Shanghai', 'yyyy/MM/dd');
      const prices = row.slice(1).map(price => {
        if (!price) return null;
        const parsed = parseFloat(price.toString().replace(/[^\d.-]/g, ''));
        return isNaN(parsed) ? null : parsed;
      });
      
      if (dateMap.has(dateKey)) {
        dateMap.get(dateKey).steelPrices = prices;
      } else {
        dateMap.set(dateKey, {
          date: date,
          changjiang: null,
          nanhai: null,
          steelPrices: prices
        });
      }
    } catch (e) {
      Logger.log(`鉄鋼板データ処理エラー: ${e.toString()}, Row: ${JSON.stringify(row)}`);
    }
  });

  // ソートされたユニークなデータを作成
  const uniqueData = Array.from(dateMap.values())
    .sort((a, b) => a.date - b.date)
    .map(item => [
      new Date(item.date), // 日付型で書き込む
      item.changjiang,
      item.nanhai,
      ...item.steelPrices
    ])
    .map(row => {
      return row.map((cell, index) => {
        if (index === 0) return cell;
        const num = Number(cell);
        return isNaN(num) ? null : num;
      });
    });

  // 2週間ごとにデータを抽出（間引きロジックを削除し、全データを使う）
  const filteredData = uniqueData;

  // データを非表示のシートに保存
  const hiddenSheet = ss.getSheetByName("グラフデータ") || ss.insertSheet("グラフデータ");
  hiddenSheet.hideSheet();
  hiddenSheet.clear();

  // ヘッダー設定
  const headers = ["日付", "長江アルミ価格", "南海アルミ価格", 
                  "鉄鋼板価格1", "鉄鋼板価格2", "鉄鋼板価格3", "鉄鋼板価格4", "鉄鋼板価格5"];
  hiddenSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Excel互換のため、空欄やnull値は'=NA()'に変換する関数
  function safeValue(val) {
    return (val === null || val === '' || typeof val === 'undefined') ? '=NA()' : val;
  }

  // データを書き込み
  if (filteredData.length > 0) {
    const naFilteredData = filteredData.map(row => row.map(safeValue));
    hiddenSheet.getRange(2, 1, naFilteredData.length, headers.length).setValues(naFilteredData);
    const dateRange = hiddenSheet.getRange(2, 1, naFilteredData.length, 1);
    const dateValues = dateRange.getValues();
    const newDateValues = dateValues.map(row => [parseDate(row[0])]);
    dateRange.setValues(newDateValues);
    dateRange.setNumberFormat('yyyy/mm/dd');
    hiddenSheet.getRange(2, 2, naFilteredData.length, headers.length - 1).setNumberFormat('#,##0');
  }

  // グラフシートの既存のグラフを削除
  chartSheet.clear();
  const charts = chartSheet.getCharts();
  charts.forEach(chart => chartSheet.removeChart(chart));

  // 新しいグラフをLINEチャートとして直接作成
  const dataRange = hiddenSheet.getRange(1, 1, filteredData.length + 1, headers.length);
  let chart = chartSheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(dataRange)
    .setPosition(1, 1, 0, 0)
    .setOption('useFirstColumnAsDomain', true)
    .setOption('title', '铝锭・镀锌板卷价格走势图')
    .setOption('width', 1200)
    .setOption('height', 800)
    .setOption('series', {
      0: {targetAxisIndex: 0, labelInLegend: '长江铝锭', pointSize: 7},
      1: {targetAxisIndex: 0, labelInLegend: '南海灵通铝锭', pointSize: 7},
      2: {targetAxisIndex: 0, labelInLegend: '有花,DX51D+Z,1*1219*C,120g乐从镇,鞍钢', pointSize: 7},
      3: {targetAxisIndex: 0, labelInLegend: '无花,DX51D+Z,1*1250*C,120g,乐从镇,鞍钢', pointSize: 7},
      4: {targetAxisIndex: 0, labelInLegend: '无花,DX51D+Z,1*1250*C,120g,济南,宝钢', pointSize: 7},
      5: {targetAxisIndex: 0, labelInLegend: '无花,DX51D+Z,1*1250*C,120g,广州,鞍钢', pointSize: 7},
      6: {targetAxisIndex: 0, labelInLegend: '无花,DX51D+Z,1*1250*C,120g,天津,河钢唐', pointSize: 7}
    })
    .setOption('vAxes', {
      0: {
        viewWindow: { min: 3500, max: 25000 },
        format: '#,##0',
        logScale: true
      }
    })
    .setOption('legend', {
      position: 'bottom',
      alignment: 'start',
      maxLines: 7,
      textStyle: {
        fontSize: 11
      }
    })
    .setOption('chartArea', {
      width: '90%',
      height: '80%',
      left: '8%',
      top: '5%'
    })
    .setOption('hAxis', {
      title: '',
      type: 'date',
      titleTextStyle: {
        italic: false,
        bold: true,
        fontSize: 11
      },
      format: 'yyyy/MM/dd',
      slantedText: true,
      slantedTextAngle: 0,
      showTextEvery: 14,
      gridlines: {count: 10},
      minorGridlines: {count: 10},
      viewWindow: {
        min: startDate,
        max: endDate
      },
      textStyle: {
        fontSize: 10
      }
    })
    .setOption('lineWidth', 4)
    .setOption('interpolateNulls', true)
    .build();
  chartSheet.insertChart(chart);

  // M1:R1を結合して大見出し
  chartSheet.getRange('M1:R1').merge().setValue('现价与旧价对比');
  chartSheet.getRange('M1').setHorizontalAlignment('center');

  // ヘッダー（M2:R2）
  const header = [['', '日期', '长江铝锭(元/吨)', '长江铝锭走势(%)', '南海灵通铝锭(元/吨)', '南海灵通铝锭走势(%)']];
  chartSheet.getRange(2, 13, 1, 6).setValues(header);
  // ヘッダーを中央揃え
  chartSheet.getRange(2, 13, 1, 6).setHorizontalAlignment('center');

  // 行タイトル（M3:M9）
  const rowTitles = [
    '最新单价',
    '对比前一天',
    '对比上星期同期',
    '对比本月初',
    '对比上月同期',
    '对比上一季度同期',
    '对比年初'
  ];
  chartSheet.getRange(3, 13, rowTitles.length, 1).setValues(rowTitles.map(v => [v]));

  // データ部分（N3:R9）は空欄でOK
  chartSheet.getRange(3, 14, 7, 6).clearContent();

  Logger.log(`処理されたデータ数: ${filteredData.length}`);
  Logger.log(`最初のデータ: ${JSON.stringify(filteredData[0])}`);
  Logger.log(`最後のデータ: ${JSON.stringify(filteredData[filteredData.length-1])}`);

  // --- 比較表データ自動取得・反映 ---
  const aluCompareData = aluminumSheet.getRange(3, 1, aluminumSheet.getLastRow() - 2, 10).getValues();

  // 日付パース関数
  function parseDateString(str) {
    if (str instanceof Date) return str;
    if (typeof str === 'string') {
      let parts = str.includes('/') ? str.split('/') : str.split('-');
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    return null;
  }

  // 最新データ取得
  const latestRow = aluCompareData[0]; // 先頭行が最新
  const latestDate = parseDateString(latestRow[0]);
  const latestChangjiang = latestRow[1];
  const latestNanhai = latestRow[9];

  // 比較用ターゲット日付を計算
  function getTargetDate(base, type) {
    const d = new Date(base.getTime());
    switch(type) {
      case 'prevDay': d.setDate(d.getDate() - 1); break;
      case 'weekAgo': d.setDate(d.getDate() - 7); break;
      case 'monthStart': d.setDate(1); break;
      case 'monthAgo': d.setMonth(d.getMonth() - 1); break;
      case 'quarterAgo': d.setMonth(d.getMonth() - 3); break;
      case 'yearStart': d.setMonth(0); d.setDate(2); break;
    }
    return d;
  }

  // 指定日付に完全一致する行を返す
  function findRowByDate(target) {
    for (let i = 0; i < aluCompareData.length; i++) {
      const rowDate = parseDateString(aluCompareData[i][0]);
      if (!rowDate) continue;
      if (
        rowDate.getFullYear() === target.getFullYear() &&
        rowDate.getMonth() === target.getMonth() &&
        rowDate.getDate() === target.getDate()
      ) {
        return aluCompareData[i];
      }
    }
    return null; // 見つからなければnull
  }

  // target日付以前で一番近いデータを返す
  function findClosestPastRow(target) {
    let minDiff = Infinity, found = null;
    for (let i = 0; i < aluCompareData.length; i++) {
      const rowDate = parseDateString(aluCompareData[i][0]);
      if (!rowDate) continue;
      if (rowDate >= target) continue; // targetより前のみ
      const diff = target - rowDate;
      if (diff >= 0 && diff < minDiff) {
        minDiff = diff;
        found = aluCompareData[i];
      }
    }
    return found;
  }

  // 各比較ロジックでデータ取得
  const compareTypes = [
    {type: 'latest', label: '最新单价'},
    {type: 'prevDay', label: '对比前一天'},
    {type: 'weekAgo', label: '对比上星期同期'},
    {type: 'monthStart', label: '对比本月初'},
    {type: 'monthAgo', label: '对比上月同期'},
    {type: 'quarterAgo', label: '对比上一季度同期'},
    {type: 'yearStart', label: '对比年初'}
  ];

  const tableRows = [];
  for (let i = 0; i < compareTypes.length; i++) {
    let row, date, changjiang, nanhai;
    if (compareTypes[i].type === 'latest') {
      row = latestRow;
    } else if (compareTypes[i].type === 'prevDay') {
      // 最新日より前で一番近い日付（直近営業日）
      row = findClosestPastRow(latestDate);
    } else if (compareTypes[i].type === 'quarterAgo') {
      // 最新日から4ヶ月前あたりで一番近い日付
      const targetDate = getTargetDate(latestDate, 'quarterAgo');
      row = findClosestPastRow(targetDate);
    } else {
      const targetDate = getTargetDate(latestDate, compareTypes[i].type);
      row = findRowByDate(targetDate) || findClosestPastRow(targetDate);
    }
    date = row ? row[0] : '';
    changjiang = row ? row[1] : '';
    nanhai = row ? row[9] : '';
    tableRows.push([date, changjiang, '', nanhai, '']);
  }

  // 変動率計算
  function calcRate(newVal, oldVal) {
    if (!newVal || !oldVal || isNaN(newVal) || isNaN(oldVal) || Number(oldVal) === 0) return '';
    const rate = (Number(newVal) - Number(oldVal)) / Number(oldVal) * 100;
    return (rate > 0 ? '' : '') + rate.toFixed(2) + '%';
  }
  // 最新値を基準に変動率を計算
  for (let i = 1; i < tableRows.length; i++) {
    tableRows[i][2] = calcRate(tableRows[0][1], tableRows[i][1]); // 长江铝锭走势
    tableRows[i][4] = calcRate(tableRows[0][3], tableRows[i][3]); // 南海灵通铝锭走势
  }

  // N3:R9に反映（=NA()対応）
  chartSheet.getRange(3, 14, tableRows.length, 5).setValues(
    tableRows.map(row => row.map(safeValue))
  );

  // データをセットした後、M:R列の幅を自動調整
  chartSheet.autoResizeColumns(13, 6); // M(13)〜R(18)まで

  // M1:R9に罫線を引く
  chartSheet.getRange('M1:R9').setBorder(true, true, true, true, true, true);

  // M:R列の幅をすべて182に固定
  for (let col = 13; col <= 18; col++) {
    chartSheet.setColumnWidth(col, 182);
  }

  // --- 镀锌板卷价格の価格比較表（M26:X34） ---
  // 日付（A列5行目以降）
  const steelDates = steelSheet.getRange(5, 1, steelSheet.getLastRow() - 4, 1).getValues();
  // 価格（B～F列5行目以降）
  const steelCompareData = steelSheet.getRange(5, 2, steelSheet.getLastRow() - 4, 5).getValues();

  // 最新データ取得
  const steelLatestDate = parseDateString(steelDates[0][0]);
  const steelLatestPrices = steelCompareData[0];

  // target日付以前で一番近いデータを返す
  function findClosestPastSteelRow(target) {
    let minDiff = Infinity, found = null, foundDate = '';
    for (let i = 0; i < steelDates.length; i++) {
      const rowDate = parseDateString(steelDates[i][0]);
      if (!rowDate) continue;
      if (rowDate >= target) continue;
      const diff = target - rowDate;
      if (diff >= 0 && diff < minDiff) {
        minDiff = diff;
        found = steelCompareData[i];
        foundDate = steelDates[i][0];
      }
    }
    return found ? {date: foundDate, prices: found} : null;
  }

  // 比較ロジック
  const steelTableRows = [];
  for (let i = 0; i < compareTypes.length; i++) {
    let date, prices;
    if (compareTypes[i].type === 'latest') {
      date = steelDates[0][0];
      prices = steelCompareData[0];
    } else if (compareTypes[i].type === 'prevDay') {
      const found = findClosestPastSteelRow(steelLatestDate);
      date = found ? found.date : '';
      prices = found ? found.prices : ['', '', '', '', ''];
    } else if (compareTypes[i].type === 'quarterAgo') {
      const targetDate = getTargetDate(steelLatestDate, 'quarterAgo');
      const found = findClosestPastSteelRow(targetDate);
      date = found ? found.date : '';
      prices = found ? found.prices : ['', '', '', '', ''];
    } else {
      const targetDate = getTargetDate(steelLatestDate, compareTypes[i].type);
      let foundIndex = steelDates.findIndex(d => {
        const rowDate = parseDateString(d[0]);
        return rowDate && rowDate.getFullYear() === targetDate.getFullYear() && rowDate.getMonth() === targetDate.getMonth() && rowDate.getDate() === targetDate.getDate();
      });
      if (foundIndex !== -1) {
        date = steelDates[foundIndex][0];
        prices = steelCompareData[foundIndex];
      } else {
        const found = findClosestPastSteelRow(targetDate);
        date = found ? found.date : '';
        prices = found ? found.prices : ['', '', '', '', ''];
      }
    }
    // 11列構成: [日付, 価格1, 価格1変動率, ..., 価格5, 価格5変動率]
    const row = [date];
    for (let j = 0; j < 5; j++) {
      row.push(prices[j]);
      if (i === 0) {
        row.push(''); // 最新行は変動率空欄
      } else {
        row.push(calcRate(steelTableRows[0][j * 2 + 1], prices[j]));
      }
    }
    steelTableRows.push(row);
  }

  // 変動率計算
  function calcSteelRate(newVal, oldVal) {
    if (!newVal || !oldVal || isNaN(newVal) || isNaN(oldVal) || Number(oldVal) === 0) return '';
    const rate = (Number(newVal) - Number(oldVal)) / Number(oldVal) * 100;
    return rate.toFixed(2) + '%';
  }

  // ヘッダー
  const steelHeader = [
    '', '日期',
    '有花,DX51D+Z,1*1219*C,120g乐从镇,鞍钢', '有花,DX51D+Z,1*1219*C,120g乐从镇,鞍钢走势(%)',
    '无花,DX51D+Z,1*1250*C,120g,乐从镇,鞍钢', '无花,DX51D+Z,1*1250*C,120g,乐从镇,鞍钢走势(%)',
    '无花,DX51D+Z,1*1250*C,120g,济南,宝钢', '无花,DX51D+Z,1*1250*C,120g,济南,宝钢走势(%)',
    '无花,DX51D+Z,1*1250*C,120g,广州,鞍钢', '无花,DX51D+Z,1*1250*C,120g,广州,鞍钢走势(%)',
    '无花,DX51D+Z,1*1250*C,120g,天津,河钢唐', '无花,DX51D+Z,1*1250*C,120g,天津,河钢唐走势(%)'
  ];
  chartSheet.getRange(26, 13, 1, 12).setValues([steelHeader]);
  chartSheet.getRange(26, 13, 1, 12).setHorizontalAlignment('center');

  // 縦タイトル
  chartSheet.getRange(27, 13, rowTitles.length, 1).setValues(rowTitles.map(v => [v]));

  // データ貼り付け（=NA()対応）
  chartSheet.getRange(27, 14, steelTableRows.length, 11).setValues(
    steelTableRows.map(row => row.map(safeValue))
  );

  // 罫線
  chartSheet.getRange('M26:X34').setBorder(true, true, true, true, true, true);
  // 列幅
  for (let col = 13; col <= 24; col++) {
    chartSheet.setColumnWidth(col, 182);
  }

  // 指定されたセルの値を消去
  chartSheet.getRange('P3').clearContent();
  chartSheet.getRange('R3').clearContent();
  chartSheet.getRange('P27').clearContent();
  chartSheet.getRange('R27').clearContent();
  chartSheet.getRange('T27').clearContent();
  chartSheet.getRange('V27').clearContent();
  chartSheet.getRange('X27').clearContent();
}

function normalizeSteelSheetDates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const steelSheet = ss.getSheetByName("镀锌板卷价格");
  const lastRow = steelSheet.getLastRow();
  const dateRange = steelSheet.getRange(5, 1, lastRow - 4, 1); // A5:A
  const dates = dateRange.getValues();

  const newDates = dates.map(row => {
    const dateStr = row[0];
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      // 2025-04-25 → 2025/04/25
      return [dateStr.replace(/-/g, '/')];
    }
    return [dateStr];
  });

  dateRange.setValues(newDates);
}

function normalizeAluminumSheetDates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aluminumSheet = ss.getSheetByName("当天铝锭价格");
  const lastRow = aluminumSheet.getLastRow();
  const dateRange = aluminumSheet.getRange(3, 1, lastRow - 2, 1); // A3:A
  const dates = dateRange.getValues();

  const newDates = dates.map(row => {
    const dateStr = row[0];
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      // 2025/4/16 → 2025-04-16
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const yyyy = parts[0];
        const mm = parts[1].padStart(2, '0');
        const dd = parts[2].padStart(2, '0');
        return [`${yyyy}-${mm}-${dd}`];
      }
    }
    return [dateStr];
  });

  dateRange.setValues(newDates);
}

function strictNormalizeAluminumSheetDates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("当天铝锭价格");
  const lastRow = sheet.getLastRow();
  const dateRange = sheet.getRange(3, 1, lastRow - 2, 1); // A3:A
  const dateValues = dateRange.getValues();

  for (let i = 0; i < dateValues.length; i++) {
    let val = dateValues[i][0];
    if (typeof val === 'string') {
      // 不可視文字・全角スペース・改行などを除去
      val = val.replace(/[\s\u3000]/g, '');
    }
    // 日付として認識できるか
    let d = new Date(val);
    if (d instanceof Date && !isNaN(d)) {
      // yyyy/mm/dd形式で統一
      let yyyy = d.getFullYear();
      let mm = String(d.getMonth() + 1).padStart(2, '0');
      let dd = String(d.getDate()).padStart(2, '0');
      dateValues[i][0] = `${yyyy}/${mm}/${dd}`;
    } else {
      // 変換できなければ空欄にする（または警告ログ）
      dateValues[i][0] = '';
      Logger.log(`A列${i+3}行目は日付として認識できません: ${val}`);
    }
  }
  dateRange.setValues(dateValues);
}

// メイン実行関数を修正
function executeAllProcesses() {
  let errorMessages = [];
  let successMessages = [];
  
  try {
    // 1. processGmailAttachment の実行
    console.log("1. Mysteel データの処理を開始");
    try {
      processGmailAttachment();
      successMessages.push("Mysteelデータの処理が完了しました。");
    } catch (e) {
      errorMessages.push("Mysteelデータの処理でエラーが発生: " + e.toString());
      console.error("Mysteelデータ処理エラー:", e);
    }

    // 2. updateAluminumPriceSheet の実行
    console.log("2. アルミ価格データの更新を開始");
    try {
      updateAluminumPriceSheet();
      successMessages.push("アルミ価格データの更新が完了しました。");
    } catch (e) {
      errorMessages.push("アルミ価格データの更新でエラーが発生: " + e.toString());
      console.error("アルミ価格更新エラー:", e);
    }

    // 3. グラフの更新
    console.log("3. グラフの更新を開始");
    try {
      updatePriceChart();
      successMessages.push("グラフの更新が完了しました。");
    } catch (e) {
      errorMessages.push("グラフの更新でエラーが発生: " + e.toString());
      console.error("グラフ更新エラー:", e);
    }

    // 処理結果の通知
    try {
      if (errorMessages.length > 0) {
        GmailApp.sendEmail(
          Session.getEffectiveUser().getEmail(),
          "データ更新処理結果（エラーあり）",
          "処理中に以下のエラーが発生しました：\n\n" + errorMessages.join("\n") +
          "\n\n成功した処理：\n" + successMessages.join("\n")
        );
      } else {
        GmailApp.sendEmail(
          Session.getEffectiveUser().getEmail(),
          "データ更新処理完了",
          "すべての処理が正常に完了しました：\n\n" + successMessages.join("\n")
        );
      }
    } catch (e) {
      // メール送信エラーが発生しても処理を止めない
      console.error("メール送信エラー:", e);
    }
  } catch (e) {
    console.error("メイン処理でエラーが発生:", e);
    try {
      GmailApp.sendEmail(
        Session.getEffectiveUser().getEmail(),
        "重大なエラーが発生",
        "メイン処理で予期せぬエラーが発生しました：\n" + e.toString()
      );
    } catch (mailError) {
      // メール送信エラーが発生しても処理を止めない
      console.error("重大なエラー通知メール送信エラー:", mailError);
    }
  }
}

// グラフのみを更新するテスト用関数
function testUpdatePriceChart() {
  try {
    updatePriceChart();
    Logger.log("グラフのみの更新が完了しました。");
  } catch (e) {
    Logger.log("グラフのみの更新でエラー: " + e.toString());
  }
}
