# Euti-Challenges

A security training platform with 3 deliberately vulnerable web applications. Each challenge is a self-contained Node.js app with a different theme, difficulty, and testing approach.

Built for hands-on pentesting and CTF practice. Use Burp Suite.

## Quick Start

```bash
git clone https://github.com/PahutieEutiphron/Euti-Challenges.git
cd Euti-Challenges
npm run install-all
node launcher.js
```

Open **http://localhost:9000** - the hub lets you deploy and manage each challenge.

## Challenges

### EutiForge - Creative Services Marketplace
- **Port:** 3000
- **Difficulty:** Medium
- **Type:** Realistic Pentest
- **Goal:** Gain admin access. Document every vulnerability you find along the way.
- **Resources:** Wordlists provided in `challenges/eutiforge/data/`

### EutiMart - Premium Tech Store
- **Port:** 4000
- **Difficulty:** Medium-Hard
- **Type:** Capture The Flag
- **Goal:** Find all 4 hidden flags in the format `FLAG{...}`

### EutiBites - Recipe Sharing Community
- **Port:** 5000
- **Difficulty:** Easy-Medium
- **Type:** Vulnerability Assessment
- **Goal:** This app was modeled after a real-world pentest engagement. Identify as many security issues as you can and write them up.

## Requirements

- [Node.js](https://nodejs.org/) v16+
- An intercepting proxy (Burp Suite recommended)
- A browser

## How It Works

The launcher (`node launcher.js`) serves a hub UI on port 9000. From there you can start and stop individual challenges. Each runs in its own process on a dedicated port.

You can also run challenges standalone:

```bash
cd challenges/eutiforge && npm install && node server.js    # port 3000
cd challenges/eutimart && npm install && npm start           # port 4000
cd challenges/eutibites && npm install && node server.js     # port 5000
```

## Guidelines

- Use AI tools to help you **learn**, not to solve challenges for you
- Document findings like a real pentest report: description, location, reproduction steps, impact
- Don't just test the obvious - explore every feature, endpoint, and header
- If something blocks you, think about whether the block is actually enforced

## Disclaimer

These applications are **intentionally vulnerable**. They are designed for educational purposes and authorized security training only. Do not deploy on any public or production server.

## License

MIT
