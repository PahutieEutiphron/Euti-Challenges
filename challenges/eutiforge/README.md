# EutiForge - Web Security Assessment Challenge

EutiForge is a deliberately vulnerable web application built to practice real-world web penetration testing. It's a creative services marketplace where users can request custom work from creators, and it has security flaws hidden throughout.

This is **not** a CTF. There are no flags. The vulnerabilities are designed to mirror what you'd actually find during a web application pentest.

## Setup

### Option 1: Node.js

Requires [Node.js](https://nodejs.org/) v18+.

```bash
git clone <repo-url>
cd eutiforge
npm install
node generate-wordlists.js
node server.js
```

### Option 2: Docker

```bash
git clone <repo-url>
cd eutiforge
docker-compose up --build
```

The app runs on **http://localhost:3000**

## The Challenge

**Goal: Gain access to an admin account. Find as many vulnerabilities as possible while doing so.**

You are provided with:
- The running application
- `data/usernames.txt` — a list of 100 email addresses
- `data/passwords.txt` — a list of 500 passwords

Use **Burp Suite** as your proxy. Inspect every request and response carefully.

## Guidelines

- You may use AI tools to help you learn and brainstorm, but understand what you're doing.
- Take notes on everything you find, even if you're not sure it's a vulnerability.
- Don't just test the login page. Explore the entire application.
- Pay attention to how the application handles different roles and permissions.
- Look at what the server sends back, not just what the page shows you.
- If something blocks you, think about whether the block is enforced where it should be.

## Vulnerability Checklist

Here's a list of common web vulnerabilities to look for during your assessment. Not all of these are present in the application — part of the challenge is figuring out which ones are.

- [ ] SQL Injection (SQLi)
- [ ] Cross-Site Scripting (XSS) — Reflected, Stored, or DOM-based
- [ ] Cross-Site Request Forgery (CSRF)
- [ ] Broken Authentication / Brute Force
- [ ] Rate Limiting Bypass
- [ ] Username Enumeration
- [ ] Insecure Direct Object Reference (IDOR)
- [ ] Broken Object Level Authorization (BOLA)
- [ ] Broken Function Level Authorization (BFLA)
- [ ] Mass Assignment
- [ ] Privilege Escalation (Horizontal / Vertical)
- [ ] Insecure Password Reset Flow
- [ ] Insecure Password Change (missing old password verification)
- [ ] JWT Token Manipulation / Signature Bypass
- [ ] Server-Side Request Forgery (SSRF)
- [ ] Information Disclosure (verbose errors, headers, stack traces)
- [ ] Directory Traversal / Path Traversal
- [ ] Security Misconfiguration
- [ ] Missing Access Controls on API Endpoints
- [ ] Client-Side Validation Bypass
- [ ] Parameter Tampering

## Reporting

If you're using this as a training exercise, document your findings like a real pentest report:

1. Every vulnerability or security issue you identified
2. For each finding: what it is, where it is, how to reproduce it, and the impact
3. The steps you took to achieve admin access (if you got there)
4. Screenshots or Burp logs as evidence

Good luck.
