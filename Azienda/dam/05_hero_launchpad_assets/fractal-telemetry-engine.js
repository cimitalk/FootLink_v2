/**
 * Footlink DAM — Fractal Wave & Spinning Telemetry HUD Canvas Engine
 * Reusable stand-alone graphic engine replicating the Home Launchpad Hero.
 * Zero dependencies, pure Canvas 2D, 60 FPS, screen blending.
 */

export function createFractalTelemetryEngine(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = options.width || canvas.clientWidth || 1200);
  let height = (canvas.height = options.height || canvas.clientHeight || 600);
  let time = 0;
  let isRunning = true;
  let animId = null;

  const waveLayers = [
    { baseYRatio: 0.40, amplitude: 38, freq: 0.0028, speed: 0.012, colorStart: "rgba(0, 255, 136, 0.50)", colorEnd: "rgba(255, 51, 102, 0.35)", lineWidth: 2.2 },
    { baseYRatio: 0.48, amplitude: 46, freq: 0.0022, speed: 0.009, colorStart: "rgba(16, 185, 129, 0.55)", colorEnd: "rgba(239, 68, 68, 0.45)", lineWidth: 2.8 },
    { baseYRatio: 0.58, amplitude: 44, freq: 0.0025, speed: -0.011, colorStart: "rgba(255, 51, 102, 0.60)", colorEnd: "rgba(0, 255, 136, 0.40)", lineWidth: 2.5 },
    { baseYRatio: 0.66, amplitude: 36, freq: 0.0031, speed: 0.014, colorStart: "rgba(244, 63, 94, 0.50)", colorEnd: "rgba(16, 185, 129, 0.45)", lineWidth: 2.0 },
    { baseYRatio: 0.52, amplitude: 52, freq: 0.0018, speed: 0.007, colorStart: "rgba(0, 255, 136, 0.65)", colorEnd: "rgba(239, 68, 68, 0.65)", lineWidth: 3.2 }
  ];

  const nodeCount = options.nodeCount || 14;
  const trackingNodes = Array.from({ length: nodeCount }, (_, i) => ({
    x: (i / nodeCount) * width + (Math.sin(i * 3) * 50),
    yRatio: 0.30 + ((i % 6) * 0.09),
    radius: 2.4 + (i % 3) * 0.8,
    speedX: 0.35 + ((i % 4) * 0.18),
    waveOffset: i * 0.85,
    waveAmp: 14 + (i % 4) * 8,
    hue: i % 2 === 0 ? "green" : "red",
    rotSpeed: (i % 2 === 0 ? 0.018 : -0.016) + (i % 3) * 0.004,
    orbitRadius: 16 + (i % 3) * 4,
    angle: (i * Math.PI) / 7,
    alpha: 0.65 + (i % 3) * 0.15
  }));

  function render() {
    if (!isRunning) return;
    time += 1;
    ctx.clearRect(0, 0, width, height);

    // Radial depth glow
    const rad = ctx.createRadialGradient(width * 0.5, height * 0.5, 30, width * 0.5, height * 0.5, width * 0.8);
    rad.addColorStop(0, "rgba(0, 255, 136, 0.06)");
    rad.addColorStop(0.5, "rgba(255, 51, 102, 0.03)");
    rad.addColorStop(1, "rgba(10, 10, 10, 0)");
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Draw Waves
    waveLayers.forEach(layer => {
      ctx.beginPath();
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, layer.colorStart);
      grad.addColorStop(1, layer.colorEnd);
      ctx.strokeStyle = grad;
      ctx.lineWidth = layer.lineWidth;
      ctx.shadowColor = layer.colorStart;
      ctx.shadowBlur = 10;

      for (let x = 0; x <= width; x += 6) {
        const y =
          height * layer.baseYRatio +
          Math.sin(x * layer.freq + time * layer.speed) * layer.amplitude +
          Math.sin(x * layer.freq * 2.1 + time * layer.speed * 1.4) * (layer.amplitude * 0.45);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Draw Tracking Nodes with spinning coordinates
    trackingNodes.forEach((node, idx) => {
      node.x = (node.x + node.speedX) % (width + 80);
      const curX = node.x - 40;
      const waveY = Math.sin(time * 0.018 + node.waveOffset) * node.waveAmp;
      const curY = height * node.yRatio + waveY;
      node.angle += node.rotSpeed;

      const isGreen = node.hue === "green";
      const mainColor = isGreen ? "#00FF87" : "#FF3366";

      if (curX >= -20 && curX <= width + 20) {
        ctx.beginPath();
        ctx.arc(curX, curY, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.shadowColor = mainColor;
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(node.angle);

        ctx.strokeStyle = isGreen ? "rgba(0, 255, 136, 0.25)" : "rgba(255, 51, 102, 0.25)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, node.orbitRadius, 0, Math.PI * 1.65);
        ctx.stroke();
        ctx.setLineDash([]);

        const coordText = `[X:${Math.round(curX)} Y:${Math.round(curY)}]`;
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = isGreen ? "rgba(0, 255, 136, 0.9)" : "rgba(255, 75, 110, 0.9)";
        ctx.fillText(coordText, node.orbitRadius + 4, 0);

        const deg = (Math.round((node.angle * (180 / Math.PI)) % 360) + 360) % 360;
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillStyle = isGreen ? "rgba(52, 211, 153, 0.6)" : "rgba(251, 113, 133, 0.6)";
        ctx.fillText(`θ:${deg}°`, -node.orbitRadius - 22, 0);

        ctx.restore();
      }
    });

    ctx.restore();
    animId = requestAnimationFrame(render);
  }

  render();

  return {
    stop: () => { isRunning = false; if (animId) cancelAnimationFrame(animId); },
    start: () => { if (!isRunning) { isRunning = true; render(); } },
    resize: (w, h) => {
      width = canvas.width = w;
      height = canvas.height = h;
    }
  };
}
