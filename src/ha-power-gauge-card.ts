import { LitElement, html, css, svg, TemplateResult, SVGTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./power-gauge-editor";

export interface PowerGaugeCardConfig {
  type: string;
  entity: string;
  title?: string;
  min?: number;
  max?: number;
  unit?: string;
  warning?: number;
  critical?: number;
  green_from?: number;
  green_to?: number;
  amber_from?: number;
  amber_to?: number;
  red_from?: number;
  red_to?: number;
  show_value?: boolean;
  show_icon?: boolean;
  show_labels?: boolean;
  needle?: boolean;
  smooth?: boolean;
  severity_mode?: "thresholds" | "bands";
  icon?: string;
  value_position?: "center" | "below_pin";
  label_position?: "default" | "lower";
  glow?: boolean;
  arc_style?: "thin" | "standard" | "thick" | "dotted" | "dashed" | "led";
  show_ticks?: boolean;
  led_segments?: number;
  led_segment_gap?: number;
  led_radius?: number;
  show_trend?: boolean;
  show_history?: boolean;
  history_period?: number;
  history_type?: "average" | "min" | "max";
}

@customElement("ha-power-gauge-card")
export class HaPowerGaugeCard extends LitElement {
  @property({ attribute: false }) public hass: any;
  @property({ attribute: false }) private _config!: PowerGaugeCardConfig;

  @state() private _previousValue?: number;
  @state() private _trend: 'up' | 'down' | 'stable' = 'stable';
  @state() private _trendVisible = false;
  @state() private _historyData?: { average: number; min: number; max: number };
  @state() private _historyLoaded = false;

  static styles = css`
    :host {
      display: block;
    }

    ha-card {
      padding: 16px;
      overflow: hidden;
    }

    .wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .title-wrap {
      min-width: 0;
      flex: 1;
    }

    .title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--primary-text-color);
      line-height: 1.2;
      word-break: break-word;
    }

    .icon {
      color: var(--state-icon-color);
      flex: 0 0 auto;
    }

    .trend-icon {
      color: var(--state-icon-color);
      flex: 0 0 auto;
      margin-left: 8px;
    }

    .gauge {
      width: 100%;
      max-width: 360px;
      margin: 0 auto;
      display: block;
    }

    .value {
      font-size: 1.95rem;
      font-weight: 700;
      fill: var(--primary-text-color);
    }

    .sub {
      font-size: 0.9rem;
      fill: var(--secondary-text-color);
    }

    .label {
      font-size: 0.8rem;
      fill: var(--secondary-text-color);
    }
  `;

  public static getStubConfig(): Record<string, unknown> {
    return {
      entity: "sensor.house_power",
      title: "Power Consumption",
      min: 0,
      max: 10000,
      warning: 5000,
      critical: 8000,
      show_value: true,
      show_icon: true,
      show_labels: true,
      needle: true,
      smooth: true,
      severity_mode: "thresholds",
      value_position: "below_pin",
      label_position: "lower",
      glow: false,
      arc_style: "standard",
      show_ticks: false,
      led_segments: 10,
      led_segment_gap: 12,
      led_radius: 75,
      show_trend: false,
      show_history: false,
      history_period: 24,
      history_type: "average",
      // led style uses discrete segments around arc
    };
  }

  public static getConfigElement(): HTMLElement {
    return document.createElement("power-gauge-card-editor");
  }

  public setConfig(config: PowerGaugeCardConfig): void {
    if (!config.entity) {
      throw new Error("Entity is required");
    }

    this._config = {
      min: 0,
      max: 10000,
      show_value: true,
      show_icon: true,
      show_labels: true,
      needle: true,
      smooth: true,
      severity_mode: "thresholds",
      value_position: "below_pin",
      label_position: "lower",
      glow: false,
      arc_style: "standard",
      show_ticks: false,
      led_segments: 10,
      led_segment_gap: 12,
      led_radius: 75,
      show_trend: false,
      show_history: false,
      history_period: 24,
      history_type: "average",
      ...config,
    };
  }

  public getCardSize(): number {
    return 3;
  }

  public getGridOptions() {
    return {
      rows: 4,
      columns: 6,
      min_rows: 3,
      max_rows: 5,
    };
  }

  protected updated(changedProperties: Map<string | number | symbol, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('_config') || changedProperties.has('hass')) {
      if (this._config.show_history && !this._historyLoaded) {
        console.log('[HA-Power-Gauge] Fetching history for:', this._config.entity);
        this._fetchHistory();
      }
    }
  }

  private _showHistory(): void {
    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        detail: { entityId: this._config.entity },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _fetchHistory(): void {
    if (!this._config.show_history || this._historyLoaded) return;

    const period = this._config.history_period || 24;
    const start = new Date(Date.now() - period * 60 * 60 * 1000);
    
    console.log('[HA-Power-Gauge] Fetching history for:', this._config.entity);

    // Use REST API instead of WebSocket
    this.hass.callApi('GET', `history/period/${start.toISOString()}?filter_entity_id=${this._config.entity}&minimal_response`)
      .then((response: any[]) => {
        console.log('[HA-Power-Gauge] History response:', response);
        if (response.length > 0 && response[0].length > 0) {
          const states = response[0]
            .map((s: any) => parseFloat(s.state))
            .filter((n: number) => !isNaN(n) && isFinite(n));
          if (states.length > 0) {
            const sum = states.reduce((a: number, b: number) => a + b, 0);
            const avg = sum / states.length;
            const min = Math.min(...states);
            const max = Math.max(...states);
            this._historyData = { average: avg, min, max };
            console.log('[HA-Power-Gauge] History calculated:', this._historyData);
          } else {
            console.log('[HA-Power-Gauge] No valid numeric states in history');
          }
        } else {
          console.log('[HA-Power-Gauge] No history data returned');
        }
        this._historyLoaded = true;
      })
      .catch((error: any) => {
        console.error('[HA-Power-Gauge] History fetch failed:', error);
        this._historyLoaded = true;
      });
  }

  private get _stateObj() {
    return this.hass?.states?.[this._config.entity];
  }

  private get _numericValue(): number {
    const raw = this._stateObj?.state;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  private get _unit(): string {
    return this._config.unit || this._stateObj?.attributes?.unit_of_measurement || "W";
  }

  private getArcStyle(): { width: number; dasharray?: string } {
    const style = this._config.arc_style || "standard";
    switch (style) {
      case "thin":
        return { width: 6 };
      case "standard":
        return { width: 12 };
      case "thick":
        return { width: 18 };
      case "dotted":
        return { width: 12, dasharray: "4,4" };
      case "dashed":
        return { width: 12, dasharray: "8,8" };
      case "led":
        return { width: 12 };
      default:
        return { width: 12 };
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  private describeArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ): string {
    const start = this.polarToCartesian(cx, cy, r, endAngle);
    const end = this.polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      start.x,
      start.y,
      "A",
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  }

  private valueToAngle(value: number, min: number, max: number): number {
    const pct = (value - min) / (max - min || 1);
    return -120 + pct * 240;
  }

  private bandArc(from: number, to: number, colorVar: string, width: number, dasharray?: string): SVGTemplateResult {
    const min = this._config.min ?? 0;
    const max = this._config.max ?? 100;
    const safeFrom = this.clamp(from, min, max);
    const safeTo = this.clamp(to, min, max);
    const a1 = this.valueToAngle(safeFrom, min, max);
    const a2 = this.valueToAngle(safeTo, min, max);

    return svg`
      <path
        d=${this.describeArc(110, 110, 84, a1, a2)}
        stroke=${`var(${colorVar})`}
        stroke-width=${width}
        fill="none"
        stroke-linecap="round"
        stroke-dasharray=${dasharray || "none"}
      />
    `;
  }

  private renderTicks(): SVGTemplateResult[] {
    if (!this._config.show_ticks) return [];

    const ticks: SVGTemplateResult[] = [];
    const angles = [-120, -90, -60, -30, 0, 30, 60, 90, 120];

    for (const angle of angles) {
      const inner = this.polarToCartesian(110, 110, 84, angle);
      const outer = this.polarToCartesian(110, 110, 94, angle);

      ticks.push(svg`
        <line
          x1=${inner.x}
          y1=${inner.y}
          x2=${outer.x}
          y2=${outer.y}
          stroke="var(--divider-color)"
          stroke-width="2"
          stroke-linecap="round"
        />
      `);
    }

    return ticks;
  }

  private renderLedSegments(): SVGTemplateResult[] {
    const min = this._config.min ?? 0;
    const max = this._config.max ?? 100;
    const value = this.clamp(this._numericValue, min, max);
    const segments = this._config.led_segments && this._config.led_segments > 0 ? this._config.led_segments : 8;
    const segmentGap = this._config.led_segment_gap != null ? this._config.led_segment_gap : 1.2;
    const ledRadius = this._config.led_radius && this._config.led_radius > 0 ? this._config.led_radius : 84;
    const segmentAngle = 240 / segments;
    const arcStyle = this.getArcStyle();

    const leds: SVGTemplateResult[] = [];

    for (let i = 0; i < segments; i++) {
      const segmentValue = min + ((i + 0.5) * (max - min)) / segments;
      const startAngle = -120 + i * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      const finishAngle = endAngle - segmentGap; // small gap between segments

      const isOn = segmentValue <= value;
      const segmentColor = isOn ? this.currentColor(segmentValue) : "var(--divider-color)";

      leds.push(svg`
        <path
          d=${this.describeArc(110, 110, ledRadius, startAngle, finishAngle)}
          stroke=${segmentColor}
          stroke-width=${arcStyle.width}
          fill="none"
          stroke-linecap="round"
          stroke-dasharray="none"
          opacity=${isOn ? 1 : 0.25}
        />
      `);
    }

    return leds;
  }

  private renderBands(): SVGTemplateResult[] {
    if (this._config.severity_mode !== "bands") return [];

    const arcStyle = this.getArcStyle();
    const out: SVGTemplateResult[] = [];

    if (
      this._config.green_from !== undefined &&
      this._config.green_to !== undefined
    ) {
      out.push(this.bandArc(this._config.green_from, this._config.green_to, "--success-color", arcStyle.width, arcStyle.dasharray));
    }

    if (
      this._config.amber_from !== undefined &&
      this._config.amber_to !== undefined
    ) {
      out.push(this.bandArc(this._config.amber_from, this._config.amber_to, "--warning-color", arcStyle.width, arcStyle.dasharray));
    }

    if (
      this._config.red_from !== undefined &&
      this._config.red_to !== undefined
    ) {
      out.push(this.bandArc(this._config.red_from, this._config.red_to, "--error-color", arcStyle.width, arcStyle.dasharray));
    }

    return out;
  }

  private renderHistory(): SVGTemplateResult[] {
    if (!this._config.show_history) return [];

    const min = this._config.min ?? 0;
    const max = this._config.max ?? 100;
    const out: SVGTemplateResult[] = [];

    let histValue: number;
    if (this._historyData) {
      const type = this._config.history_type || "average";
      histValue = this._historyData[type as keyof typeof this._historyData] as number;
    } else {
      // Test dot at 50% if no data yet
      histValue = (min + max) / 2;
    }

    const histAngle = this.valueToAngle(histValue, min, max);
    const histPos = this.polarToCartesian(110, 110, 94, histAngle); // outer radius

    out.push(svg`
      <circle
        cx=${histPos.x}
        cy=${histPos.y}
        r="6"
        fill=${this._historyData ? "var(--accent-color)" : "red"}
        stroke="var(--card-background-color)"
        stroke-width="2"
        opacity="0.8"
      />
    `);

    return out;
  }

  private currentColor(value: number): string {
    if (this._config.severity_mode === "bands") {
      const inRange = (a?: number, b?: number) =>
        a !== undefined && b !== undefined && value >= a && value <= b;

      if (inRange(this._config.red_from, this._config.red_to)) {
        return "var(--error-color)";
      }
      if (inRange(this._config.amber_from, this._config.amber_to)) {
        return "var(--warning-color)";
      }
      if (inRange(this._config.green_from, this._config.green_to)) {
        return "var(--success-color)";
      }
    }

    if (this._config.critical !== undefined && value >= this._config.critical) {
      return "var(--error-color)";
    }
    if (this._config.warning !== undefined && value >= this._config.warning) {
      return "var(--warning-color)";
    }
    return "var(--success-color)";
  }

  private renderGauge(): SVGTemplateResult {
    const min = this._config.min ?? 0;
    const max = this._config.max ?? 100;
    const value = this.clamp(this._numericValue, min, max);
    const angle = this.valueToAngle(value, min, max);
    const currentArc = this.describeArc(110, 110, 84, -120, angle);
    const color = this.currentColor(value);
    const needleEnd = this.polarToCartesian(110, 110, 72, angle);
    const arcStyle = this.getArcStyle();

    const labelLower = this._config.label_position === "lower";

    const minLabelX = labelLower ? 10 : 28;
    const minLabelY = labelLower ? 160 : 122;
    const maxLabelX = labelLower ? 205 : 192;
    const maxLabelY = labelLower ? 160 : 122;

    const valueBelowPin = this._config.value_position === "below_pin";
    const valueX = 110;
    const valueY = valueBelowPin ? 145 : 92;
    const unitX = 110;
    const unitY = valueBelowPin ? 160 : 114;

    return svg`
      <svg class="gauge" viewBox="0 0 220 160" @click=${this._showHistory}>
        ${this._config.glow ? svg`<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox"><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` : svg``}

        ${this.renderHistory()}

        ${this._config.arc_style === "led" ? this.renderLedSegments() : svg`
          <path
            d=${this.describeArc(110, 110, 84, -120, 120)}
            stroke="var(--divider-color)"
            stroke-width=${arcStyle.width}
            fill="none"
            stroke-linecap="round"
            stroke-dasharray=${arcStyle.dasharray || "none"}
          />

          ${this.renderTicks()}

          ${this.renderBands()}
        `}

        ${this._config.arc_style === "led" ? svg`` : svg`
          <path
            d=${currentArc}
            stroke=${color}
            stroke-width=${arcStyle.width}
            fill="none"
            stroke-linecap="round"
            style=${this._config.smooth ? "transition: all 0.4s ease;" : ""}
            filter=${this._config.glow ? "url(#glow)" : ""}
            stroke-dasharray=${arcStyle.dasharray || "none"}
          />
        `}

        ${
          this._config.needle && this._config.arc_style !== "led"
            ? svg`
                <line
                  x1="110"
                  y1="110"
                  x2=${needleEnd.x}
                  y2=${needleEnd.y}
                  stroke=${color}
                  stroke-width="4"
                  stroke-linecap="round"
                  style=${this._config.smooth ? "transition: all 0.4s ease;" : ""}
                  filter=${this._config.glow ? "url(#glow)" : ""}
                />
                <circle cx="110" cy="110" r="6" fill=${color} filter=${this._config.glow ? "url(#glow)" : ""}></circle>
              `
            : svg``
        }

        ${
          this._config.show_value
            ? svg`
                <text x=${valueX} y=${valueY} text-anchor="middle" class="value">
                  ${Math.round(value)}
                </text>
                <text x=${unitX} y=${unitY} text-anchor="middle" class="sub">
                  ${this._unit}
                </text>
                ${
                  this._config.show_trend && this._trendVisible
                    ? svg`<text x=${valueX + 50} y=${valueY} text-anchor="middle" class="value" fill="var(--state-icon-color)">
                        ${this._trend === 'up' ? '▲' : '▼'}
                      </text>`
                    : svg``
                }
              `
            : svg``
        }

        ${
          this._config.show_labels
            ? svg`
                <text x=${minLabelX} y=${minLabelY} text-anchor="middle" class="label">${min}</text>
                <text x=${maxLabelX} y=${maxLabelY} text-anchor="middle" class="label">${max}</text>
              `
            : svg``
        }
      </svg>
    `;
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) return html``;

    const stateObj = this._stateObj;

    if (!stateObj) {
      return html`
        <ha-card>
          <div class="wrap">
            <div class="title">Entity not found</div>
            <div>${this._config.entity}</div>
          </div>
        </ha-card>
      `;
    }

    // Calculate trend
    const current = this._numericValue;
    if (this._previousValue !== undefined) {
      const diff = current - this._previousValue;
      if (Math.abs(diff) >= 0.01) {
        const newTrend = diff > 0 ? 'up' : 'down';
        if (newTrend !== this._trend) {
          this._trend = newTrend;
          this._trendVisible = true;
          setTimeout(() => {
            this._trendVisible = false;
          }, 10000);
        }
      }
    }
    this._previousValue = current;

    const title =
      this._config.title ||
      stateObj.attributes.friendly_name ||
      "Power";

    return html`
      <ha-card>
        <div class="wrap">
          <div class="header">
            <div class="title-wrap">
              <div class="title">${title}</div>
            </div>
            ${
              this._config.show_icon
                ? html`<ha-icon class="icon" .icon=${this._config.icon || "mdi:flash"}></ha-icon>`
                : html``
            }
          </div>

          ${this.renderGauge()}
        </div>
      </ha-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-power-gauge-card": HaPowerGaugeCard;
  }

  interface Window {
    customCards: Array<Record<string, unknown>>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-power-gauge-card",
  name: "Power Gauge Card",
  description: "A configurable gauge card for power consumption",
  preview: true,
});