// ── Kéo để di chuyển, chụm hai ngón / con lăn để phóng to ──
// Dùng chung cho bản đồ thế giới và đảo. Chạm nhẹ (không kéo) → onTap.

declare const Phaser: any;

export interface CameraOpts {
  width: number; height: number;           // kích thước thế giới
  maxZoom?: number;                         // so với mức "phủ kín màn hình"
  onTap?: (p: any, wx: number, wy: number) => void;
  onHover?: (wx: number, wy: number) => void;
}

export class CameraControls {
  scene: any; cam: any; opts: CameraOpts;
  minZoom = 0.1; maxZoom = 2;
  locked = false;                           // scene đang kéo một vật → không kéo camera
  private downAt: { x: number; y: number } | null = null;
  private moved = false;
  private pinch: { d: number; z: number } | null = null;
  private lastPan: { x: number; y: number } | null = null;

  constructor(scene: any, opts: CameraOpts) {
    this.scene = scene; this.opts = opts; this.cam = scene.cameras.main;
    scene.input.addPointer(1);
    this.cam.setBounds(0, 0, opts.width, opts.height);
    this.refit(true);

    scene.scale.on('resize', this.onResize, this);
    scene.events.once('shutdown', () => scene.scale.off('resize', this.onResize, this));

    scene.input.on('pointerdown', (p: any) => {
      const pts = this.activePointers();
      if (pts.length >= 2) {
        this.pinch = { d: this.dist(pts[0], pts[1]), z: this.cam.zoom };
        this.moved = true;
        return;
      }
      this.downAt = { x: p.x, y: p.y };
      this.lastPan = { x: p.x, y: p.y };
      this.moved = false;
    });

    scene.input.on('pointermove', (p: any) => {
      if (this.opts.onHover && !p.isDown) {
        const w = this.cam.getWorldPoint(p.x, p.y);
        this.opts.onHover(w.x, w.y);
      }
      const pts = this.activePointers();
      if (pts.length >= 2 && this.pinch) {
        const d = this.dist(pts[0], pts[1]);
        const mx = (pts[0].x + pts[1].x) / 2, my = (pts[0].y + pts[1].y) / 2;
        this.zoomAt(this.pinch.z * d / this.pinch.d, mx, my);
        return;
      }
      if (!p.isDown || !this.downAt || this.locked) return;
      const thresh = 8 * (window.devicePixelRatio || 1);
      if (!this.moved && Math.hypot(p.x - this.downAt.x, p.y - this.downAt.y) > thresh) this.moved = true;
      if (this.moved && this.lastPan) {
        this.cam.scrollX -= (p.x - this.lastPan.x) / this.cam.zoom;
        this.cam.scrollY -= (p.y - this.lastPan.y) / this.cam.zoom;
      }
      this.lastPan = { x: p.x, y: p.y };
    });

    scene.input.on('pointerup', (p: any) => {
      if (this.activePointers().length < 2) this.pinch = null;
      if (this.downAt && !this.moved && !this.locked && this.opts.onTap) {
        const w = this.cam.getWorldPoint(p.x, p.y);
        this.opts.onTap(p, w.x, w.y);
      }
      if (this.activePointers().length === 0) { this.downAt = null; this.lastPan = null; }
    });

    scene.input.on('wheel', (p: any, _o: any, _dx: number, dy: number) => {
      this.zoomAt(this.cam.zoom * Math.pow(1.0015, -dy), p.x, p.y);
    });
  }

  /** Vừa thả tay sau khi kéo? Scene dùng để bỏ qua "chạm" giả. */
  get dragging() { return this.moved; }

  private activePointers(): any[] {
    return this.scene.input.manager.pointers.filter((p: any) => p.isDown);
  }
  private dist(a: any, b: any) { return Math.hypot(a.x - b.x, a.y - b.y) || 1; }

  private onResize() { this.refit(false); }

  /** Tính mức zoom nhỏ nhất (thế giới phủ kín màn hình). */
  refit(reset: boolean) {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    this.minZoom = Math.max(W / this.opts.width, H / this.opts.height);
    this.maxZoom = this.minZoom * (this.opts.maxZoom ?? 4);
    if (reset) {
      this.cam.setZoom(this.minZoom);
      this.cam.centerOn(this.opts.width / 2, this.opts.height / 2);
    } else {
      this.cam.setZoom(Phaser.Math.Clamp(this.cam.zoom, this.minZoom, this.maxZoom));
    }
  }

  zoomAt(z: number, sx: number, sy: number) {
    z = Phaser.Math.Clamp(z, this.minZoom, this.maxZoom);
    const before = this.cam.getWorldPoint(sx, sy);
    this.cam.setZoom(z);
    this.cam.preRender();
    const after = this.cam.getWorldPoint(sx, sy);
    this.cam.scrollX += before.x - after.x;
    this.cam.scrollY += before.y - after.y;
  }

  /** Bay mượt tới một điểm với mức zoom (tương đối so với minZoom). */
  flyTo(x: number, y: number, rel = 1.6, ms = 700) {
    const z = Phaser.Math.Clamp(this.minZoom * rel, this.minZoom, this.maxZoom);
    this.cam.pan(x, y, ms, 'Sine.easeInOut');
    this.cam.zoomTo(z, ms, 'Sine.easeInOut');
  }

  zoomBy(f: number) {
    this.zoomAt(this.cam.zoom * f, this.scene.scale.width / 2, this.scene.scale.height / 2);
  }
}
