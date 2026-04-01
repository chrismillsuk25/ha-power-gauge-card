# Power Gauge Card

A production-ready custom Home Assistant Lovelace card for **power consumption** with:

- smooth animated SVG gauge
- thresholds or colour bands
- optional needle
- visual config editor in the HA UI
- HACS-ready packaging
- tap, hold, and double-tap action support

## Features

- Clean Home Assistant look and feel
- Works with power sensors such as `sensor.house_power`
- Auto-formats large watt values into kW
- Supports visual setup from the dashboard editor
- Manual install or HACS custom repository install

## Repo structure

```text
ha-power-gauge-card/
├─ src/
│  ├─ ha-power-gauge-card.ts
│  ├─ power-gauge-editor.ts
│  ├─ helpers.ts
│  └─ types.ts
├─ .github/workflows/release.yml
├─ CHANGELOG.md
├─ hacs.json
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

## Build

```bash
npm install
npm run build
```

Built output:

```text
dist/ha-power-gauge-card.js
```

## Manual install

Copy the built file to your Home Assistant `www` folder:

```text
/config/www/ha-power-gauge-card.js
```

Add the dashboard resource:

```yaml
url: /local/ha-power-gauge-card.js
type: module
```

Then add the card:

```yaml
type: custom:ha-power-gauge-card
entity: sensor.house_power
title: House Load
min: 0
max: 7000
warning: 3500
critical: 5500
needle: true
show_icon: true
show_value: true
show_labels: true
```

## HACS install

1. Push this repo to GitHub
2. Create a GitHub release
3. In HACS add it as a custom frontend repository
4. Install it and reload Home Assistant
5. Add the dashboard resource if HACS does not do it automatically in your setup

## UI editor

This card includes a visual editor. In Home Assistant:

1. Edit dashboard
2. Add card
3. Choose **Custom: Power Gauge Card**
4. Select entity and configure options in the UI

## Example configs

### Threshold mode

```yaml
type: custom:ha-power-gauge-card
entity: sensor.house_power
title: Main Load
min: 0
max: 8000
warning: 4000
critical: 6500
severity_mode: thresholds
needle: false
```

### Band mode

```yaml
type: custom:ha-power-gauge-card
entity: sensor.solar_export
title: Solar Export
min: 0
max: 5000
severity_mode: bands
green_from: 0
green_to: 1500
amber_from: 1501
amber_to: 3000
red_from: 3001
red_to: 5000
needle: true
```

## Tap actions

```yaml
type: custom:ha-power-gauge-card
entity: sensor.house_power
tap_action:
  action: more-info
hold_action:
  action: navigate
  navigation_path: /energy
double_tap_action:
  action: url
  url_path: https://example.com
```

## Notes

- Replace the GitHub repository URL in `package.json`
- Update `author`, license ownership, and release workflow to match your GitHub account
- If you want richer editor support for actions, add dedicated editor fields for them later

## Development workflow

```bash
npm install
npm run dev
```

Then symlink or copy the output file into your HA `/config/www/` folder and refresh the browser.

## Suggested next upgrades

- icon picker in the visual editor
- action editor in the visual editor
- radial gradient fills
- compact and hero layouts
- peak marker and historical sparkline
- configurable decimal places
