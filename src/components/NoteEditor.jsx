import { useState, useEffect } from "react";
import { Sparkles, X, Tag, Loader2, Save } from "lucide-react";

function NoteEditor({ onSave, note }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setTags(note.tags || []);
    }
  }, [note]);

  const handleAddTag = (e) => {
    if (["Enter", ","].includes(e.key) && inputTag.trim()) {
      e.preventDefault();
      if (!tags.includes(inputTag.trim())) {
        setTags([...tags, inputTag.trim()]);
      }
      setInputTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = () => {
    try {
      if (!content.trim()) throw new Error("Note content cannot be empty");

      onSave({
        title: title.trim() || "Untitled Note",
        content: content.trim(),
        tags,
      });

      setTitle("");
      setContent("");
      setTags([]);
      setSummary("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSummarize = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await window.gemini.request({
        prompt: `Summarize this note: """${content}"""`,
        maxTokens: 300,
      });

      if (result.startsWith("Summary failed:")) {
        setError(result);
      } else {
        setSummary(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Note Editor
        </h2>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
        >
          <Save className="w-5 h-5" />
          Save
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a title..."
            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError("");
            }}
            placeholder="Start writing your thoughts..."
            className="w-full h-64 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm"
              >
                <Tag className="w-4 h-4" />
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-blue-700 dark:hover:text-blue-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
            <input
              value={inputTag}
              onChange={(e) => setInputTag(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag..."
              className="flex-1 bg-transparent px-2 min-w-[100px] focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSummarize}
          disabled={loading || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {loading ? "Generating Summary..." : "AI Summarize"}
        </button>

        {summary && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">AI Summary</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteEditor;
