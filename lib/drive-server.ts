import { google } from 'googleapis';

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
};

export type DriveFolderNode = {
  id: string;
  name: string;
  fileCount: number;
  files: DriveFile[];
  folders: DriveFolderNode[];
};

function getOAuth2Client() {
  const clientId = process.env.OAUTH_CLIENT_ID as string;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET as string;
  const redirectUri = (process.env.OAUTH_REDIRECT_URI as string) || 'http://localhost';
  const tokenJson = process.env.GOOGLE_DRIVE_TOKEN as string;
  if (!clientId || !clientSecret || !tokenJson) throw new Error('Missing Google OAuth env');
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials(JSON.parse(tokenJson));
  return oauth2Client;
}

async function listChildren(drive: any, folderId: string, query: string, fields: string) {
  let pageToken: string | undefined = undefined;
  const out: any[] = [];
  do {
    const resp = await drive.files.list({
      q: `'${folderId}' in parents and ${query} and trashed=false`,
      fields: `nextPageToken, files(${fields})`,
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageToken,
    });
    out.push(...(resp.data.files || []));
    pageToken = (resp.data.nextPageToken as string) || undefined;
  } while (pageToken);
  return out;
}

async function countImmediateFiles(drive: any, folderId: string): Promise<number> {
  const files = await listChildren(
    drive,
    folderId,
    `mimeType!='application/vnd.google-apps.folder'`,
    'id'
  );
  return files.length;
}

export async function buildFolderTree(rootFolderId: string, maxDepth = 2): Promise<{ root: DriveFolderNode; rootFiles: DriveFile[] }>{
  const auth = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth });

  async function buildNode(folderId: string, name: string, depth: number): Promise<DriveFolderNode> {
    const files: DriveFile[] = await listChildren(
      drive,
      folderId,
      `mimeType!='application/vnd.google-apps.folder'`,
      'id,name,mimeType,size,modifiedTime'
    );
    const fileCount = files.length;
    let folders: DriveFolderNode[] = [];
    if (depth < maxDepth) {
      const childFolders = await listChildren(
        drive,
        folderId,
        `mimeType='application/vnd.google-apps.folder'`,
        'id,name,mimeType'
      );
      folders = await Promise.all(
        childFolders.map((cf: any) => buildNode(cf.id, cf.name, depth + 1))
      );
    }
    return { id: folderId, name, fileCount, files, folders };
  }

  const rootNode = await buildNode(rootFolderId, 'Root', 0);
  return { root: rootNode, rootFiles: rootNode.files };
}



