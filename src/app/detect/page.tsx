"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function DetectPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Loading model...");
  const detectorRef = useRef<FaceDetector | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem("email");
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    if (stored) setEmail(stored);

    async function init() {
      if (!("FaceDetector" in window)) {
        setStatus("FaceDetector API not supported. Use Chrome with #enable-experimental-web-platform-features flag.");
        return;
      }
      detectorRef.current = new FaceDetector({ fastMode: true, maxDetectedFaces: 10 });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play();
          setStatus("Detecting...");
          detect();
        };
      }
    }

    async function detect() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !detectorRef.current) return;
      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      try {
        const faces = await detectorRef.current.detect(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0);
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        for (const face of faces) {
          const { x, y, width, height } = face.boundingBox;
          ctx.strokeRect(x, y, width, height);
        }
        setStatus(`${faces.length} face${faces.length !== 1 ? "s" : ""} detected`);
      } catch {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0);
      }
      animRef.current = requestAnimationFrame(detect);
    }

    init();
    return () => cancelAnimationFrame(animRef.current);
  }, [router]);

  function logout() {
    localStorage.clear();
    router.push("/login");
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14 }}>{email}</span>
        <button onClick={logout}>Logout</button>
      </div>
      <p style={{ fontSize: 13, marginBottom: 8 }}>{status}</p>
      <div style={{ position: "relative", display: "inline-block" }}>
        <video ref={videoRef} style={{ display: "none" }} />
        <canvas ref={canvasRef} style={{ border: "1px solid #ccc", maxWidth: "100%" }} />
      </div>
    </main>
  );
}
