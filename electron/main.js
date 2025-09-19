import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";
import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from "fs";
import { Buffer } from "buffer";

// Load environment variables
dotenv.config();
// eslint-disable-next-line no-undef
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  mainWindow.webContents.session.setPermissionRequestHandler(
    (_, permission, callback) => {
      callback(["media"].includes(permission));
    }
  );

  mainWindow.loadURL(
    isDev
      ? "http://localhost:5173"
      : `file://${path.join(__dirname, "../dist/index.html")}` 
  );
}

// Gemini API handler
ipcMain.handle("gemini-request", async (_, { prompt, maxTokens = 300 }) => {
  try {
    const response = await fetch(
      // eslint-disable-next-line no-undef
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Gemini API error");
    }

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini."
    );
  } catch (err) {
    console.error("Gemini error:", err);
    throw new Error(`AI service error: ${err.message}`);
  }
});

// Save audio file handler
ipcMain.handle("save-audio-file", async (_, { fileName, base64 }) => {
  try {
    const audioDir = path.join(__dirname, "audio_notes");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir);
    }

    const filePath = path.join(audioDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
    return filePath;
  } catch (error) {
    console.error("Failed to save audio file:", error);
    throw error;
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  // eslint-disable-next-line no-undef
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// eslint-disable-next-line no-undef
process.on("uncaughtException", (err) => {
  console.error("Critical error:", err);
  app.quit();
});
