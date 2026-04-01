export interface ActionConfig {
  action?: "more-info" | "navigate" | "url" | "toggle" | "none";
  navigation_path?: string;
  url_path?: string;
}

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
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface HomeAssistant {
  states: Record<string, any>;
  callService(domain: string, service: string, data?: Record<string, any>): Promise<void>;
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: PowerGaugeCardConfig): void;
}
