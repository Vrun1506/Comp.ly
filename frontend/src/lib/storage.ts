// Firebase Storage helpers for workspace document uploads

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

export interface UploadProgress {
  /** 0–100 */
  progress: number;
  downloadURL?: string;
}

/**
 * Upload a file to /workspaces/{workspaceId}/documents/{timestamp}_{filename}
 * Returns a Promise that resolves to the download URL.
 * Calls `onProgress` during the upload.
 */
export function uploadWorkspaceDocument(
  workspaceId: string,
  file: File,
  onProgress: (p: UploadProgress) => void
): Promise<{ downloadURL: string; storagePath: string }> {
  return new Promise((resolve, reject) => {
    const storagePath = `workspaces/${workspaceId}/documents/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress({ progress });
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        onProgress({ progress: 100, downloadURL });
        resolve({ downloadURL, storagePath });
      }
    );
  });
}

/** Delete a file from Firebase Storage by its storage path. */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  await deleteObject(ref(storage, storagePath));
}
