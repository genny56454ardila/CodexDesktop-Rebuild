const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const path = require("path");
const fs = require("fs");

module.exports = {
  packagerConfig: {
    name: "Codex",
    executableName: "Codex",
    // Changed bundle ID to my own so it doesn't conflict with any official OpenAI builds
    appBundleId: "com.personal.codex",
    icon: "./resources/electron",
    // Build mode is set by prepare-src.js via src/.build-mode marker file.
    // "upstream-asar": mac/win — we provide pre-built app.asar, forge skips ASAR packing.
    // "linux": forge packs ASAR from src/ content (needs electron-rebuild).
    asar: (() => {
      try {
        return fs.readFileSync(path.join(__dirname, "src", ".build-mode"), "utf-8").trim() === "upstream-asar"
          ? false
          : { unpack: "{**/*.node,**/node-pty/build/Release/spawn-helper,**/node-pty/prebuilds/*/spawn-helper}" };
      } catch { return false; }
    })(),
    ignore: (() => {
      let mode = "upstream-asar";
      try { mode = fs.readFileSync(path.join(__dirname, "src", ".build-mode"), "utf-8").trim(); } catch {}
      return mode === "upstream-asar"
        ? (filePath) => {
            // Allow only package.json + stub main entry (forge validates it)
            if (filePath === "") return false;
            if (filePath === "/package.json") return false;
            if (filePath === "/src" || filePath.startsWith("/src/.vite")) return false;
            return true;
          }
        : (filePath) => {
            if (filePath === "") return false;
            if (filePath === "/package.json") return false;
            const allowed = ["/src/.vite/build", "/src/webview", "/src/skills", "/src/native-menu-locales", "/src/node_modules"];
            for (const p of allowed) {
              if (p.startsWith(filePath) || filePath.startsWith(p)) return false;
            }
            return true;
          };
    })(),
    osxSign: process.env.SKIP_SIGN ? undefined : {
      identity: process.env.APPLE_IDENTITY,
      identityValidation: false,
    },
    osxNotarize: process.env.SKIP_NOTARIZE ? undefined : {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
    win32metadata: {
      CompanyName: "OpenAI",
      ProductName: "Codex",
    },
  },
  rebuildConfig: {},
  makers: [
    { name: "@electron-forge/maker-dmg", config: { format: "ULFO", icon: "./resources/electron.icns" } },
    { name: "@electron-forge/maker-zip", platforms: ["darwin"] },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "Codex",
        authors: "OpenAI, Cometix Space",
        description: "Codex Desktop App",
        setupIcon: "./resources/electron.ico",
        // pointing to my fork's resources instead of upstream
        iconUrl: "https://raw.githubusercontent.com/Haleclipse/CodexDesktop-Rebuild/master/resources/electron.ico",
      },
    },
    { name: "@electron-forge/maker-zip", platforms: ["win32"] },
    {
      name: "@electron-forge/maker-deb",
      config: { options: { name: "codex", productName: "Codex", genericName: "AI Cod
