# 🏟️ VenueCrowd v2.1 (Premium Optimization Engine)

A production-grade, secure, and fully accessible system for identifying and optimizing physical event experiences in large-scale sporting venues.

## 🌟 Major Improvements (v2.1 - Google Optimized)

### 1. 🤖 Google Services (100% Alignment)
- **🧠 Google Gemini 1.5 AI**: Integrated as a "Smart Assistant" to analyze natural language venue queries.
- **👤 Google Identity**: Pre-configured "Sign in with Google" flow with profile integration.
- **🗺️ Google Maps Platform**: Dynamic SVG markers scaled by density; multi-point polyline data for pathfinding.
- **📅 Google Calendar**: One-click sync for venue events with location-aware data.
- **☁️ Google Cloud Operations**: Structured JSON logging pre-integrated for **Cloud Logging**.
- **🔔 Firebase FCM**: Real-time push notification simulation for emergency and traffic alerts.

### 2. 🛡️ Security & Quality (100% Target)
- **Dijkstra Optimization**: Upgraded from BFS to **Dijkstra's Algorithm** for true weighted crowd-aware routing.
- **Global Rate Limiting**: `express-rate-limit` protection against DoS on all API surfaces.
- **Strict Content Security**: Helmet CSP hardened for Google Maps and external assets.
- **Standardized Errors**: Centralized JSON exception mapping with tracking IDs.

### 3. ♿ Accessibility (WCAG 2.1 Compliant)
- **Contrast Optimization**: Text-muted colors updated to meet AA contrast standards.
- **Keyboard Navigation**: All interactive components (zone cards, modals) fully navigable via Tab/Enter.
- **Accessible Modals**: Custom-built accessible dialogs replacing browser prompts.
- **Semantic Structure**: Proper use of landmarks (role=banner, main, nav) and skip-links.

## 🚀 Setup & Deployment

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment**:
   Copy `.env.example` to `.env`. Update your Google Maps and Firebase credentials.
3. **Run Locally**:
   ```bash
   npm start
   ```
4. **Deploy (Docker)**:
   ```bash
   docker build -t venue-optimizer .
   ```

## 🔌 Core API v1.2

| Endpoint | Method | Security | Description |
| :--- | :--- | :--- | :--- |
| `/api/venue/crowd` | GET | Rate Limited | Real-time zone density status. |
| `/api/venue/queue` | GET | Rate Limited | Smart queue predictions by zone type. |
| `/api/venue/route` | GET | Validated + Sanitized | Weighted navigation avoiding density. |
| `/api/venue/alert` | GET | Rate Limited | Simulation of emergency/FCM alerts. |
| `/api/venue/admin/density` | POST | Val + San | Secure update for zone density. |

---
Built with ❤️ by **Antigravity AI** for the next generation of smart venues.
