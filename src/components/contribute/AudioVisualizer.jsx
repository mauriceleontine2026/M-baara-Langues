import { useEffect, useRef } from "react";

export default function AudioVisualizer({ stream }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    let audioCtx;
    try {
      const AudioCtor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      audioCtx = new AudioCtor();
    } catch { return; }

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const barCount = 28;
    const barWidth = canvas.width / barCount;
    const step = Math.max(1, Math.floor(bufferLength / barCount));

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] || 0;
        const barHeight = Math.max(3, (value / 255) * canvas.height);
        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#f59e0b");
        gradient.addColorStop(0.5, "#f97316");
        gradient.addColorStop(1, "#ef4444");
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      }
    };
    draw();

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
      source.disconnect();
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close();
      }
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={280} height={50} className="mx-auto rounded-lg" />;
}