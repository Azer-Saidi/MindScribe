import { useState } from "react";
import NoteEditor from "./components/NoteEditor";
import NoteList from "./components/NoteList";
import VoiceRecorder from "./components/VoiceRecorder";

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const saveNote = (note) => {
    try {
      if (!note.content?.trim()) {
        throw new Error("Note content cannot be empty");
      }

      const newNote = {
        id: Date.now(),
        title: note.title || "Untitled Note",
        content: note.content,
        tags: note.tags || [],
        created_at: new Date().toISOString(),
      };

      setNotes((prev) => [newNote, ...prev]);
      setSelectedNote(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSummarize = async (text) => {
    try {
      if (!text?.trim()) return "Please enter some text to summarize";
      setIsSummarizing(true);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Summarize this text clearly and concisely: ${text}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Gemini API request failed");
      }

      const data = await response.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No summary returned."
      );
    } catch (err) {
      console.error("Gemini API Error:", err);
      return (
        "Summary failed: " +
        (err.message || "Check your API key and connection")
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const search = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(search) ||
      note.content.toLowerCase().includes(search) ||
      note.tags.join(" ").toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto p-4 max-w-7xl">
        {error && (
          <div className="mb-4 p-4 bg-red-100/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            ⚠️ {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <VoiceRecorder
            onSave={saveNote}
            onError={(err) => setError(err.message || "Voice recording failed")}
          />

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="🔍 Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <span className="absolute right-3 top-3 text-sm text-gray-500 dark:text-gray-400">
                {filteredNotes.length} match{filteredNotes.length !== 1 && "es"}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          <NoteEditor
            key={selectedNote?.id || "new-note"}
            note={selectedNote}
            onSave={saveNote}
            onSummarize={handleSummarize}
            isSummarizing={isSummarizing}
          />

          <NoteList
            notes={filteredNotes}
            onSelect={setSelectedNote}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
