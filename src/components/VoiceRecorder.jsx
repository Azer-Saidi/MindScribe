import { useState, useRef } from "react";
import axios from "axios";
import {
  Mic,
  StopCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const baseUrl = "https://api.assemblyai.com/v2";
const headers = {
  authorization: "168238065bd34287a1a37a933c908a31",
};

function VoiceRecorder({ onSave }) {
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fileSaved, setFileSaved] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setError(null);
      setFileSaved(false);
      setRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setSaving(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const file = new File([blob], "audio.webm", { type: "audio/webm" });

          // Upload to AssemblyAI
          const uploadResponse = await uploadAudio(file);
          const audioUrl = uploadResponse.data.upload_url;

          // Request transcription
          const transcriptId = await requestTranscription(audioUrl);

          // Poll for transcription results
          await pollTranscriptionResult(transcriptId);

          setFileSaved(true);
        } catch (err) {
          console.error(err);
          setError("Failed to transcribe audio.");
        } finally {
          setSaving(false);
          setRecording(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or unavailable.");
      setRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const uploadAudio = async (file) => {
    const audioData = await file.arrayBuffer();

    const uploadResponse = await axios.post(`${baseUrl}/upload`, audioData, {
      headers,
    });
    return uploadResponse;
  };

  const requestTranscription = async (audioUrl) => {
    const data = {
      audio_url: audioUrl,
      speech_model: "universal",
    };

    const response = await axios.post(`${baseUrl}/transcript`, data, {
      headers,
    });
    return response.data.id;
  };

  const pollTranscriptionResult = async (transcriptId) => {
    const pollingEndpoint = `${baseUrl}/transcript/${transcriptId}`;

    while (true) {
      const pollingResponse = await axios.get(pollingEndpoint, { headers });
      const transcriptionResult = pollingResponse.data;

      if (transcriptionResult.status === "completed") {
        console.log("Transcription Result:", transcriptionResult.text);
        onSave?.({
          title: `Voice Note - ${new Date().toLocaleString()}`,
          content: transcriptionResult.text,
          tags: ["voice"],
          audioPath: "path/to/audio",
        });
        break;
      } else if (transcriptionResult.status === "error") {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Poll every 3 seconds
      }
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium shadow transition ${
          saving
            ? "bg-gray-400 cursor-not-allowed"
            : recording
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }`}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Saving...
          </>
        ) : recording ? (
          <>
            <StopCircle className="w-6 h-6" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="w-6 h-6" />
            Start Recording
          </>
        )}
      </button>

      {fileSaved && (
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-green-300 dark:border-green-600">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Audio saved</span>
          </div>
          <p className="text-gray-700 dark:text-gray-200">
            Your voice note was saved and transcribed successfully.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-100 dark:bg-red-900/20 p-3 rounded-lg border border-red-300 dark:border-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;
