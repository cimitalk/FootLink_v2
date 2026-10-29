/**
 * Footlink Public Website — Interactive Exploded Footwear Vector Blueprint
 * Pure Vanilla JavaScript ES6+ / HTML5 Canvas 2D
 * High-precision procedural vector geometry representing a luxury Italian shoe
 * with interactive 3D explosion slider, layer inspection, and BOM telemetry.
 */

class FootwearExplodedBlueprint {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.options = Object.assign(
      {
        onLayerSelect: null,
        initialExplosion: 0.45,
      },
      options
    );

    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;
    this.explosionProgress = this.options.initialExplosion;
    this.targetExplosion = this.options.initialExplosion;
    this.hoveredLayer = null;
    this.selectedLayer = null;
    this.isAutoPlaying = false;
    this.autoPlayAngle = 0;

    // Technical Shoe BOM Layers Specification (Industrial Atelier Standards)
    this.layers = [
      {
        id: 'L1-UPPER',
        level: 'L1 Gruppo Tomaia',
        name: 'Tomaia in Vitello Pieno Fiore & Linguetta',
        material: 'Pelle Bovina Pieno Fiore Bottalata 1.4-1.6mm',
        supplier: 'Conceria Montebello SpA (Santa Croce sull’Arno)',
        district: 'Distretto Conciario Toscano',
        certifications: ['LWG Gold Rated', 'EUDR Traceable (SHA-256)', 'REACH Compliant'],
        costEstimate: '€ 24.50 / paio',
        color: '#00FF87',
        baseOffsetY: -120,
        heightWeight: 55,
      },
      {
        id: 'L2-LINING',
        level: 'L2 Struttura Interna',
        name: 'Fodera Traspirante & Contrafforte Sagomato',
        material: 'Fodera Capretto Naturale Metal-Free + Rinforzo Tallone',
        supplier: 'Tomaificio & Tranceria Marchigiana Srl (Montegranaro)',
        district: 'Distretto Calzaturiero Fermano-Maceratese',
        certifications: ['OEKO-TEX Standard 100', 'Metal-Free 0% Cromo'],
        costEstimate: '€ 12.80 / paio',
        color: '#38BDF8',
        baseOffsetY: -65,
        heightWeight: 35,
      },
      {
        id: 'L3-INSOLE',
        level: 'L2 Supporto Meccanico',
        name: 'Sottopiede Anatomico con Cambrione Antitorsione',
        material: 'Cuoio Vegetale Rigenerato + Lamina Acciaio C75 Temperato',
        supplier: 'Suolificio & Sottopiedi Brenta (Riviera del Brenta)',
        district: 'Distretto del Lusso Veneto',
        certifications: ['ISO 9001:2015', 'Certificazione Ergonomia IT'],
        costEstimate: '€ 6.40 / paio',
        color: '#A855F7',
        baseOffsetY: -15,
        heightWeight: 20,
      },
      {
        id: 'L4-MIDSOLE',
        level: 'L1 Intersuola & Assemblaggio',
        name: 'Intersuola EVA Resiliente & Guardolo Cucito Blake',
        material: 'Microporosa Superleggera 45 Sh.A + Guardolo Cuoio Naturale',
        supplier: 'Compositi Avanzati del Salento (Casarano, Puglia)',
        district: 'Distretto Manifatturiero Pugliese',
        certifications: ['35% Riciclato Post-Consumo', 'Carbon Neutral Batch'],
        costEstimate: '€ 9.10 / paio',
        color: '#F59E0B',
        baseOffsetY: 35,
        heightWeight: 32,
      },
      {
        id: 'L5-OUTSOLE',
        level: 'L1 Battistrada a Contatto Suolo',
        name: 'Battistrada Gomma Grip Scolpita con Scanalature',
        material: 'Mescola Gomma Naturale Vulcanizzata ad Alta Aderenza',
        supplier: 'Gommatex Tech Soles (Civitanova Marche)',
        district: 'Distretto Calzaturiero Marchigiano',
        certifications: ['Resistenza Abrasione DIN 53516 < 110mm³', 'Grip Wet EN ISO 13287'],
        costEstimate: '€ 14.20 / paio',
        color: '#EF4444',
        baseOffsetY: 90,
        heightWeight: 38,
      },
      {
        id: 'L6-DPP-CORE',
        level: 'L3 Passaporto Digitale UE',
        name: 'Tag Crittografico DPP UE & NFC Sub-dermico',
        material: 'Chip NFC NTAG424 DNA Secure + QR Code SVG Laser ESPR',
        supplier: 'Footlink Digital Core Infrastructure',
        district: 'Infrastruttura Cloud UE Francoforte (GDPR Certificata)',
        certifications: ['Regolamento UE ESPR 2024/1781', 'Tracciabilità EUDR 2023/1115'],
        costEstimate: 'Incluso nel Canone Footlink (0 € Terzisti)',
        color: '#FF3366',
        baseOffsetY: 145,
        heightWeight: 22,
      },
    ];

    this.init();
  }

  init() {
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', this.handleResize);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('click', this.handleClick);

    this.handleResize();
    this.selectLayer(this.layers[0]);
    this.loop();
  }

  handleResize() {
    const rect = this.canvas.parentElement
      ? this.canvas.parentElement.getBoundingClientRect()
      : { width: 800, height: 500 };
    this.width = rect.width;
    this.height = Math.max(rect.height, 460);

    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  setExplosionProgress(val) {
    this.targetExplosion = Math.max(0, Math.min(1, val));
    this.isAutoPlaying = false;
  }

  toggleAutoPlay() {
    this.isAutoPlaying = !this.isAutoPlaying;
    return this.isAutoPlaying;
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let hit = null;
    const cx = this.width * 0.48;
    const cy = this.height * 0.50;

    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      const layerY = cy + layer.baseOffsetY * this.explosionProgress;
      const w = Math.min(this.width * 0.72, 440);
      const h = layer.heightWeight;

      if (mx >= cx - w * 0.5 && mx <= cx + w * 0.5 && my >= layerY - h * 0.5 && my <= layerY + h * 0.5) {
        hit = layer;
        break;
      }
    }

    this.hoveredLayer = hit;
    this.canvas.style.cursor = hit ? 'pointer' : 'default';
  }

  handleClick() {
    if (this.hoveredLayer) {
      this.selectLayer(this.hoveredLayer);
    }
  }

  selectLayer(layer) {
    this.selectedLayer = layer;
    if (this.options.onLayerSelect && typeof this.options.onLayerSelect === 'function') {
      this.options.onLayerSelect(layer);
    }
  }

  // Pure Procedural Vector Drawing for each Technical Shoe Component
  drawShoeLayerGeometry(layer, cx, y, widthScale = 1) {
    const ctx = this.ctx;
    const w = Math.min(this.width * 0.72, 440) * widthScale;
    const isSelected = this.selectedLayer && this.selectedLayer.id === layer.id;
    const isHovered = this.hoveredLayer && this.hoveredLayer.id === layer.id;

    ctx.save();
    ctx.translate(cx, y);

    // Dynamic isometric skew and perspective tilt
    ctx.transform(1, -0.06, 0.12, 1, 0, 0);

    // Glowing border if hovered/selected
    if (isSelected || isHovered) {
      ctx.shadowColor = layer.color;
      ctx.shadowBlur = isSelected ? 20 : 12;
    }

    ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2.0 : 1.4;
    ctx.strokeStyle = isSelected ? '#FFFFFF' : layer.color;
    ctx.fillStyle = isSelected
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(20, 20, 20, 0.85)';

    ctx.beginPath();

    switch (layer.id) {
      case 'L1-UPPER':
        // Sleek aerodynamic upper collar, tongue, and toe box curve
        ctx.moveTo(-w * 0.44, 18);
        ctx.bezierCurveTo(-w * 0.38, -28, -w * 0.15, -42, 0, -32); // Heel to collar
        ctx.bezierCurveTo(w * 0.15, -22, w * 0.32, -4, w * 0.46, 12); // Tongue to toe cap
        ctx.bezierCurveTo(w * 0.48, 22, w * 0.32, 28, 0, 26); // Toe bottom curve
        ctx.bezierCurveTo(-w * 0.28, 24, -w * 0.42, 26, -w * 0.44, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Technical Stitching Detail & Eyelet Punctures
        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, 14);
        ctx.bezierCurveTo(-w * 0.12, -18, w * 0.18, -6, w * 0.40, 10);
        ctx.stroke();

        // Eyelets
        ctx.setLineDash([]);
        ctx.fillStyle = '#FFFFFF';
        for (let e = -3; e <= 3; e++) {
          const ex = e * 18;
          const ey = -10 + Math.abs(e) * 3;
          ctx.beginPath();
          ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;

      case 'L2-LINING':
        // Internal glove-like inner lining layer
        ctx.moveTo(-w * 0.40, 12);
        ctx.bezierCurveTo(-w * 0.32, -20, -w * 0.10, -30, 0, -22);
        ctx.bezierCurveTo(w * 0.12, -14, w * 0.28, -2, w * 0.42, 8);
        ctx.bezierCurveTo(w * 0.40, 16, w * 0.24, 20, 0, 18);
        ctx.bezierCurveTo(-w * 0.22, 18, -w * 0.36, 18, -w * 0.40, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'L3-INSOLE':
        // Precision ergonomic insole board with arch support
        ctx.moveTo(-w * 0.44, 4);
        ctx.bezierCurveTo(-w * 0.32, -6, -w * 0.05, -8, 0, -6);
        ctx.bezierCurveTo(w * 0.18, -4, w * 0.35, -2, w * 0.46, 4);
        ctx.bezierCurveTo(w * 0.38, 12, w * 0.12, 14, 0, 12);
        ctx.bezierCurveTo(-w * 0.24, 12, -w * 0.40, 10, -w * 0.44, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Embedded Steel Shank Indicator (Antitorsione)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-w * 0.15, 3);
        ctx.lineTo(w * 0.08, 3);
        ctx.stroke();
        break;

      case 'L4-MIDSOLE':
        // Resilient lightweight midsole with athletic geometric grooves
        ctx.moveTo(-w * 0.45, -4);
        ctx.bezierCurveTo(-w * 0.25, -6, 0, -8, w * 0.46, -4);
        ctx.bezierCurveTo(w * 0.48, 12, w * 0.30, 18, 0, 18);
        ctx.bezierCurveTo(-w * 0.30, 18, -w * 0.46, 14, -w * 0.45, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Micro-cushioning flex indentations
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let g = -4; g <= 4; g++) {
          const gx = g * 28;
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx + 6, 12);
          ctx.stroke();
        }
        break;

      case 'L5-OUTSOLE':
        // Lugged durable rubber tread with multi-directional grip channels
        ctx.moveTo(-w * 0.46, -6);
        ctx.lineTo(w * 0.47, -6);
        ctx.bezierCurveTo(w * 0.49, 14, w * 0.32, 22, 0, 22);
        ctx.bezierCurveTo(-w * 0.32, 22, -w * 0.48, 16, -w * 0.46, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // High-traction lugs pattern
        ctx.fillStyle = layer.color;
        for (let l = -5; l <= 5; l++) {
          const lx = l * 26;
          ctx.beginPath();
          ctx.rect(lx - 5, 4, 10, 8);
          ctx.fill();
        }
        break;

      case 'L6-DPP-CORE':
        // Cryptographic NFC chip badge & SVG telemetry frame
        ctx.rect(-w * 0.28, -12, w * 0.56, 24);
        ctx.fill();
        ctx.stroke();

        // Live NFC Pulse Wave Symbol
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = 1.5;
        for (let wave = 1; wave <= 3; wave++) {
          ctx.beginPath();
          ctx.arc(0, 0, wave * 6, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.stroke();
        }
        break;
    }

    // Callout Connecting Pin & Technical Tag Label
    const tagX = w * 0.50 + 20;
    const tagY = 0;

    ctx.beginPath();
    ctx.moveTo(w * 0.44, 0);
    ctx.lineTo(tagX, tagY);
    ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tagX, tagY, 3, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#00FF87' : layer.color;
    ctx.fill();

    // Layer Label Badge
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillStyle = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${layer.id} · ${layer.level.toUpperCase()}`, tagX + 10, tagY + 3);

    ctx.restore();
  }

  loop() {
    // Smooth Interpolation towards Target Explosion
    if (this.isAutoPlaying) {
      this.autoPlayAngle += 0.025;
      this.targetExplosion = 0.5 + Math.sin(this.autoPlayAngle) * 0.42;
    }

    const diff = this.targetExplosion - this.explosionProgress;
    this.explosionProgress += diff * 0.10;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width * 0.44;
    const cy = this.height * 0.50;

    // Center Coordinate Axis Line
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 6]);
    this.ctx.beginPath();
    this.ctx.moveTo(cx, 30);
    this.ctx.lineTo(cx, this.height - 30);
    this.ctx.stroke();
    this.ctx.restore();

    // Render each Shoe BOM Layer in exploded vertical order
    this.layers.forEach((layer) => {
      // Ease out cubic explosion spacing
      const explodedY = cy + layer.baseOffsetY * (0.35 + this.explosionProgress * 1.65);
      this.drawShoeLayerGeometry(layer, cx, explodedY);
    });

    // Onboarding Telemetry Gauge
    this.ctx.save();
    this.ctx.font = '700 10px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#707072';
    this.ctx.fillText(
      `ESPLOSIONE BOM: ${Math.round(this.explosionProgress * 100)}%`,
      24,
      30
    );
    this.ctx.fillStyle = '#00FF87';
    this.ctx.fillText(`6 STRATI ISO-BOM VERIFICATI`, 24, 46);
    this.ctx.restore();

    requestAnimationFrame(this.loop);
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('click', this.handleClick);
  }
}

// Global export for vanilla static script execution
window.FootwearExplodedBlueprint = FootwearExplodedBlueprint;
