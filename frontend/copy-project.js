
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Chemin du fichier de sortie
const outputFile = path.join(__dirname, "monprojet.txt");

try {
  // Écrire l'en-tête
  fs.writeFileSync(outputFile, "Contenu des dossiers client, server et shared:\n\n", "utf8");
  console.log("Fichier créé:", outputFile);

  // Fonction pour lire récursivement un dossier
  function readDirRecursive(dir, baseDir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (fs.statSync(fullPath).isDirectory()) {
        fs.appendFileSync(outputFile, `\n=== DOSSIER: ${relativePath} ===\n\n`);
        readDirRecursive(fullPath, baseDir);
      } else {
        try {
          const content = fs.readFileSync(fullPath, "utf8");
          fs.appendFileSync(outputFile, `=== FICHIER: ${relativePath} ===\n${content}\n\n`);
          console.log("Fichier ajouté:", relativePath);
        } catch (readErr) {
          console.error("Erreur lors de la lecture de", relativePath, ":", readErr);
        }
      }
    });
  }

  // Lire les dossiers client, server et shared
  ['frontend'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      readDirRecursive(dirPath, __dirname);
    }
  });

  console.log("Terminé! Fichier créé avec succès:", outputFile);
} catch (err) {
  console.error("Erreur:", err);
}
