import { google } from 'googleapis';

// Read env vars
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'http://localhost';
const TARGET_FOLDER_ID = process.env.TARGET_FOLDER_ID;
const GOOGLE_DRIVE_TOKEN = process.env.GOOGLE_DRIVE_TOKEN; // JSON string

function getOAuth2Client() {
  if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET || !GOOGLE_DRIVE_TOKEN) {
    throw new Error('Missing OAuth environment variables');
  }
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REDIRECT_URI
  );
  try {
    const tokens = JSON.parse(GOOGLE_DRIVE_TOKEN);
    oauth2Client.setCredentials(tokens);
  } catch (e) {
    throw new Error('Invalid GOOGLE_DRIVE_TOKEN JSON');
  }
  return oauth2Client;
}

async function countImmediateFiles(drive, folderId) {
  let pageToken = undefined;
  let count = 0;
  do {
    const resp = await drive.files.list({
      q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'nextPageToken, files(id)',
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageToken,
    });
    count += (resp.data.files || []).length;
    pageToken = resp.data.nextPageToken || undefined;
  } while (pageToken);
  return count;
}

async function listChildFolders(drive, folderId) {
  let pageToken = undefined;
  const result = [];
  do {
    const resp = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'nextPageToken, files(id,name,mimeType)',
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageToken,
    });
    result.push(...(resp.data.files || []));
    pageToken = resp.data.nextPageToken || undefined;
  } while (pageToken);
  return result;
}

// NOTE: recursive counting removed for performance (serverless timeout). Use immediate counts only.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const auth = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth });

    const folderId = req.query.folderId || TARGET_FOLDER_ID;
    if (!folderId) {
      return res.status(400).json({ success: false, message: 'Missing TARGET_FOLDER_ID' });
    }

    // List all items inside the folder (direct children)
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,size,modifiedTime,mimeType)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const items = response.data.files || [];

    const foldersRaw = items.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    const files = items.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
    const rootTotal = files.length + 0; // leave room to include descendants on client

    // Group by category using folder names as categories
    const categories = {};
    const folders = [];
    const counts = await Promise.all(
      foldersRaw.map(f => countImmediateFiles(drive, f.id))
    );
    foldersRaw.forEach((f, idx) => {
      const fileCount = counts[idx] || 0;
      categories[f.name] = { id: f.id, files: [], fileCount };
      folders.push({ id: f.id, name: f.name, mimeType: f.mimeType, fileCount });
    });
    for (const file of files) {
      // files at root
      if (!categories['Root Files']) categories['Root Files'] = { id: folderId, files: [] };
      categories['Root Files'].files.push(file);
    }

    return res.status(200).json({ success: true, folderId, categories, folders, files, totalItems: items.length, rootTotalFileCount: rootTotal });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}


