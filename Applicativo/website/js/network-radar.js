/**
 * Footlink Public Website — Italian Districts Network Radar & Filiera Telemetry
 * Pure Vanilla JavaScript ES6+ / HTML5 Canvas 2D
 * Simulates real-time B2B supply-chain connectivity across key Italian footwear districts.
 */

class NetworkDistrictsRadar {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.options = Object.assign({ autoStart: true }, options);

    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;
    this.angle = 0;
    this.sweepSpeed = 0.024;
    this.isRunning = false;

    // Authentic Italian Footwear & Leather Goods Districts Coordinates (relative map projection)
    this.districts = [
      {
        id: 'DIS-MC-AP',
        name: 'Fermo-Macerata',
        region: 'Marche',
        focus: 'Calzatura Uomo/Donna Eccellenza & Sneakers',
        terzistiCount: 1420,
        xRel: 0.58,
        yRel: 0.44,
        pulseRadius: 0,
      },
      {
        id: 'DIS-VE-PD',
        name: 'Riviera del Brenta',
        region: 'Veneto',
        focus: 'Calzatura di Lusso Donna & Tacchifici',
        terzistiCount: 890,
        xRel: 0.52,
        yRel: 0.22,
        pulseRadius: 0,
      },
      {
        id: 'DIS-FI-PI',
        name: 'Santa Croce sull’Arno',
        region: 'Toscana',
        focus: 'Concerie Pellami Nobili & LWG Gold',
        terzistiCount: 1150,
        xRel: 0.44,
        yRel: 0.38,
        pulseRadius: 0,
      },
      {
        id: 'DIS-FI-AR',
        name: 'Scandicci - Valdarno',
        region: 'Toscana',
        focus: 'Pelletteria & Minuterie Galvaniche',
        terzistiCount: 960,
        xRel: 0.47,
        yRel: 0.42,
        pulseRadius: 0,
      },
      {
        id: 'DIS-CE-NA',
        name: 'Caserta - Napoli',
        region: 'Campania',
        focus: 'Tomaifici, Orlatura & Sneakers Fast Track',
        terzistiCount: 1280,
        xRel: 0.62,
        yRel: 0.65,
        pulseRadius: 0,
      },
      {
        id: 'DIS-BAT',
        name: 'Barletta - Trani',
        region: 'Puglia',
        focus: 'Calzatura Tecnica, Iniezione & Manifattura',
        terzistiCount: 740,
        xRel: 0.74,
        yRel: 0.68,
        pulseRadius: 0,
      },
    ];

    this.init();
  }

  init() {
    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', this.handleResize);
    this.handleResize();

    if (this.options.autoStart) {
      this.start();
    }
  }

  handleResize() {
    const rect = this.canvas.parentElement
      ? this.canvas.parentElement.getBoundingClientRect()
      : { width: 400, height: 400 };
    this.width = rect.width;
    this.height = Math.max(rect.height, 360);

    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  start() {
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  loop() {
    if (!this.isRunning) return;

    this.angle = (this.angle + this.sweepSpeed) % (Math.PI * 2);
    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width * 0.5;
    const cy = this.height * 0.5;
    const maxRadius = Math.min(cx, cy) - 24;

    // Concentric Radar Distance Rings
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 255, 135, 0.15)';
    this.ctx.lineWidth = 1;

    for (let r = 1; r <= 4; r++) {
      const radius = (maxRadius / 4) * r;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Range text
      this.ctx.font = '600 8px "JetBrains Mono", monospace';
      this.ctx.fillStyle = 'rgba(0, 255, 135, 0.4)';
      this.ctx.fillText(`${r * 150} KM`, cx + 4, cy - radius + 10);
    }

    // Cross Axis
    this.ctx.beginPath();
    this.ctx.moveTo(cx - maxRadius, cy);
    this.ctx.lineTo(cx + maxRadius, cy);
    this.ctx.moveTo(cx, cy - maxRadius);
    this.ctx.lineTo(cx, cy + maxRadius);
    this.ctx.stroke();

    // Rotating Radar Sweep Cone with Phosphor Falloff
    const sweepSegments = 40;
    const coneAngle = Math.PI * 0.28;
    for (let i = 0; i < sweepSegments; i++) {
      const stepAngle = this.angle - (coneAngle / sweepSegments) * i;
      const alpha = (1 - i / sweepSegments) * 0.22;

      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.arc(cx, cy, maxRadius, stepAngle, stepAngle + 0.03);
      this.ctx.closePath();
      this.ctx.fillStyle = `rgba(0, 255, 135, ${alpha})`;
      this.ctx.fill();
    }

    // Leading High-Intensity Radar Beam
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy);
    this.ctx.lineTo(
      cx + Math.cos(this.angle) * maxRadius,
      cy + Math.sin(this.angle) * maxRadius
    );
    this.ctx.strokeStyle = '#00FF87';
    this.ctx.lineWidth = 1.8;
    this.ctx.shadowColor = '#00FF87';
    this.ctx.shadowBlur = 10;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Render Districts Nodes & Trigger Pulse Waves upon Radar Beam Hit
    this.districts.forEach((d) => {
      const dx = d.xRel * this.width;
      const dy = d.yRel * this.height;

      // Angular distance between node and radar sweep beam
      const nodeAngle = Math.atan2(dy - cy, dx - cx);
      const normalizedNodeAngle = nodeAngle < 0 ? nodeAngle + Math.PI * 2 : nodeAngle;
      const angleDiff = Math.abs(normalizedNodeAngle - this.angle);

      if (angleDiff < 0.05) {
        d.pulseRadius = 1; // Trigger ripple
      }

      // Ripple animation
      if (d.pulseRadius > 0) {
        d.pulseRadius += 0.8;
        this.ctx.beginPath();
        this.ctx.arc(dx, dy, d.pulseRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(0, 255, 135, ${Math.max(0, 1 - d.pulseRadius / 25)})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        if (d.pulseRadius > 25) {
          d.pulseRadius = 0;
        }
      }

      // District Blip Dot
      this.ctx.beginPath();
      this.ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#00FF87';
      this.ctx.shadowColor = '#00FF87';
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // District Text
      this.ctx.font = '700 9px "Inter", sans-serif';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(d.name, dx + 7, dy - 2);

      this.ctx.font = '600 8px "JetBrains Mono", monospace';
      this.ctx.fillStyle = '#707072';
      this.ctx.fillText(`${d.terzistiCount} terzisti a 0€`, dx + 7, dy + 8);
    });

    this.ctx.restore();

    requestAnimationFrame(this.loop);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
  }
}

// Global export for vanilla static script execution
window.NetworkDistrictsRadar = NetworkDistrictsRadar;
