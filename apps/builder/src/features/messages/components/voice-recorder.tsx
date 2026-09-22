"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import { cn } from "@chatbotx.io/ui/lib/utils"
import { CheckIcon, Loader2Icon, MicIcon, TrashIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { toast } from "sonner"
import {
  useVoiceRecorder,
  type VoiceRecorderError,
} from "../hooks/use-voice-recorder"

type VoiceRecorderProps = {
  onRecordingComplete: (file: File) => void
  onCancel: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function getExtensionFromMime(mimeType: string): string {
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
    return "m4a"
  }
  if (mimeType.includes("webm")) {
    return "webm"
  }
  return "ogg"
}

export function VoiceRecorder({
  onRecordingComplete,
  onCancel,
}: VoiceRecorderProps) {
  const t = useTranslations()
  const {
    state,
    error,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  } = useVoiceRecorder()

  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      startRecording()
    }
  }, [startRecording])

  const handleError = useCallback(
    (err: VoiceRecorderError) => {
      const messages: Record<VoiceRecorderError, string> = {
        "permission-denied": t("messages.voiceRecorder.permissionDenied"),
        "not-supported": t("messages.voiceRecorder.notSupported"),
        "no-audio": t("messages.voiceRecorder.noMicrophone"),
        "format-unsupported": t("messages.voiceRecorder.formatUnsupported"),
        unknown: t("messages.voiceRecorder.recordingFailed"),
      }
      toast.error(messages[err])
      onCancel()
    },
    [t, onCancel],
  )

  useEffect(() => {
    if (state === "error" && error) {
      handleError(error)
    }
  }, [state, error, handleError])

  const handleConfirm = useCallback(() => {
    if (!audioBlob) {
      return
    }
    const ext = getExtensionFromMime(audioBlob.type)
    const file = new File([audioBlob], `voice-recording.${ext}`, {
      type: audioBlob.type,
    })
    onRecordingComplete(file)
    reset()
  }, [audioBlob, onRecordingComplete, reset])

  const handleCancel = useCallback(() => {
    cancelRecording()
    onCancel()
  }, [cancelRecording, onCancel])

  const audioPreviewUrl = useMemo(() => {
    if (!audioBlob) {
      return null
    }
    return URL.createObjectURL(audioBlob)
  }, [audioBlob])

  useEffect(
    () => () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl)
      }
    },
    [audioPreviewUrl],
  )

  if (state === "requesting" || state === "converting") {
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground text-sm">
          {state === "converting"
            ? t("messages.voiceRecorder.converting")
            : t("messages.voiceRecorder.requestingPermission")}
        </span>
        <Button
          className="ms-auto size-7 p-0"
          onClick={handleCancel}
          size="icon"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    )
  }

  if (state === "stopped" && audioBlob) {
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <Button
          className="size-7 p-0 text-destructive hover:text-destructive"
          onClick={handleCancel}
          size="icon"
          type="button"
          variant="ghost"
        >
          <TrashIcon className="size-4" />
        </Button>

        {audioPreviewUrl && (
          // biome-ignore lint/a11y/useMediaCaption: recorded voice preview has no captions
          <audio
            className="h-8 max-w-[200px] flex-1"
            controls
            preload="metadata"
            src={audioPreviewUrl}
          />
        )}

        <span className="text-muted-foreground text-xs tabular-nums">
          {formatDuration(duration)}
        </span>

        <Button
          className="size-7 p-0"
          onClick={handleConfirm}
          size="icon"
          type="button"
          variant="ghost"
        >
          <CheckIcon className="size-4 text-primary" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Button
        className="size-7 p-0 text-destructive hover:text-destructive"
        onClick={handleCancel}
        size="icon"
        type="button"
        variant="ghost"
      >
        <TrashIcon className="size-4" />
      </Button>

      <div className="flex flex-1 items-center gap-2">
        <span
          className={cn(
            "size-2.5 rounded-full bg-red-500",
            state === "recording" && "animate-pulse",
          )}
        />
        <span className="text-muted-foreground text-sm tabular-nums">
          {formatDuration(duration)}
        </span>
      </div>

      <Button
        aria-label={t("messages.voiceRecorder.stopRecording")}
        className="size-8 rounded-full bg-primary p-0 text-primary-foreground hover:bg-primary/90"
        onClick={stopRecording}
        size="icon"
        type="button"
      >
        <MicIcon className="size-4" />
      </Button>
    </div>
  )
}
