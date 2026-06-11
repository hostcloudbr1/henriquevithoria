const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "dist");
const files = ["index.html", "styles.css", "script.js", "supabase-config.js"];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}

fs.cpSync(path.join(root, "assets"), path.join(output, "assets"), {
  recursive: true
});

console.log("Site preparado em dist/");
