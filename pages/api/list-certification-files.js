export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { folderId } = req.query;

  if (!folderId) {
    return res.status(400).json({ message: 'Folder ID is required' });
  }

  try {
    // 実際のフォルダ構造に基づいてファイル一覧を返す
    const files = getFilesFromFolder(folderId);

    res.json({
      success: true,
      folderId,
      totalFiles: Object.values(files).flat().length,
      files: files
    });

  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch files',
      error: error.message 
    });
  }
}

// フォルダIDに基づいてファイル一覧を返す
function getFilesFromFolder(folderId) {
  // 実際のフォルダID: 1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It
  if (folderId === '1QmLSSML9eXFGKktQE-bSq_PXRc7LF6It') {
    return {
      'Acoustic Material': [
        // このフォルダ内のファイルを追加
      ],
      'Aluminium Panel without coating': [
        // このフォルダ内のファイルを追加
      ],
      'Ceiling System': [
        // このフォルダ内のファイルを追加
      ],
      'Cement Board': [
        // このフォルダ内のファイルを追加
      ],
      'Company Cert': [
        { 
          id: 'certificate_list', 
          name: 'Certificate List_Jan2025.xlsx',
          size: 81 * 1024, // 81 KB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('Certificate List_Jan2025.xlsx')}`
        },
        { 
          id: 'org_regno', 
          name: 'org_regno_en_ch.pdf',
          size: 1.1 * 1024 * 1024, // 1.1 MB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('org_regno_en_ch.pdf')}`
        },
        { 
          id: 'trademark_reg', 
          name: '附件1：佛山市三水桐井建筑材料有限公司66659592商标注册证.pdf',
          size: 1.0 * 1024 * 1024, // 1.0 MB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('附件1：佛山市三水桐井建筑材料有限公司66659592商标注册证.pdf')}`
        },
        { 
          id: 'trademark_details', 
          name: '附件2：佛山市三水桐井建筑材料有限公司 商标业务明细表-20231019.xlsx',
          size: 282 * 1024, // 282 KB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('附件2：佛山市三水桐井建筑材料有限公司 商标业务明细表-20231019.xlsx')}`
        }
      ],
      'Galvanized Steel Panel': [
        // このフォルダ内のファイルを追加
      ],
      'Gypsum Board, M2Tech & Cement Board': [
        { 
          id: 'bs_en_520', 
          name: 'BS_EN_520-2004石膏板_定义、要求和试验方法.pdf',
          size: 656 * 1024, // 656 KB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('BS_EN_520-2004石膏板_定义、要求和试验方法.pdf')}`
        }
      ],
      'KIRII Gypsum Board': [
        // このフォルダ内のファイルを追加
      ],
      'Kirii HK': [
        // このフォルダ内のファイルを追加
      ],
      'M6 Stud Bolt (M6 螺絲)': [
        // このフォルダ内のファイルを追加
      ],
      'Metal': [
        // このフォルダ内のファイルを追加
      ],
      'Mill Cert': [
        // このフォルダ内のファイルを追加
      ],
      'MK': [
        // このフォルダ内のファイルを追加
      ],
      'New Element 新元素': [
        // このフォルダ内のファイルを追加
      ],
      'Powder Coating': [
        { 
          id: 'powder_coating_spec', 
          name: 'Powder Coating Aluminium Panel Specification 20190709_WM.pdf',
          size: 996 * 1024, // 996 KB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('Powder Coating Aluminium Panel Specification 20190709_WM.pdf')}`
        }
      ],
      'PVDF coating': [
        { 
          id: 'pvdf_coating_spec', 
          name: 'PVDF Aluminium Panel Specification 20190605_WM.pdf',
          size: 956 * 1024, // 956 KB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('PVDF Aluminium Panel Specification 20190605_WM.pdf')}`
        }
      ],
      'RED': [
        // このフォルダ内のファイルを追加
      ],
      'Soundex': [
        // このフォルダ内のファイルを追加
      ],
      'Stainless Steel': [
        // このフォルダ内のファイルを追加
      ],
      'Standards - pdf for reference': [
        { 
          id: 'bd_part_e1', 
          name: 'BD partE1.pdf',
          size: 289 * 1024, // 289 KB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('BD partE1.pdf')}`
        },
        { 
          id: 'bd_part_e1_p10', 
          name: 'BD partE1(P.10).pdf',
          size: 91 * 1024, // 91 KB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('BD partE1(P.10).pdf')}`
        },
        { 
          id: 'en_13501', 
          name: 'EN 13501 捷克.pdf',
          size: 732 * 1024, // 732 KB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('EN 13501 捷克.pdf')}`
        },
        { 
          id: 'mra_hoklas', 
          name: 'MRA_HOKLAS_en.pdf',
          size: 790 * 1024, // 790 KB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('MRA_HOKLAS_en.pdf')}`
        }
      ],
      'Sum-Powder Coating': [
        // このフォルダ内のファイルを追加
      ],
      'Sum-PVDF Coating': [
        // このフォルダ内のファイルを追加
      ],
      'Tai Shan 泰山': [
        // このフォルダ内のファイルを追加
      ],
      'Tee Grid': [
        // このフォルダ内のファイルを追加
      ],
      'Test Standard Info': [
        // このフォルダ内のファイルを追加
      ],
      'Water Based Coating': [
        // このフォルダ内のファイルを追加
      ],
      'Wooden Sticker': [
        // このフォルダ内のファイルを追加
      ],
      '水性噴塗': [
        // このフォルダ内のファイルを追加
      ],
      '泰石Mineral Wool': [
        // このフォルダ内のファイルを追加
      ],
      '阿克蘇': [
        // このフォルダ内のファイルを追加
      ],
      'Root Files': [
        { 
          id: 'ppg_color_chart', 
          name: 'PPG Color Chart.pdf',
          size: 723 * 1024, // 723 KB
          downloadUrl: `https://drive.google.com/uc?export=download&id=${getFileIdFromName('PPG Color Chart.pdf')}`
        }
      ]
    };
  }

  return {
    'Other': []
  };
}

// ファイル名からファイルIDを取得（実際のファイルIDに置き換える必要があります）
function getFileIdFromName(fileName) {
  const fileIdMap = {
    'Powder Coating Aluminium Panel Specification 20190709_WM.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'PVDF Aluminium Panel Specification 20190605_WM.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'Certificate List_Jan2025.xlsx': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'PPG Color Chart.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'org_regno_en_ch.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'BS_EN_520-2004石膏板_定义、要求和试验方法.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'BD partE1.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'BD partE1(P.10).pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'EN 13501 捷克.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'MRA_HOKLAS_en.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    '附件1：佛山市三水桐井建筑材料有限公司66659592商标注册证.pdf': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    '附件2：佛山市三水桐井建筑材料有限公司 商标业务明细表-20231019.xlsx': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  };

  return fileIdMap[fileName] || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
} 