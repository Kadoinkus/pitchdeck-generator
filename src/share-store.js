import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

function shareDir(outputDir) {
  return path.join(outputDir, 'shares');
}

function sharePath(outputDir, token) {
  return path.join(shareDir(outputDir), `${token}.json`);
}

function createToken() {
  return crypto.randomBytes(9).toString('base64url');
}

export async function saveShare(outputDir, payload) {
  const dir = shareDir(outputDir);
  await fs.mkdir(dir, { recursive: true });

  const token = createToken();
  const filePath = sharePath(outputDir, token);
  const record = {
    token,
    createdAt: new Date().toISOString(),
    ...payload
  };

  await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf8');
  return token;
}

export async function readShare(outputDir, token) {
  try {
    const filePath = sharePath(outputDir, token);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
