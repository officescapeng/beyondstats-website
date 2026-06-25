# Beyond# Human Security Observatory & Support Portal - Walkthrough

We have successfully designed, built, and integrated the **Nigeria Human Security Dashboard**, the premium **Support & Partnerships** portal, the **Headless WordPress Integration**, and **Dynamic Client-Side Routing** for the **Beyond Statistics Initiative (Beyond#)**.

---

## 1. Directory Structure & Key Files

We implemented a modular and clean React architecture:
1. **[wordpress.js](file:///C:/Users/rilwan.usman.NRS/.gemini/antigravity/scratch/src/services/wordpress.js)**:
   - Headless WordPress REST API service layer with mock fallbacks, caching, keyword matching, and a tag-proximity related posts recommendation engine.
2. **[humanSecurityData.js](file:///C:/Users/rilwan.usman.NRS/.gemini/antigravity/scratch/src/data/humanSecurityData.js)**:
   - Houses the dataset containing 18 indicators across all 36 states and the FCT.
3. **[HumanSecurityDashboard.jsx](file:///C:/Users/rilwan.usman.NRS/.gemini/antigravity/scratch/src/components/HumanSecurityDashboard.jsx)**:
   - Houses the UI layout, choropleth map, gauges, Recharts figures, comparison selectors, and raw exports.
4. **[App.jsx](file:///C:/Users/rilwan.usman.NRS/.gemini/antigravity/scratch/src/App.jsx)**:
   - Houses all pages (About, Programs, Observatory, Partnerships, Research, Impact), the dynamic router, global navigation, global search overlays, and reusable modal views.

---

## 2. Completed Features

### A. Nigeria Human Security Dashboard
- **Dynamic Choropleth Map (Nigeria Map)**: Renders colors based on risk severity levels: Green (Low Risk), Yellow (Moderate), Orange (High Risk), and Red (Critical Risk).
- **Composite Risk Calculations (HSRI)**: Combines weighted indicators into a single score out of 100.
- **Recharts Visualizations**: Compares state performance against national averages.
- **State Comparison Tool**: Displays tabular variance breakdowns and mapping via a radar chart.
- **Weekly Data Synchronization**: Automated weekly sync check persisted in local storage with success/info notifications.
- **FCT ID Resolution**: Resolved FCT mapping mismatch by standardizing ID naming to `'fct'`.

### B. Global Navigation & Re-labeling
- **Donate Label Replacement**: Completely replaced legacy Donate references with "SUPPORT & PARTNERSHIPS" across all navigation menus.
- **Header Navigation**: Changed the main top-right CTA button to "SUPPORT & PARTNERSHIPS", routing users directly to the partnerships portal and styled in brand-compliant green (`#39B54A`).
- **Header Dropdowns & Menu Labels**:
  - Replaced "Program Overview" with **"What We Do"**
  - Replaced "Impact and Values" with **"Our Impact Stories"**
  - Replaced "Interactive Map" with **"Our Impact Map"**
- **Footer Links**: Added a dedicated "Support & Partnerships" quick link in the footer grid.
- **Mobile Menu Overlay**: Updated the list items to include "Support & Partnerships" and replaced the bottom overlay CTA button with the brand green partnerships route.

### C. Premium Support & Partnerships Portal
- **Page Introduction Section**: Features the uppercase tracking-widest green label, the bold Poppins navy heading `"Partner For Evidence. Invest In Impact."`, and supporting copy optimized to a maximum width of 850px.
- **Six Partnership Pathway Cards**:
  - Strategic Partnerships (Handshake icon)
  - Research Sponsorship (FileSearch icon)
  - Human Security Observatory (BarChart3 icon)
  - Corporate Social Impact (Building2 icon)
  - Youth Data Fellows (GraduationCap icon)
  - Technical Contributions (Users icon)
  - *Intake Linkage*: Clicking any pathway card CTA automatically scrolls the visitor down to the secretariat intake form and pre-selects the pathway interest.
- **Interactive Support Box (Subsection)**:
  - Avoids traditional charity donation layouts, using professional international think-tank aesthetics.
  - Interactive switches for support frequency: *One-Time*, *Monthly*, and *Annual*.
  - Next-gen secure payment simulator with transaction success receipt output.
- **"Why Partner" Split-Layout**:
  - Left: Showcases the secretariat-led collaboration image (`public/nigerian_stakeholders.png`).
  - Right: Displays 6 checkmarked credibility cards outlining Beyond#'s core values.
- **Current & Future Partners Logo Showcase**:
  - Horizontal filter tabs to filter by institution type (Foundations, Government, Dev Partners, etc.).
- **Transparency & Accountability**:
  - Lists Annual Reports, Financial Audits, Research Publications, and Organizational Policies.
  - Clicking any report triggers a simulated glassmorphic document download loading modal with progress percentages.
- **Our Values Section (About Page)**:
  - Added a premium, grid-based "OUR VALUES" section outlining Beyond#'s 5 core guiding principles: *Credibility & Rigor*, *Human-Centered*, *Strategic Collaboration*, *Actionability*, and *Accountability & Trust*.

### D. Headless WordPress Content Management Integration
- **WordPress API Service Layer (`src/services/wordpress.js`)**:
  - Setup rich mock database matching nested WordPress JSON schema structures for articles, publications, and projects.
- **Dynamic Homepage News Carousel**:
  - Fetches the latest 5 posts from WordPress dynamically.
- **Dynamic Insights & Impact Portal (`ImpactPage`)**:
  - Wired live REST queries supporting keyword search, category filters, sorting (newest, oldest, most-viewed), and pagination.
- **Dynamic Publications Library (`ResearchPage`)**:
  - Refactored from static content to a fully interactive database fetching from `fetchPublications()`.
  - Supports keyword search and filters for **Publication Type**, **Year**, **Topic Area**, and **State Coverage** with real-time download tracking.
- **Immersive Global Search Modal**:
  - Fullscreen blur overlay modal (`GlobalSearchModal`) triggered from headers.
  - Grouped matches: *Articles*, *Publications*, and *Projects* (with geolocation and impact statistics).
- **Reusable Global Reader View (`ArticleReaderModal`)**:
  - Renders HTML article contents safely and recommends 3 related posts calculated via tag-proximity.

### E. Dynamic Client-Side Browser Routing
- **HTML5 History API**: Wrapped the router's state transitions with `window.history.pushState` to dynamically update the browser's address bar (e.g. `/about`, `/research`, `/partnerships`) during navigation.
- **Browser Back & Forward Navigation**: Subscribed to browser `popstate` events to handle history navigation, enabling full support for the browser's Back and Forward buttons.
- **Direct Entry Linking**: Added route resolution on page mount, allowing users to navigate directly to subpage URLs (e.g., typing `/research` in the browser) and have the correct page mount instantly.
- **Cloudflare SPA 404 Fallback**: Built a cross-platform compilation script to copy `index.html` to `404.html` during compilation, ensuring that direct URL entry routing resolves seamlessly on Cloudflare Workers/Pages without redirect errors or infinite loops.

---

## 3. Verification & Build Results

The application compiles with zero warnings or errors.

* **Build Command**: `npm run build`
* **Vite Compiler Status**: **Successful (exit code 0)**

### Production Output
- **HTML Document**: `dist/index.html` (1.08 kB)
- **Fallback Page**: `dist/404.html` (1.08 kB)
- **CSS Stylesheet**: `dist/assets/index-DZJMIljC.css` (67.73 kB)
- **JS Bundle**: `dist/assets/index-D86XJZvy.js` (1,086.05 kB)
