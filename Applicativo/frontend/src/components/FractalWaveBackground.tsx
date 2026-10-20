import React, { useEffect, useRef } from "react";

interface FractalWaveBackgroundProps {
  className?: string;
}

interface TrackingParticle {
  x: number;
  yRatio: number;
  radius: number;
  speedX: number;
  waveOffset: number;
  waveAmp: number;
  hue: "green" | "red";
  rotSpeed: number;
  orbitRadius: number;
  angle: number;
  alpha: number;
}

export const FractalWaveBackground: React.FC<FractalWaveBackgroundProps> = ({
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    // Fractal harmonic wave layers specification (emerald green & ruby red)
    const waveLayers = [
      // Green neon dominant waves
      {
        baseYRatio: 0.40,
        amplitude: 38,
        freq: 0.0028,
        speed: 0.012,
        phase: 0.0,
        colorStart: "rgba(0, 255, 136, 0.50)",
        colorMid: "rgba(16, 185, 129, 0.40)",
        colorEnd: "rgba(255, 51, 102, 0.35)",
        lineWidth: 2.2,
        harmonics: [
          { freqMult: 2.1, ampMult: 0.45, speedMult: 1.4 },
          { freqMult: 4.3, ampMult: 0.22, speedMult: -0.9 },
        ],
      },
      {
        baseYRatio: 0.48,
        amplitude: 46,
        freq: 0.0022,
        speed: 0.009,
        phase: 1.8,
        colorStart: "rgba(16, 185, 129, 0.55)",
        colorMid: "rgba(52, 211, 153, 0.40)",
        colorEnd: "rgba(239, 68, 68, 0.45)",
        lineWidth: 2.8,
        harmonics: [
          { freqMult: 1.8, ampMult: 0.50, speedMult: 1.1 },
          { freqMult: 3.6, ampMult: 0.28, speedMult: -1.3 },
          { freqMult: 7.2, ampMult: 0.12, speedMult: 2.0 },
        ],
      },
      // Red vivid dominant waves
      {
        baseYRatio: 0.58,
        amplitude: 44,
        freq: 0.0025,
        speed: -0.011,
        phase: 3.2,
        colorStart: "rgba(255, 51, 102, 0.60)",
        colorMid: "rgba(239, 68, 68, 0.48)",
        colorEnd: "rgba(0, 255, 136, 0.40)",
        lineWidth: 2.5,
        harmonics: [
          { freqMult: 2.3, ampMult: 0.42, speedMult: 1.2 },
          { freqMult: 4.7, ampMult: 0.20, speedMult: -1.5 },
        ],
      },
      {
        baseYRatio: 0.66,
        amplitude: 36,
        freq: 0.0031,
        speed: 0.014,
        phase: 4.7,
        colorStart: "rgba(244, 63, 94, 0.50)",
        colorMid: "rgba(255, 75, 75, 0.35)",
        colorEnd: "rgba(16, 185, 129, 0.45)",
        lineWidth: 2.0,
        harmonics: [
          { freqMult: 1.9, ampMult: 0.48, speedMult: 0.8 },
          { freqMult: 5.1, ampMult: 0.18, speedMult: -1.8 },
        ],
      },
      // Deep glowing central synthesis wave
      {
        baseYRatio: 0.52,
        amplitude: 52,
        freq: 0.0018,
        speed: 0.007,
        phase: 0.9,
        colorStart: "rgba(0, 255, 136, 0.65)",
        colorMid: "rgba(251, 191, 36, 0.35)",
        colorEnd: "rgba(239, 68, 68, 0.65)",
        lineWidth: 3.2,
        harmonics: [
          { freqMult: 2.0, ampMult: 0.55, speedMult: 1.0 },
          { freqMult: 3.8, ampMult: 0.30, speedMult: -0.8 },
          { freqMult: 6.4, ampMult: 0.15, speedMult: 1.6 },
        ],
      },
    ];

    // Tracking nodes with dynamic spinning coordinate HUDs
    const trackingNodes: TrackingParticle[] = Array.from({ length: 14 }, (_, i) => ({
      x: (i / 14) * width + (Math.sin(i * 3) * 50),
      yRatio: 0.30 + ((i % 6) * 0.09),
      radius: 2.4 + (i % 3) * 0.8,
      speedX: 0.35 + ((i % 4) * 0.18),
      waveOffset: i * 0.85,
      waveAmp: 14 + (i % 4) * 8,
      hue: i % 2 === 0 ? "green" : "red",
      rotSpeed: (i % 2 === 0 ? 0.018 : -0.016) + (i % 3) * 0.004,
      orbitRadius: 15 + (i % 3) * 4,
      angle: (i * Math.PI) / 7,
      alpha: 0.55 + (i % 3) * 0.15,
    }));

    // Soft ambient floating star particles
    const ambientStars = Array.from({ length: 24 }, (_, i) => ({
      x: (i / 24) * width,
      y: height * (0.2 + (i % 7) * 0.11),
      radius: 1.2 + (i % 3) * 0.8,
      baseSpeed: 0.2 + (i % 4) * 0.12,
      hue: i % 2 === 0 ? "green" : "red",
      alpha: 0.25 + (i % 3) * 0.15,
    }));

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // Deep subtle radial background glow
      const radialGrad = ctx.createRadialGradient(
        width * 0.35,
        height * 0.5,
        40,
        width * 0.5,
        height * 0.5,
        width * 0.75
      );
      radialGrad.addColorStop(0, "rgba(0, 255, 136, 0.07)");
      radialGrad.addColorStop(0.5, "rgba(239, 68, 68, 0.05)");
      radialGrad.addColorStop(1, "rgba(10, 10, 10, 0.0)");
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // Additive screen blend mode for pure computer graphics glow
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // 1. Draw fractal sinusoidal wave curves
      waveLayers.forEach((layer) => {
        const baseY = height * layer.baseYRatio;
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, layer.colorStart);
        grad.addColorStop(0.5, layer.colorMid);
        grad.addColorStop(1, layer.colorEnd);

        ctx.strokeStyle = grad;
        ctx.lineWidth = layer.lineWidth;
        ctx.shadowColor = layer.colorStart;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        for (let x = 0; x <= width; x += 4) {
          const tSpeed = time * layer.speed;
          let yOffset =
            Math.sin(x * layer.freq + tSpeed + layer.phase) * layer.amplitude;

          layer.harmonics.forEach((h) => {
            yOffset +=
              Math.sin(x * layer.freq * h.freqMult + tSpeed * h.speedMult + layer.phase) *
              (layer.amplitude * h.ampMult);
          });

          const envelope =
            0.85 + 0.15 * Math.sin(time * 0.005 + x * 0.001);
          const y = baseY + yOffset * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // 2. Draw ambient stars
      ambientStars.forEach((p, idx) => {
        p.x = (p.x + p.baseSpeed) % (width + 30);
        const floatWave = Math.sin(time * 0.015 + idx) * 8;
        const y = p.y + floatWave;

        ctx.beginPath();
        ctx.arc(p.x, y, p.radius, 0, Math.PI * 2);
        if (p.hue === "green") {
          ctx.fillStyle = `rgba(0, 255, 136, ${p.alpha})`;
          ctx.shadowColor = "rgba(0, 255, 136, 0.7)";
        } else {
          ctx.fillStyle = `rgba(255, 51, 102, ${p.alpha})`;
          ctx.shadowColor = "rgba(255, 51, 102, 0.7)";
        }
        ctx.shadowBlur = 6;
        ctx.fill();
      });

      // 3. Draw walking tracking nodes with spinning coordinate telemetry numbers
      trackingNodes.forEach((node, idx) => {
        // Horizontal walk across the screen
        node.x = (node.x + node.speedX) % (width + 80);
        const currentX = node.x - 40;

        // Vertical harmonic wave movement
        const waveY =
          Math.sin(time * 0.018 + node.waveOffset) * node.waveAmp +
          Math.cos(time * 0.009 + idx) * (node.waveAmp * 0.4);
        const currentY = height * node.yRatio + waveY;

        // Spin angle for the orbiting coordinates
        node.angle += node.rotSpeed;

        const isGreen = node.hue === "green";
        const mainColor = isGreen ? "#00FF87" : "#FF3366";
        const rgbaMain = isGreen
          ? `rgba(0, 255, 136, ${node.alpha})`
          : `rgba(255, 51, 102, ${node.alpha})`;
        const rgbaSecondary = isGreen
          ? `rgba(52, 211, 153, ${node.alpha * 0.7})`
          : `rgba(244, 63, 94, ${node.alpha * 0.7})`;

        // Only draw when inside visible bounds
        if (currentX >= -20 && currentX <= width + 20) {
          // Central luminous core of the walking particle
          ctx.beginPath();
          ctx.arc(currentX, currentY, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = mainColor;
          ctx.shadowColor = mainColor;
          ctx.shadowBlur = 10;
          ctx.fill();

          // Subtle pulsating radar ring around the particle
          const pulse = (Math.sin(time * 0.04 + idx) + 1) * 0.5;
          ctx.beginPath();
          ctx.arc(currentX, currentY, node.radius + 3 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = rgbaSecondary;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // --- NUMERI CHE GIRANO: Coordinate HUD in orbita rotante attorno al pallino ---
          ctx.save();
          ctx.translate(currentX, currentY);
          ctx.rotate(node.angle);

          // Orbit dashed ring
          ctx.strokeStyle = isGreen
            ? "rgba(0, 255, 136, 0.25)"
            : "rgba(255, 51, 102, 0.25)";
          ctx.lineWidth = 0.7;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.arc(0, 0, node.orbitRadius, 0, Math.PI * 1.65);
          ctx.stroke();
          ctx.setLineDash([]);

          // Little crosshair tick marker
          ctx.beginPath();
          ctx.moveTo(node.orbitRadius - 3, 0);
          ctx.lineTo(node.orbitRadius + 3, 0);
          ctx.stroke();

          // Spinning coordinates text (X and Y real pixel values that rotate around the dot)
          const coordText = `[X:${Math.round(currentX)} Y:${Math.round(currentY)}]`;
          ctx.font = '8px "JetBrains Mono", "SF Mono", Menlo, monospace';
          ctx.fillStyle = isGreen
            ? "rgba(0, 255, 136, 0.85)"
            : "rgba(255, 75, 110, 0.85)";
          ctx.shadowColor = mainColor;
          ctx.shadowBlur = 5;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";

          // Text placed along the rotating orbit
          ctx.fillText(coordText, node.orbitRadius + 4, 0);

          // Counter-rotating tiny degree/angle telemetry badge
          const deg = (Math.round((node.angle * (180 / Math.PI)) % 360) + 360) % 360;
          ctx.font = '7px "JetBrains Mono", monospace';
          ctx.fillStyle = isGreen
            ? "rgba(52, 211, 153, 0.60)"
            : "rgba(251, 113, 133, 0.60)";
          ctx.fillText(`θ:${deg}°`, -node.orbitRadius - 22, 0);

          ctx.restore();
        }
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none rounded-2xl w-full h-full ${className}`}
      style={{
        zIndex: 0,
        mixBlendMode: "screen",
      }}
    />
  );
};
