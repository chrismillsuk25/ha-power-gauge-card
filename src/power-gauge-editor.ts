import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { PowerGaugeCardConfig } from "./ha-power-gauge-card";

@customElement("power-gauge-card-editor")
export class PowerGaugeCardEditor extends LitElement {
  @property({ attribute: false }) public hass: any;
  @state() private _config: Partial<PowerGaugeCardConfig> = {};

  static styles = css`
    :host {
      display: block;
    }

    .help {
      margin-top: 12px;
      color: var(--secondary-text-color);
      font-size: 0.9rem;
      line-height: 1.4;
    }
  `;

  public setConfig(config: PowerGaugeCardConfig): void {
    this._config = { ...config };
  }

  private _schema() {
    const severityMode = this._config.severity_mode ?? "thresholds";

    const schema: any[] = [
      {
        name: "entity",
        label: "Power sensor",
        selector: {
          entity: {
            domain: "sensor",
          },
        },
      },
      {
        name: "title",
        label: "Title",
        selector: {
          text: {},
        },
      },
      {
        name: "unit",
        label: "Unit override",
        selector: {
          text: {},
        },
      },
      {
        type: "grid",
        name: "",
        schema: [
          {
            name: "min",
            label: "Min",
            selector: {
              number: {
                mode: "box",
              },
            },
          },
          {
            name: "max",
            label: "Max",
            selector: {
              number: {
                mode: "box",
              },
            },
          },
        ],
      },
      {
        name: "severity_mode",
        label: "Severity mode",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "thresholds", label: "Thresholds" },
              { value: "bands", label: "Bands" },
            ],
          },
        },
      },
    ];

    if (severityMode === "thresholds") {
      schema.push({
        type: "grid",
        name: "",
        schema: [
          {
            name: "warning",
            label: "Warning threshold",
            selector: {
              number: {
                mode: "box",
              },
            },
          },
          {
            name: "critical",
            label: "Critical threshold",
            selector: {
              number: {
                mode: "box",
              },
            },
          },
        ],
      });
    }

    if (severityMode === "bands") {
      schema.push(
        {
          type: "grid",
          name: "",
          schema: [
            {
              name: "green_from",
              label: "Green from",
              selector: {
                number: { mode: "box" },
              },
            },
            {
              name: "green_to",
              label: "Green to",
              selector: {
                number: { mode: "box" },
              },
            },
          ],
        },
        {
          type: "grid",
          name: "",
          schema: [
            {
              name: "amber_from",
              label: "Amber from",
              selector: {
                number: { mode: "box" },
              },
            },
            {
              name: "amber_to",
              label: "Amber to",
              selector: {
                number: { mode: "box" },
              },
            },
          ],
        },
        {
          type: "grid",
          name: "",
          schema: [
            {
              name: "red_from",
              label: "Red from",
              selector: {
                number: { mode: "box" },
              },
            },
            {
              name: "red_to",
              label: "Red to",
              selector: {
                number: { mode: "box" },
              },
            },
          ],
        }
      );
    }

    schema.push(
      {
        type: "grid",
        name: "",
        schema: [
          {
            name: "show_value",
            label: "Show value",
            selector: {
              boolean: {},
            },
          },
          {
            name: "show_icon",
            label: "Show icon",
            selector: {
              boolean: {},
            },
          },
          {
            name: "show_labels",
            label: "Show labels",
            selector: {
              boolean: {},
            },
          },
          {
            name: "needle",
            label: "Needle",
            selector: {
              boolean: {},
            },
          },
          {
            name: "smooth",
            label: "Smooth animation",
            selector: {
              boolean: {},
            },
          },
          {
            name: "glow",
            label: "Glow effect",
            selector: {
              boolean: {},
            },
          },
          {
            name: "show_ticks",
            label: "Show ticks",
            selector: {
              boolean: {},
            },
          },
          {
            name: "show_trend",
            label: "Show trend icon",
            selector: {
              boolean: {},
            },
          },
          {
            name: "show_history",
            label: "Show historical overlay",
            selector: {
              boolean: {},
            },
          },
          {
            name: "arc_style",
            label: "Arc style",
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "thin", label: "Thin" },
                  { value: "standard", label: "Standard" },
                  { value: "thick", label: "Thick" },
                  { value: "dotted", label: "Dotted" },
                  { value: "dashed", label: "Dashed" },
                  { value: "led", label: "LED segments" },
                ],
              },
            },
          },
        ],
      });

    if (this._config.arc_style === "led") {
      schema.push({
        name: "led_segments",
        label: "LED segments",
        selector: {
          number: {
            min: 4,
            max: 32,
            step: 1,
            mode: "box",
          },
        },
      });
      schema.push({
        name: "led_segment_gap",
        label: "LED segment gap",
        selector: {
          number: {
            min: 0,
            max: 10,
            step: 0.2,
            mode: "box",
          },
        },
      });
      schema.push({
        name: "led_radius",
        label: "LED radius",
        selector: {
          number: {
            min: 20,
            max: 100,
            step: 1,
            mode: "box",
          },
        },
      });
    }

    if (this._config.show_history) {
      schema.push({
        name: "history_period",
        label: "History period (hours)",
        selector: {
          number: {
            min: 1,
            max: 168,
            step: 1,
            mode: "box",
          },
        },
      });
      schema.push({
        name: "history_type",
        label: "History type",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "average", label: "Average" },
              { value: "min", label: "Min" },
              { value: "max", label: "Max" },
            ],
          },
        },
      });
    }

    schema.push(
      {
        name: "value_position",
        label: "Value position",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "center", label: "Center" },
              { value: "below_pin", label: "Below needle pin" },
            ],
          },
        },
      },
      {
        name: "label_position",
        label: "Min/Max label position",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "default", label: "Default" },
              { value: "lower", label: "Lower" },
            ],
          },
        },
      },

    );

    return schema;
  }

  private _onValueChanged(ev: CustomEvent): void {
    const newConfig = {
      ...this._config,
      ...(ev.detail.value || {}),
    };

    this._config = newConfig;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render(): TemplateResult {
    if (!this.hass) return html``;

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._schema()}
        @value-changed=${this._onValueChanged}
      ></ha-form>

      <div class="help">
        Choose <strong>Thresholds</strong> for simple warning/critical behaviour,
        or <strong>Bands</strong> to define exact green, amber, and red ranges.
      </div>
    `;
  }
}