import { useState, useEffect } from "react";
import { BookOpen, Search, Calendar, TagIcon, Eye } from "lucide-react";

function NoteList({ notes, onSelect, searchQuery }) {
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  useEffect(() => {
    const filtered = notes.filter((note) => {
      const search = searchQuery.toLowerCase();
      return (
        note.title?.toLowerCase().includes(search) ||
        note.content?.toLowerCase().includes(search) ||
        note.tags?.join(" ")?.toLowerCase().includes(search)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortConfig.key === "title") {
        return sortConfig.direction === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      return sortConfig.direction === "asc"
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredNotes(sorted);
  }, [notes, searchQuery, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Your Notes</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({filteredNotes.length} of {notes.length})
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleSort("title")}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            A-Z
            {sortConfig.key === "title" && (
              <span className="text-xs">
                {sortConfig.direction === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
          <button
            onClick={() => handleSort("created_at")}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            Date
            {sortConfig.key === "created_at" && (
              <span className="text-xs">
                {sortConfig.direction === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <Search className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="text-xl text-gray-600 dark:text-gray-300">
            No notes found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? "No matches for your search"
              : "Create your first note using the editor above"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <article
              key={note.id}
              className="group relative bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
            >
              <button
                onClick={() => onSelect(note)}
                className="w-full text-left p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg truncate">
                    {note.title || "Untitled Note"}
                  </h3>
                  <Eye className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(note.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {note.tags && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full"
                      >
                        <TagIcon className="w-3 h-3" />
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-gray-600 dark:text-gray-300 line-clamp-3 text-sm">
                  {note.content.replace(/\n/g, " ")}
                </p>
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default NoteList;
