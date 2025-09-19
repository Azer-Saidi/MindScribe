const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  isDesktop: true,
  platform: process.platform,
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
});

contextBridge.exposeInMainWorld("gemini", {
  request: async ({ prompt, maxTokens = 300 }) => {
    try {
      const result = await ipcRenderer.invoke("gemini-request", {
        prompt,
        maxTokens,
      });
      return result;
    } catch (error) {
      return `Summary failed: ${error.message}`;
    }
  },
});

contextBridge.exposeInMainWorld("electronAPI", {
  saveAudioFile: (data) => ipcRenderer.invoke("save-audio-file", data),
});
