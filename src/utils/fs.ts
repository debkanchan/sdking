import * as fs from "fs";
import path from "path";

export type FileWriter = (filePath: string, content: string) => void;

export function writeFile(filePath: string, content: string) {
  // Create directory if it doesn't exist
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Write the file
  fs.writeFileSync(filePath, content);
}

export type DirMaker = (dirPath: string, options: {recursive?: boolean}) => void;

export function mkDir(dirPath: string, options: {recursive?: boolean} = {}) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, options);
  }
}