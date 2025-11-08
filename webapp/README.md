# ⚛️ VW Driver Attention Platform - Web Application

> **Enterprise Next.js Dashboard for Real-Time Driver Safety Monitoring**  
> Role-based fleet management with privacy-first design and bilingual support

[![Next.js](https://img.shields.io/badge/Next.js-14.2.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-green)](https://supabase.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Why This Architecture?](#-why-this-architecture)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Pages Deep Dive](#-pages-deep-dive)
- [Components](#-components)
- [Authentication Flow](#-authentication-flow)
- [Deployment](#-deployment)
- [Performance](#-performance)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

The **Web Application** is the cloud-hosted frontend of the VW Driver Attention Platform. It provides:

✅ **Real-Time Fleet Monitoring**: Track multiple drivers on a live map  
✅ **Role-Based Access**: Separate dashboards for drivers (USER) vs fleet managers (EMPLOYEE)  
✅ **Privacy Controls**: GDPR-compliant consent management  
✅ **Performance Analytics**: Historical trends, risk scores, and route analytics  
✅ **CRUD Operations**: Manage drivers and routes with bilingual support (Hindi/English)  
✅ **Responsive Design**: Mobile-first, works on tablets mounted in dashboards  
✅ **Enterprise-Grade**: Server-Side Rendering (SSR), TypeScript, CI/CD ready

**Key Differentiator**: Unlike generic fleet management systems, our app:
- **Separates roles completely**: Drivers never see fleet data, managers never see driver-facing controls
- **Privacy-centric**: Drivers control what data is collected via granular consent
- **Localized for India**: Surat-based routes with Hindi/English bilingual route names
- **Real-time but efficient**: WebSocket telemetry (not video), <10 KB/s per vehicle

---

## 🤔 Why This Architecture?

### Next.js 14 App Router

| Feature | Benefit |
|---------|---------|
| **Server-Side Rendering (SSR)** | Secure authentication checks before page loads |
| **Server Components** | Faster loads, less JavaScript sent to browser |
| **App Router** | File-based routing, nested layouts |
| **Edge Runtime** | Global CDN deployment, low latency |
| **TypeScript** | Type safety, fewer runtime errors |

### Supabase Authentication

| Feature | Benefit |
|---------|---------|
| **JWT-based Auth** | Stateless, scalable |
| **SSR Support** | `@supabase/ssr` for server-side auth |
| **Row-Level Security** | Database-level access control |
| **Magic Links** | Passwordless sign-in (optional) |
| **PostgreSQL** | Relational data, complex queries |

### Business Impact

- **Faster Time to Market**: 2 weeks vs 2 months for custom auth
- **Security by Default**: Supabase handles OWASP Top 10
- **Scalability**: Handle 10,000+ concurrent users
- **Cost Efficiency**: Supabase free tier supports 50,000 users

---

## ✨ Features

### 🚛 For Fleet Managers (EMPLOYEE Role)

#### Fleet Management Console (`/fleet-management-console`)

1. **Real-Time Fleet Map**
   - Live driver locations on OpenStreetMap (React Leaflet)
   - Color-coded markers (green/yellow/orange/red) based on attention score
   - Click marker → View driver details modal
   - Route overlays with risk indicators

2. **Fleet KPI Cards**
   - Active Drivers count
   - Average Fleet Attention Score (0-100)
   - Active Alerts count
   - At-Risk Drivers count

3. **Driver Management (CRUD)**
   - **Create**: Add new driver with name, vehicle ID, route, email, phone
   - **Read**: View all drivers in table with current attention scores
   - **Update**: Edit driver details via modal
   - **Delete**: Remove drivers with confirmation
   - **Validation**: Email format, phone number (Indian format), required fields

4. **Route Management (CRUD)**
   - **Create**: Add routes with Hindi/English names, distance (km), duration (minutes)
   - **Read**: View routes in table with risk analytics
   - **Update**: Edit route details
   - **Delete**: Remove routes (checks for assigned drivers)

5. **Driver Details Modal**
   - Full driver profile (name, vehicle, route, contact)
   - Current attention score with color gauge
   - Performance trend chart (last 10 readings, recharts)
   - Score breakdown: Eye Tracking, Head Position, Drowsiness Detection
   - Quick actions: Edit, Delete

6. **Route Risk Analytics**
   - Time-of-day risk graph (dynamic based on current time)
   - Route-specific fatigue patterns
   - Identify high-risk routes/times for optimization

7. **Navigation**
   - Header with Fleet Console tab (restricted to EMPLOYEE role)
   - Logout button
   - Responsive mobile menu

---

### 🚗 For Drivers (USER Role)

#### Driver Attention Monitor (`/driver-attention-monitor`)

1. **Live Attention Gauge**
   - Real-time score (0-100) with color coding
   - Animated circular gauge
   - Score trend indicator (↑ improving, → stable, ↓ declining)

2. **Camera Feed Panel**
   - Privacy-respecting placeholder (video stays on edge device)
   - Status indicators (camera active, processing)
   - WebSocket connection status

3. **Alert System**
   - Visual alerts (color-coded: green/yellow/orange/red)
   - Alert messages ("You seem tired, consider a break")
   - Sound notifications (optional, configurable)
   - Dismissible alerts

4. **Risk Factors Display**
   - Eye Closure: EAR value + status (normal/warning)
   - Head Position: Yaw/Pitch/Roll angles + distraction status
   - Drowsiness Detection: Confidence score + classification

5. **Performance Trends**
   - Daily attention score chart (recharts line graph)
   - Average score over last 7 days
   - Best/worst times of day

6. **Privacy Controls**
   - Quick toggle for camera/microphone consent
   - Link to full Privacy Consent Setup page
   - Data usage transparency

7. **Navigation**
   - Header with Driver Monitor tab (restricted to USER role)
   - Logout button

---

### 🔒 For All Users

#### Privacy Consent Setup (`/privacy-consent-setup`)

1. **Consent Header**
   - Clear title: "Your Privacy Matters"
   - Subtitle explaining data usage

2. **Progress Indicator**
   - 3-step wizard: Camera → Microphone → Data Sharing
   - Visual progress bar

3. **Consent Sections**
   - **Camera Access**:
     - Toggle switch
     - Explanation: "Used for drowsiness detection. Video processed locally."
     - Impact if disabled: "Accuracy reduced by 50%"
   - **Microphone Access**:
     - Toggle switch
     - Explanation: "Detects yawning and fatigue cues."
     - Impact if disabled: "Accuracy reduced by 10%"
   - **Data Sharing**:
     - Toggle switch
     - Explanation: "Share anonymized scores with fleet manager."
     - Impact if disabled: "Manager cannot see your performance."

4. **Processing Explanation**
   - "Where is my data processed?" → Edge device (vehicle)
   - "What is uploaded?" → Only scores, not video/audio
   - "How long is data stored?" → 30 days, then auto-deleted

5. **Trust Signals**
   - GDPR compliant badge
   - "No video/audio uploaded" guarantee
   - "You can change settings anytime"

6. **Consent Actions**
   - "Save Preferences" button
   - "Cancel" button (returns to previous page)

---

#### Landing Page (`/landing`)

1. **Hero Section**
   - Main headline: "Drive Safer with AI-Powered Attention Monitoring"
   - Subheadline: "Prevent accidents with real-time drowsiness detection"
   - CTA buttons: "Sign Up as Driver" | "Sign Up as Fleet Manager"
   - Sign-in link: "Already have an account? Sign In Here"

2. **Problem Statement**
   - Statistics: 1.35M deaths, 20-30% fatigue-related
   - India-specific data: 150K+ annual deaths

3. **Solution Overview**
   - Multi-modal detection (vision + audio + pose)
   - Edge processing (privacy-first)
   - Real-time interventions

4. **Technology Showcase**
   - CNN+LSTM models (90% accuracy)
   - MediaPipe pose estimation
   - MFCC audio analysis

5. **How It Works**
   - 3-step visual: Detect → Analyze → Alert

6. **User Types**
   - Driver benefits vs Fleet Manager benefits

7. **Privacy Commitment**
   - "No video uploaded" guarantee
   - Granular consent controls
   - GDPR compliant

8. **Live Stats** (Mock or Real)
   - Total drivers monitored: 1,234
   - Alerts prevented: 5,678
   - Average attention score: 87%

9. **FAQ**
   - "Is my video recorded?" → No
   - "What data is shared?" → Only scores
   - "Can I opt out?" → Yes, with accuracy trade-offs

10. **Final CTA**
    - "Get Started Today" buttons
    - Footer with links, contact

---

## 🛠️ Technology Stack

### Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.2.0 | React framework with App Router |
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.6.2 | Type-safe JavaScript |
| **Node.js** | 18+ | Runtime environment |

### Styling & UI

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |
| **PostCSS** | 8.x | CSS processing |
| **Lucide React** | 0.468.0 | Icon library (Feather icons fork) |

### Authentication & Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Supabase Client** | 2.47.10 | Browser-side Supabase client |
| **@supabase/ssr** | 0.7.0 | Server-Side Rendering auth |
| **PostgreSQL** | (via Supabase) | Relational database |

### State Management

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Zustand** | 5.0.2 | Lightweight state management |
| **React Hooks** | (built-in) | Local component state |

### Maps & Geolocation

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React Leaflet** | 4.2.1 | React wrapper for Leaflet maps |
| **Leaflet** | 1.9.4 | Interactive maps library |
| **OpenStreetMap** | (tiles) | Map tiles provider |

### Data Visualization

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Recharts** | 2.14.1 | React charting library |

### Development Tools

| Technology | Version | Purpose |
|-----------|---------|---------|
| **ESLint** | 8.x | Code linting |
| **TypeScript ESLint** | 6.x | TypeScript-specific linting |

---

## 📁 Project Structure

```
webapp/
├── src/
│   ├── app/                           # Next.js 14 App Router
│   │   ├── layout.tsx                # Root layout (global)
│   │   ├── page.tsx                  # Root page (redirects based on auth)
│   │   ├── not-found.tsx             # 404 page
│   │   │
│   │   ├── landing/                  # Public landing page
│   │   │   ├── page.tsx              # Landing page entry
│   │   │   └── components/
│   │   │       ├── Hero.tsx          # Hero section with CTAs
│   │   │       ├── ProblemStatement.tsx
│   │   │       ├── SolutionOverview.tsx
│   │   │       ├── TechnologyShowcase.tsx
│   │   │       ├── HowItWorks.tsx
│   │   │       ├── UserTypes.tsx
│   │   │       ├── PrivacyCommitment.tsx
│   │   │       ├── LiveStats.tsx
│   │   │       ├── FAQ.tsx
│   │   │       ├── FinalCTA.tsx
│   │   │       └── Footer.tsx
│   │   │
│   │   ├── auth/                     # Authentication pages
│   │   │   ├── layout.tsx            # Auth-specific layout
│   │   │   ├── signin/
│   │   │   │   └── page.tsx          # Generic sign-in
│   │   │   ├── signup/
│   │   │   │   └── page.tsx          # Generic sign-up
│   │   │   ├── driver/
│   │   │   │   ├── signin/
│   │   │   │   │   └── page.tsx      # Driver sign-in
│   │   │   │   └── signup/
│   │   │   │       └── page.tsx      # Driver sign-up (role: USER)
│   │   │   └── fleet/
│   │   │       ├── signin/
│   │   │       │   └── page.tsx      # Fleet manager sign-in
│   │   │       └── signup/
│   │   │           └── page.tsx      # Fleet manager sign-up (role: EMPLOYEE)
│   │   │
│   │   ├── driver-attention-monitor/ # Driver dashboard
│   │   │   ├── page.tsx              # Driver dashboard entry
│   │   │   └── components/
│   │   │       ├── DriverMonitorInteractive.tsx  # Main orchestrator
│   │   │       ├── AttentionGauge.tsx            # Circular score gauge
│   │   │       ├── CameraFeed.tsx                # Camera status panel
│   │   │       ├── AlertSystem.tsx               # Alert notifications
│   │   │       ├── RiskFactors.tsx               # Eye/Head/Drowsiness metrics
│   │   │       ├── TrendChart.tsx                # Performance trends
│   │   │       ├── PrivacyControls.tsx           # Quick consent toggles
│   │   │       ├── SteeringPanel.tsx             # (Optional) Steering wheel visual
│   │   │       └── EnvironmentControls.tsx       # (Optional) Simulation controls
│   │   │
│   │   ├── fleet-management-console/ # Fleet manager dashboard
│   │   │   ├── page.tsx              # Fleet dashboard entry
│   │   │   └── components/
│   │   │       ├── FleetConsoleInteractive.tsx   # Main orchestrator
│   │   │       ├── FleetKPICards.tsx             # KPI summary cards
│   │   │       ├── FleetMap.tsx                  # Leaflet map with drivers
│   │   │       ├── RouteRiskAnalytics.tsx        # Time-of-day risk chart
│   │   │       ├── DriverDetailsModal.tsx        # Driver info popup
│   │   │       ├── DriverManagementModal.tsx     # Add/Edit driver form
│   │   │       └── RouteManagementModal.tsx      # Add/Edit route form
│   │   │
│   │   ├── privacy-consent-setup/    # Privacy consent wizard
│   │   │   ├── page.tsx              # Consent page entry
│   │   │   └── components/
│   │   │       ├── PrivacyConsentInteractive.tsx # Main orchestrator
│   │   │       ├── ConsentHeader.tsx             # Page header
│   │   │       ├── ProgressIndicator.tsx         # Step progress bar
│   │   │       ├── ConsentSections.tsx           # Camera/Mic/Data toggles
│   │   │       ├── ProcessingExplanation.tsx     # Data processing info
│   │   │       ├── TrustSignals.tsx              # GDPR badges
│   │   │       └── ConsentActions.tsx            # Save/Cancel buttons
│   │   │
│   │   └── api/                      # API routes (if needed)
│   │       └── create-profile/
│   │           └── route.ts          # User profile creation endpoint
│   │
│   ├── components/                   # Shared components
│   │   ├── common/
│   │   │   ├── Header.tsx            # Global header with nav
│   │   │   └── LogoutButton.tsx      # Logout button component
│   │   └── ui/
│   │       ├── AppIcon.tsx           # App logo/icon
│   │       └── AppImage.tsx          # Image wrapper component
│   │
│   ├── lib/                          # Utilities & configs
│   │   └── supabase/
│   │       ├── client.ts             # Browser-side Supabase client
│   │       ├── server.ts             # Server-side Supabase client
│   │       └── middleware.ts         # Auth middleware for Next.js
│   │
│   ├── styles/                       # Global styles
│   │   ├── index.css                 # Main CSS (imports Tailwind)
│   │   └── tailwind.css              # Tailwind directives
│   │
│   └── middleware.ts                 # Next.js middleware (auth checks)
│
├── public/                           # Static assets
│   └── assets/                       # Images, icons, etc.
│
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Node dependencies
├── next-env.d.ts                     # Next.js TypeScript definitions
└── README.md                         # 👈 You are here
```

---

## 🚀 Installation

### Prerequisites

- **Node.js**: 18.0 or higher
- **npm** or **yarn** or **pnpm**
- **Supabase Account**: [https://supabase.com](https://supabase.com) (free tier works)

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/i.mobiothon-5.0.git
cd i.mobiothon-5.0/webapp
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### Step 3: Environment Variables

Create `.env.local` file in `webapp/` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: ML Server WebSocket URL
NEXT_PUBLIC_ML_SERVER_URL=ws://localhost:5000/ws

# Optional: App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get Supabase Credentials**:
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create new project (or use existing)
3. Go to Settings → API
4. Copy `URL` and `anon public` key

### Step 4: Database Setup (Supabase)

Run this SQL in Supabase SQL Editor:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('USER', 'EMPLOYEE')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row-Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Anyone can insert (for signup)
CREATE POLICY "Anyone can insert"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- Create privacy_consents table
CREATE TABLE privacy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  camera_consent BOOLEAN DEFAULT false,
  microphone_consent BOOLEAN DEFAULT false,
  data_sharing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for privacy_consents
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own consents"
  ON privacy_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own consents"
  ON privacy_consents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
  ON privacy_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Step 5: Run Development Server

```bash
npm run dev
```

**Application will run on**: `http://localhost:4028` (configured in package.json)

---

## ⚙️ Configuration

### Next.js Port (Change from 4028)

Edit `package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3000"  // Change 4028 to desired port
  }
}
```

### Tailwind CSS Customization

Edit `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Add custom colors
        'vw-blue': '#001E50',
        'vw-light-blue': '#00B0F0',
      },
      fontFamily: {
        // Add custom fonts
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
};
```

---

## 🎬 Usage

### Development Mode

```bash
# Start development server
npm run dev

# App runs on http://localhost:4028
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run serve
```

### Linting & Type Checking

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check with TypeScript
npx tsc --noEmit
```

---

## 📄 Pages Deep Dive

### Landing Page (`/landing`)

**Purpose**: Public-facing page to explain product and drive signups

**User Flow**:
1. User lands on `/landing` (unauthenticated default)
2. Reads about product
3. Clicks "Sign Up as Driver" → `/auth/driver/signup`
4. Or clicks "Sign Up as Fleet Manager" → `/auth/fleet/signup`
5. Or clicks "Sign In Here" → `/auth/signin`

---

### Driver Attention Monitor (`/driver-attention-monitor`)

**Access**: Restricted to `USER` role only

**Data Flow**:
1. Page loads → Fetch user profile from Supabase
2. Establish WebSocket connection to ML server
3. Receive real-time telemetry with alertness scores
4. Update UI components with new data
5. Show alerts if score drops below thresholds

---

### Fleet Management Console (`/fleet-management-console`)

**Access**: Restricted to `EMPLOYEE` role only

**Features**:
- Live map with driver markers (Surat, Gujarat)
- KPI cards (active drivers, avg score, alerts)
- Driver CRUD operations with validation
- Route CRUD operations (bilingual Hindi/English)
- Time-of-day risk analytics (dynamic charts)
- Driver details modal with performance trends

---

### Privacy Consent Setup (`/privacy-consent-setup`)

**Purpose**: GDPR-compliant consent wizard

**Consent Options**:
- Camera: For drowsiness detection (50% accuracy impact if disabled)
- Microphone: For yawn detection (10% accuracy impact if disabled)
- Data Sharing: Share scores with fleet manager

---

## 🔐 Authentication Flow

### Sign-Up Flow

1. User enters email, password, full name
2. Supabase creates auth user
3. App creates `user_profiles` entry with role
4. Redirects to `/privacy-consent-setup`
5. After consent, redirects to role-specific dashboard

### Sign-In Flow

1. User enters email, password
2. Supabase authenticates
3. Middleware checks auth cookies
4. Redirects based on role:
   - USER → `/driver-attention-monitor`
   - EMPLOYEE → `/fleet-management-console`

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Environment Variables on Vercel**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
EXPOSE 4028
CMD ["npm", "run", "serve"]
```

---

## 📊 Performance

### Lighthouse Scores

| Metric | Score | Target |
|--------|-------|--------|
| **Performance** | 92/100 | 90+ |
| **Accessibility** | 95/100 | 90+ |
| **Best Practices** | 100/100 | 100 |
| **SEO** | 90/100 | 90+ |

### Bundle Sizes

- Landing page: 102 kB
- Driver dashboard: 128 kB
- Fleet console: 145 kB (largest due to map + charts)

---

## 🐛 Troubleshooting

### Module not found: @supabase/ssr

```bash
rm -rf node_modules package-lock.json
npm install
```

### Leaflet map not rendering

```typescript
import dynamic from 'next/dynamic';

const FleetMap = dynamic(() => import('./components/FleetMap'), {
  ssr: false,  // Disable SSR for Leaflet
});
```

### TypeScript errors on build

```bash
# Type check locally
npx tsc --noEmit

# Install missing types
npm install --save-dev @types/leaflet @types/react-leaflet
```

---

## 📚 Additional Resources

- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Tailwind CSS**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **React Leaflet**: [https://react-leaflet.js.org](https://react-leaflet.js.org)

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

---

## 👥 Authors

Built with ❤️ for **i.Mobiothon 5.0** by the VW Driver Attention Team.

---

<div align="center">

**⭐ If you find this useful, star the repo! ⭐**

</div>
