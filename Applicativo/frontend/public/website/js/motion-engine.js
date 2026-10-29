/**
 * Footlink Public Website — Advanced Computer Motion & Telemetry Canvas Engine
 * Pure Vanilla JavaScript ES6+, 60 FPS, Zero Dependencies.
 * Features:
 * - Multi-layer Harmonic Wave Mathematics with Screen Blending
 * - Orbital Telemetry HUD with dynamic theta (θ) and live [X, Y] projection
 * - Damped Spring Physics Cursor Attraction & Fluid Wave Ripple Distortion
 * - High-DPI Retina Screen Compensation
 */

class MotionTelemetryEngine {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.options = Object.assign(
      {
        fpsCap: 60,
        enableMouseInteraction: true,
        enableSpringPhysics: true,
        nodeCount: 16,
      },
      options
    );

    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;
    this.time = 0;
    this.isRunning = false;
    this.animFrameId = null;

    // Mouse & Spring Physics State
    this.mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      vx: 0,
      vy: 0,
      active: false,
      stiffness: 0.08,
      damping: 0.78,
      radius: 180,
    };

    // Harmonic Wave Configuration (Luxury Emerald & Ruby Core)
    this.waveLayers = [
      {
        baseY: 0.42,
        amp: 42,
        freq: 0.0026,
        speed: 0.016,
        colorStart: 'rgba(0, 255, 135, 0.55)',
        colorEnd: 'rgba(255, 51, 102, 0.40)',
        width: 2.4,
        phase: 0.2,
      },
      {
        baseY: 0.50,
        amp: 54,
        freq: 0.0021,
        speed: 0.011,
        colorStart: 'rgba(16, 185, 129, 0.65)',
        colorEnd: 'rgba(239, 68, 68, 0.50)',
        width: 3.0,
        phase: 1.1,
      },
      {
        baseY: 0.58,
        amp: 48,
        freq: 0.0029,
        speed: -0.014,
        colorStart: 'rgba(255, 51, 102, 0.60)',
        colorEnd: 'rgba(0, 255, 135, 0.45)',
        width: 2.6,
        phase: 2.3,
      },
      {
        baseY: 0.66,
        amp: 36,
        freq: 0.0033,
        speed: 0.018,
        colorStart: 'rgba(244, 63, 94, 0.50)',
        colorEnd: 'rgba(16, 185, 129, 0.40)',
        width: 2.0,
        phase: 0.8,
      },
      {
        baseY: 0.52,
        amp: 60,
        freq: 0.0016,
        speed: 0.008,
        colorStart: 'rgba(0, 255, 135, 0.70)',
        colorEnd: 'rgba(239, 68, 68, 0.60)',
        width: 3.4,
        phase: 3.0,
      },
    ];

    // Orbital Telemetry Tracking Nodes
    this.nodes = [];

    this.init();
  }

  init() {
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', this.handleResize);
    if (this.options.enableMouseInteraction) {
      window.addEventListener('mousemove', this.handleMouseMove);
      window.addEventListener('mouseleave', this.handleMouseLeave);
    }

    this.handleResize();
    this.generateNodes();
    this.start();
  }

  generateNodes() {
    this.nodes = [];
    const count = this.options.nodeCount;
    for (let i = 0; i < count; i++) {
      this.nodes.push({
        id: `NOD-${(i + 1).toString().padStart(2, '0')}`,
        xRatio: (i + 0.5) / count,
        baseYRatio: 0.32 + ((i % 5) * 0.1),
        orbitRadius: 18 + ((i % 4) * 6),
        orbitSpeed: (i % 2 === 0 ? 0.022 : -0.019) + ((i % 3) * 0.005),
        angle: (i * Math.PI * 2) / count,
        color: i % 2 === 0 ? '#00FF87' : '#FF3366',
        size: 2.8 + (i % 3) * 0.8,
        pulseOffset: i * 0.45,
      });
    }
  }

  handleResize() {
    const rect = this.canvas.parentElement
      ? this.canvas.parentElement.getBoundingClientRect()
      : { width: window.innerWidth, height: window.innerHeight };
    this.width = rect.width;
    this.height = rect.height;

    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.targetX = e.clientX - rect.left;
    this.mouse.targetY = e.clientY - rect.top;
    this.mouse.active = true;
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.targetX = -1000;
    this.mouse.targetY = -1000;
  }

  updateSpringPhysics() {
    if (!this.mouse.active) return;
    // Spring solver: Hooke's Law with damping: a = -k*(x - target) - c*v
    const dx = this.mouse.targetX - this.mouse.x;
    const dy = this.mouse.targetY - this.mouse.y;

    if (this.mouse.x === -1000) {
      this.mouse.x = this.mouse.targetX;
      this.mouse.y = this.mouse.targetY;
      return;
    }

    const ax = dx * this.mouse.stiffness;
    const ay = dy * this.mouse.stiffness;

    this.mouse.vx = (this.mouse.vx + ax) * this.mouse.damping;
    this.mouse.vy = (this.mouse.vy + ay) * this.mouse.damping;

    this.mouse.x += this.mouse.vx;
    this.mouse.y += this.mouse.vy;
  }

  renderBackgroundDepth() {
    // Atmospheric dark gradient with luminous focal points
    const rad = this.ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.5,
      20,
      this.width * 0.5,
      this.height * 0.5,
      this.width * 0.75
    );
    rad.addColorStop(0, 'rgba(0, 255, 135, 0.055)');
    rad.addColorStop(0.45, 'rgba(255, 51, 102, 0.035)');
    rad.addColorStop(1, 'rgba(10, 10, 10, 0)');

    this.ctx.fillStyle = rad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle Precision Engineering Grid Lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    this.ctx.lineWidth = 1;
    const gridSize = 80;
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  renderHarmonicWaves() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';

    this.waveLayers.forEach((layer, idx) => {
      this.ctx.beginPath();
      const grad = this.ctx.createLinearGradient(0, 0, this.width, 0);
      grad.addColorStop(0, layer.colorStart);
      grad.addColorStop(1, layer.colorEnd);

      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = layer.width;
      this.ctx.shadowColor = layer.colorStart;
      this.ctx.shadowBlur = 12;

      const step = 6;
      for (let x = 0; x <= this.width; x += step) {
        // Core harmonic formula: y = BaseY + A1*sin(k1*x + w1*t) + A2*sin(k2*x + w2*t)
        let waveY =
          this.height * layer.baseY +
          Math.sin(x * layer.freq + this.time * layer.speed + layer.phase) * layer.amp +
          Math.sin(x * layer.freq * 2.2 + this.time * layer.speed * 1.5) * (layer.amp * 0.42);

        // Fluid Cursor Ripple Interaction: displacement is proportional to Gaussian distance from cursor
        if (this.mouse.active) {
          const distX = x - this.mouse.x;
          const distY = waveY - this.mouse.y;
          const distSq = distX * distX + distY * distY;
          const maxDistSq = this.mouse.radius * this.mouse.radius;

          if (distSq < maxDistSq) {
            const factor = 1 - distSq / maxDistSq;
            const displacement = Math.sin(Math.sqrt(distSq) * 0.08 - this.time * 0.12) * 35 * factor;
            waveY += displacement;
          }
        }

        if (x === 0) {
          this.ctx.moveTo(x, waveY);
        } else {
          this.ctx.lineTo(x, waveY);
        }
      }
      this.ctx.stroke();
    });

    this.ctx.restore();
  }

  renderTelemetryHUD() {
    this.ctx.save();
    this.ctx.font = '600 9px "JetBrains Mono", monospace';

    this.nodes.forEach((node) => {
      node.angle += node.orbitSpeed;
      const baseX = node.xRatio * this.width;
      const baseY =
        this.height * node.baseYRatio +
        Math.sin(baseX * 0.0025 + this.time * 0.015) * 28;

      const orbitX = baseX + Math.cos(node.angle) * node.orbitRadius;
      const orbitY = baseY + Math.sin(node.angle) * node.orbitRadius * 0.55;

      // Orbit Ellipse Path (Dotted)
      this.ctx.beginPath();
      this.ctx.ellipse(
        baseX,
        baseY,
        node.orbitRadius,
        node.orbitRadius * 0.55,
        0,
        0,
        Math.PI * 2
      );
      this.ctx.setLineDash([2, 4]);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Orbiting Node Dot with Glow
      this.ctx.beginPath();
      this.ctx.arc(orbitX, orbitY, node.size, 0, Math.PI * 2);
      this.ctx.fillStyle = node.color;
      this.ctx.shadowColor = node.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fill();

      // Precision Crosshair Tick
      this.ctx.strokeStyle = node.color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(orbitX - 4, orbitY);
      this.ctx.lineTo(orbitX + 4, orbitY);
      this.ctx.moveTo(orbitX, orbitY - 4);
      this.ctx.lineTo(orbitX, orbitY + 4);
      this.ctx.stroke();

      // Telemetry Data Box: [X, Y] & θ (Degrees)
      const degrees = Math.round(((node.angle % (Math.PI * 2)) * 180) / Math.PI);
      const normalizedDeg = degrees < 0 ? 360 + degrees : degrees;
      const px = Math.round(orbitX);
      const py = Math.round(orbitY);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      this.ctx.fillText(`[X:${px} Y:${py}]`, orbitX + 8, orbitY - 4);
      this.ctx.fillStyle = node.color;
      this.ctx.fillText(`θ:${normalizedDeg}°`, orbitX + 8, orbitY + 8);
    });

    this.ctx.restore();
  }

  renderCursorReticle() {
    if (!this.mouse.active) return;
    this.ctx.save();
    this.ctx.strokeStyle = '#00FF87';
    this.ctx.lineWidth = 1;

    // Reticle circle with breathing radius
    const r = 24 + Math.sin(this.time * 0.08) * 3;
    this.ctx.beginPath();
    this.ctx.arc(this.mouse.x, this.mouse.y, r, 0, Math.PI * 2);
    this.ctx.setLineDash([3, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Crosshair ticks
    this.ctx.beginPath();
    this.ctx.moveTo(this.mouse.x - r - 6, this.mouse.y);
    this.ctx.lineTo(this.mouse.x - r + 4, this.mouse.y);
    this.ctx.moveTo(this.mouse.x + r - 4, this.mouse.y);
    this.ctx.lineTo(this.mouse.x + r + 6, this.mouse.y);
    this.ctx.moveTo(this.mouse.x, this.mouse.y - r - 6);
    this.ctx.lineTo(this.mouse.x, this.mouse.y - r + 4);
    this.ctx.moveTo(this.mouse.x, this.mouse.y + r - 4);
    this.ctx.lineTo(this.mouse.x, this.mouse.y + r + 6);
    this.ctx.stroke();

    // Live Target Label
    this.ctx.font = '700 9px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#00FF87';
    this.ctx.fillText(
      `TARGET [${Math.round(this.mouse.x)}, ${Math.round(this.mouse.y)}]`,
      this.mouse.x + r + 8,
      this.mouse.y - 6
    );

    this.ctx.restore();
  }

  loop() {
    if (!this.isRunning) return;

    this.time += 1;
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.updateSpringPhysics();
    this.renderBackgroundDepth();
    this.renderHarmonicWaves();
    this.renderTelemetryHUD();
    this.renderCursorReticle();

    this.animFrameId = requestAnimationFrame(this.loop);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseleave', this.handleMouseLeave);
  }
}

// Global export for vanilla static script execution
window.MotionTelemetryEngine = MotionTelemetryEngine;
