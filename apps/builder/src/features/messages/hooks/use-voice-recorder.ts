"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type VoiceRecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "stopped"
  | "error"

export type VoiceRecorderError =
  | "permission-denied"
  | "not-supported"
  | "no-audio"
  | "format-unsupported"
  | "unknown"

const MAX_RECORDING_SECONDS = 300

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>("idle")
  const [error, setError] = useState<VoiceRecorderError | null>(null)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  useEffect(() => cleanup, [cleanup])

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("not-supported")
      setState("error")
      return
    }

    setState("requesting")
    setError(null)
    setAudioBlob(null)
    setDuration(0)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      let mimeType = ""
      if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus"
      } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus"
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4"
      }

      if (!mimeType) {
        for (const track of stream.getTracks()) {
          track.stop()
        }
        streamRef.current = null
        setError("format-unsupported")
        setState("error")
        return
      }

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const rawType = recorder.mimeType || "audio/ogg"
        const normalizedType = rawType.split(";")[0]
        const blob = new Blob(chunksRef.current, { type: normalizedType })
        setAudioBlob(blob)
        setState("stopped")
        cleanup()
      }

      recorder.onerror = () => {
        setError("unknown")
        setState("error")
        cleanup()
      }

      recorder.start()
      startTimeRef.current = Date.now()
      setState("recording")

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setDuration(elapsed)
        if (elapsed >= MAX_RECORDING_SECONDS) {
          recorder.stop()
        }
      }, 200)
    } catch (err) {
      if (err instanceof DOMException) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setError("permission-denied")
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          setError("no-audio")
        } else {
          setError("unknown")
        }
      } else {
        setError("unknown")
      }
      setState("error")
      cleanup()
    }
  }, [cleanup])

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const cancelRecording = useCallback(() => {
    cleanup()
    setState("idle")
    setDuration(0)
    setAudioBlob(null)
    setError(null)
  }, [cleanup])

  const reset = useCallback(() => {
    cleanup()
    setState("idle")
    setDuration(0)
    setAudioBlob(null)
    setError(null)
  }, [cleanup])

  return {
    state,
    error,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  }
}
