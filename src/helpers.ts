import type { ActionConfig, HomeAssistant } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

export function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}

export function valueToAngle(value: number, min: number, max: number): number {
  const span = max - min || 1;
  const percent = (value - min) / span;
  return -120 + percent * 240;
}

export function formatValue(value: number, unit: string): string {
  if (unit.toLowerCase() === "w" && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)} kW`;
  }
  return `${Math.round(value)} ${unit}`;
}

export async function handleAction(
  element: HTMLElement,
  hass: HomeAssistant,
  entityId: string,
  config?: ActionConfig
): Promise<void> {
  const action = config?.action ?? "more-info";

  switch (action) {
    case "none":
      return;
    case "more-info": {
      element.dispatchEvent(
        new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId }
        })
      );
      return;
    }
    case "navigate": {
      if (!config?.navigation_path) return;
      window.history.pushState(null, "", config.navigation_path);
      window.dispatchEvent(new Event("location-changed"));
      return;
    }
    case "url": {
      if (!config?.url_path) return;
      window.open(config.url_path, "_blank", "noopener");
      return;
    }
    case "toggle": {
      const [domain] = entityId.split(".");
      await hass.callService(domain, "toggle", { entity_id: entityId });
      return;
    }
  }
}
