import { Expense, BudgetConfig, DriveFileInfo } from '../types';

export interface DriveAppData {
  appName: string;
  version: number;
  lastUpdated: string;
  budget: BudgetConfig;
  expenses: Expense[];
}

const DRIVE_FILE_NAME = 'Spese_Personali_App.json';

/**
 * Searches for an existing file named Spese_Personali_App.json in Google Drive
 */
export async function findDriveFile(accessToken: string): Promise<DriveFileInfo | null> {
  try {
    const q = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
    const fields = encodeURIComponent('files(id, name, modifiedTime, webViewLink)');
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Sessione scaduta o token non valido');
      }
      const errorText = await res.text();
      console.error('Drive search error:', errorText);
      return null;
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      const file = data.files[0];
      return {
        fileId: file.id,
        fileName: file.name,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        lastSyncTime: file.modifiedTime || null,
      };
    }

    return null;
  } catch (error) {
    console.error('Error finding Drive file:', error);
    throw error;
  }
}

/**
 * Reads data from an existing Drive file
 */
export async function readDriveFile(
  accessToken: string,
  fileId: string
): Promise<DriveAppData | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Impossibile leggere il file da Drive: ${res.statusText}`);
    }

    const data = await res.json();
    return data as DriveAppData;
  } catch (error) {
    console.error('Error reading Drive file content:', error);
    throw error;
  }
}

/**
 * Creates a new JSON file on Google Drive via multipart upload
 */
export async function createDriveFile(
  accessToken: string,
  payload: DriveAppData
): Promise<DriveFileInfo> {
  const boundary = '-------foo_bar_baz_spesetrack_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: DRIVE_FILE_NAME,
    mimeType: 'application/json',
    description: 'Tracciamento Spese Personali salvato da SpeseTrack PWA',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(payload, null, 2) +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,modifiedTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore creazione file Drive: ${res.status} - ${errText}`);
  }

  const result = await res.json();
  return {
    fileId: result.id,
    fileName: result.name || DRIVE_FILE_NAME,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    lastSyncTime: result.modifiedTime || new Date().toISOString(),
  };
}

/**
 * Updates the existing Drive file with new payload
 */
export async function updateDriveFile(
  accessToken: string,
  fileId: string,
  payload: DriveAppData
): Promise<DriveFileInfo> {
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload, null, 2),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore aggiornamento file Drive: ${res.status} - ${errText}`);
  }

  return {
    fileId: fileId,
    fileName: DRIVE_FILE_NAME,
    webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
    lastSyncTime: new Date().toISOString(),
  };
}

/**
 * Helper to export expenses as formatted CSV file
 */
export function exportExpensesToCSV(expenses: Expense[]): string {
  const headers = ['ID', 'Data', 'Descrizione', 'Importo (€)', 'Categoria', 'Metodo di Pagamento', 'Note'];
  const rows = expenses.map((e) => [
    `"${e.id}"`,
    `"${e.date}"`,
    `"${e.description.replace(/"/g, '""')}"`,
    e.amount.toFixed(2),
    `"${e.category}"`,
    `"${e.paymentMethod}"`,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}
