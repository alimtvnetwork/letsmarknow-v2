import React, { useEffect } from "react";
import { useRecorderStore } from "@/lib/recorder/recorder-store";
import { startErrorCapture } from "@/lib/recorder/error-history";
import { startGlobalInterception, stopGlobalInterception } from "@/lib/recorder/event-interceptor";
import { RecorderFloatingHud } from "./RecorderFloatingHud";
import { RecorderExportModal } from "./RecorderExportModal";
import { PreviousBugsModal } from "./PreviousBugsModal";
import { RecorderClickAnimation } from "./RecorderClickAnimation";

export function ActivityRecorderRoot(): React.JSX.Element {
  const isRecording = useRecorderStore((s) => s.isRecording);
  const isPaused = useRecorderStore((s) => s.isPaused);
  const isPreviousBugsOpen = useRecorderStore((s) => s.isPreviousBugsOpen);
  const tickElapsed = useRecorderStore((s) => s.tickElapsed);

  useEffect(() => {
    const stopCapture = startErrorCapture();

    return () => {
      stopCapture();
    };
  }, []);

  useEffect(() => {
    if (!isRecording) {
      stopGlobalInterception();

      return;
    }

    startGlobalInterception();

    return () => {
      stopGlobalInterception();
    };
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording || isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      tickElapsed();
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPaused, isRecording, tickElapsed]);

  return (
    <>
      <RecorderFloatingHud />
      <div data-recorder-modal="true">
        <RecorderExportModal />
        {isPreviousBugsOpen && <PreviousBugsModal />}
      </div>
      <RecorderClickAnimation />
    </>
  );
}
