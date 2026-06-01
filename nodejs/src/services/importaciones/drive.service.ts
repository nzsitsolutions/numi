import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

let _drive: any = null;
const getDrive = () => {
    if (_drive) return _drive;
    const email = process.env.GOOGLE_CLIENT_EMAIL;
    const key = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
    if (!email || !key) throw new Error("Faltan GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY");

    const auth = new google.auth.JWT({ email, key, scopes: SCOPES });
    _drive = google.drive({ version: "v3", auth });
    return _drive;
};

export default {
    // Lista archivos dentro de una carpeta (no recursivo).
    // Con mimeType filtra por tipo (ej. 'application/pdf'); sin él, trae todo lo que no sea carpeta.
    listarArchivosAsync: async (folderId: string, mimeType?: string): Promise<{ id: string; name: string }[]> => {
        const drive = getDrive();
        const filtroTipo = mimeType
            ? `mimeType = '${mimeType}'`
            : `mimeType != 'application/vnd.google-apps.folder'`;
        const res = await drive.files.list({
            q: `'${folderId}' in parents and ${filtroTipo} and trashed = false`,
            fields: "files(id, name)",
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });
        return res.data.files ?? [];
    },

    // Descarga el contenido binario de un archivo
    descargarAsync: async (fileId: string): Promise<Buffer> => {
        const drive = getDrive();
        const res = await drive.files.get(
            { fileId, alt: "media", supportsAllDrives: true },
            { responseType: "arraybuffer" },
        );
        return Buffer.from(res.data as ArrayBuffer);
    },

    // Busca una subcarpeta por nombre dentro de la carpeta principal.
    // No la crea (una service account sin Shared Drive no tiene cuota para crear) —
    // si no existe, lanza un error claro para que la crees vos.
    getSubfolderIdAsync: async (parentId: string, nombre: string): Promise<string> => {
        const drive = getDrive();
        const res = await drive.files.list({
            q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${nombre}' and trashed = false`,
            fields: "files(id, name)",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });
        const carpeta = res.data.files?.[0];
        if (!carpeta) {
            throw new Error(`No existe la subcarpeta '${nombre}' en la carpeta de Drive — creala y compartila con la service account`);
        }
        return carpeta.id;
    },

    // Mueve un archivo de una carpeta a otra (cambia su parent)
    moverAsync: async (fileId: string, fromFolderId: string, toFolderId: string): Promise<void> => {
        const drive = getDrive();
        await drive.files.update({
            fileId,
            addParents: toFolderId,
            removeParents: fromFolderId,
            fields: "id, parents",
            supportsAllDrives: true,
        });
    },
};
