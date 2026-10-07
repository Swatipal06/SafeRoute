# SafeRoute 🛡️

### Safety-Aware Navigation & Real-Time Personal Safety Platform

> **Because the fastest route is not always the safest route.**

SafeRoute is a full-stack safety-aware navigation platform that evaluates alternative routes using geospatial data, historical crime indicators, OpenStreetMap infrastructure, satellite-derived lighting signals, community reports, and machine-learning-based safety scoring.

Instead of considering only distance and travel time, SafeRoute adds a **safety intelligence layer** to route comparison and provides real-time community reporting, live location sharing, and SOS assistance.

---

## 🚀 Key Features

### 🗺️ Safety-Aware Route Comparison

* Fetches alternative routes using OSRM.
* Calculates a safety score for each route.
* Compares routes using:

  * Safety score
  * Distance
  * Estimated travel time
* Separates the **Safest** and **Fastest** route options.
* Displays route-specific AI-generated explanations.

### 🛡️ Route-Side Safe Stops

After routes are generated and the user selects/views a route, SafeRoute identifies useful public facilities located directly along or near that specific route's corridor.

> **Note:** Safe Stops is a **separate intelligence layer** from the numerical safety scoring engine. The existing safety score formula remains independent, while Safe Stops answers: *"What useful, safe, and essential places are available along my route if I need to stop, seek shelter, get help, or refuel?"*

**Categories Identified:**
* ☕ **Cafes** (`amenity=cafe`)
* 🍴 **Restaurants & Eateries** (`amenity=restaurant`, `amenity=fast_food`)
* 🏨 **Hotels & Lodging** (`tourism=hotel`, `tourism=guest_house`, `tourism=hostel`)
* 🏥 **Hospitals & Medical Centers** (`amenity=hospital`, `amenity=clinic`)
* 👮 **Police Stations** (`amenity=police`)
* 💊 **Pharmacies & Chemists** (`amenity=pharmacy`)
* ⛽ **Fuel Stations** (`amenity=fuel`)
* 🏧 **ATMs & Banking** (`amenity=atm`, `amenity=bank`)
* 🛒 **Shops & Convenience Stores** (`shop=*`)

**How it Works:**
1. **Actual Route Geometry Corridor:** Uses the exact polyline coordinates from OSRM to establish a buffer corridor (configurable: 250m, 500m, 1000m).
2. **Geospatial Distance Calculation:** For every POI, calculates the minimum perpendicular distance to the closest line segment of the route polyline and its distance along the journey.
3. **Deduplication & Category Normalization:** Cleans and normalizes OSM elements, eliminating duplicate nodes/ways.
4. **Interactive Map & Filter Controls:** Interactive category pills, custom category-themed map markers, rich popups with opening hours and contact links, and emergency highlight shortcuts.
5. **Route-Specific Reactivity:** Switching between Safest and Fastest routes automatically re-analyzes and updates the safe stops for the selected path.

### 📊 Multi-Signal Safety Scoring

SafeRoute combines multiple safety signals before generating the final route score:

```text
Route Geometry
      ↓
Route Sampling
      ↓
┌─────────────────────────────┐
│ Historical Crime Indicator  │
│ OSM Infrastructure Data     │
│ Police Proximity            │
│ POI / Crowd Heuristic       │
│ Satellite Lighting Signal   │
│ Community Safety Reports    │
└─────────────────────────────┘
      ↓
Feature Aggregation
      ↓
ML Safety Model
      ↓
Route Safety Score (0–100)
      ↓
Community Hazard Penalty
```

The backend samples points along the route and evaluates the surrounding safety context before producing an aggregate score.

---

### 🛰️ Satellite-Derived Lighting Signal

SafeRoute integrates **NASA GIBS VIIRS Earth-at-Night imagery** to derive a macro-level brightness signal.

The backend:

1. Converts geographic coordinates to tile coordinates.
2. Retrieves the corresponding NASA GIBS image tile.
3. Processes the image using Jimp.
4. Calculates average pixel brightness.
5. Converts the brightness value into a normalized lighting score.

This signal represents **macro-area illumination**, rather than individual street-lamp measurements.

---

### 🗺️ OpenStreetMap Safety Intelligence

SafeRoute queries OpenStreetMap through the Overpass API to identify relevant geographic features such as:

* Police stations
* Roads tagged as unlit
* Shops
* Cafes
* Restaurants
* Marketplace-related POIs

The backend converts these features into safety zones and uses a filesystem cache to reduce repeated Overpass requests.

---

### 🧠 Machine Learning Safety Model

SafeRoute uses a separate Python Flask microservice for safety-score prediction.

The Node.js backend sends aggregated safety features to the ML service:

```text
Lighting Score
Crowd Density
Crime Indicator
Police/CCTV Proximity
Community Report Signal
        ↓
Python ML Service
        ↓
Safety Model
        ↓
Predicted Safety Score
```

The trained model is loaded from:

```text
server/ml/safety_model.joblib
```

The ML service supports batch predictions for multiple sampled route points.

---

### 👁️ Computer Vision Pipeline

The project also contains a prototype computer-vision pipeline using:

* OpenCV
* YOLOv8

The pipeline extracts:

* Average image brightness
* Detected people
* Detected vehicles
* Scene-density information

These signals can be blended with the geographic safety features used by the route-scoring engine.

> **Current prototype limitation:** the computer-vision endpoint currently operates on bundled reference street images rather than live camera imagery.

---

### 📍 Community Safety Reporting

Users can report potentially unsafe locations directly from the map.

A report contains:

```text
Location
Reason
Category
Urgency
Timestamp
```

Reports are stored as GeoJSON-style `Point` coordinates in MongoDB with a `2dsphere` index.

The LLM layer can classify reports into categories such as:

* Lighting
* Suspicious Activity
* Road Hazard
* Police Presence
* Other

It also estimates report urgency and filters likely spam submissions.

---

### 🌙 Night Risk Map

SafeRoute can display a safety/risk overlay containing relevant risk zones derived from:

* OpenStreetMap infrastructure
* Historical crime indicators
* Safety-zone metrics
* Community safety information

The map dynamically requests data based on the current map bounds.

---

### 🚨 SOS & Emergency Contacts

SafeRoute provides an SOS workflow that:

1. Obtains the user's current GPS location.
2. Creates a live tracking session.
3. Generates a shareable tracking URL.
4. Sends the emergency location to the backend.
5. Notifies configured emergency contacts.
6. Optionally sends SMS messages through Twilio.

The SOS message can be generated using the LLM service with a deterministic fallback message when the AI service is unavailable.

---

### 📡 Real-Time Location Tracking

SafeRoute uses **Socket.IO WebSockets** for live location sharing.

```text
User
 ↓
GPS watchPosition()
 ↓
Socket.IO
 ↓
Tracking Session
 ↓
Trusted Contact
 ↓
Live Map
```

The trusted-contact view displays:

* Current location
* Route
* Destination
* Trip progress
* Arrival state

---

### 🔐 Authentication & Security

The backend implements:

* User registration
* User login
* Password hashing with bcrypt
* JWT-based authentication
* Protected contact endpoints
* API rate limiting
* SOS rate limiting

Rate limiting is applied to sensitive operations such as:

```text
Community Reports
SOS Requests
```

---

## 🏗️ Architecture

```text
                         SafeRoute
                             │
              ┌──────────────┴──────────────┐
              │                             │
        React Frontend                Node.js Backend
              │                             │
       React-Leaflet                 Express REST API
              │                             │
              │             ┌───────────────┼───────────────┐
              │             │               │               │
              │         MongoDB         External APIs    ML Service
              │             │               │               │
              │             │        ┌──────┼──────┐        │
              │             │        │      │      │        │
              │             │       OSRM   OSM   NASA    Flask
              │             │        │      │      │        │
              │             │        └──────┼──────┘        │
              │             │               │               │
              │             │           Safety Engine      │
              │             │               │               │
              │             └───────────────┼───────────────┘
              │                             │
              └──────────── Socket.IO ──────┘
```

---

## 🧰 Tech Stack

| Layer                   | Technology                          |
| ----------------------- | ----------------------------------- |
| Frontend                | React 19, Vite                      |
| Styling                 | Tailwind CSS                        |
| Maps                    | Leaflet, React-Leaflet              |
| Routing                 | OSRM                                |
| Backend                 | Node.js, Express                    |
| Database                | MongoDB, Mongoose                   |
| Authentication          | JWT, bcrypt                         |
| Real-Time               | Socket.IO                           |
| ML Service              | Python, Flask, scikit-learn, joblib |
| Computer Vision         | OpenCV, YOLOv8                      |
| Satellite Data          | NASA GIBS / VIIRS                   |
| Geospatial Data         | OpenStreetMap / Overpass API        |
| AI                      | OpenRouter + Gemini                 |
| Emergency Communication | Twilio SMS                          |
| HTTP Client             | Axios                               |

---

## 📂 Project Structure

```text
SafeRoute/
│
├── client/
│   └── src/
│       ├── components/
│       │   ├── LandingPage.jsx
│       │   ├── MainApp.jsx
│       │   ├── MapView.jsx
│       │   ├── SafeStopsPanel.jsx
│       │   ├── RouteSearchBar.jsx
│       │   ├── LiveTracking.jsx
│       │   └── AdminCampusPilot.jsx
│       ├── utils/
│       │   ├── mapTiles.js
│       │   └── safeStopIcons.js
│       └── App.jsx
│
├── server/
│   ├── index.js
│   │
│   ├── ml/
│   │   ├── app.py
│   │   ├── safety_model.joblib
│   │   └── mock_images/
│   │
│   └── src/
│       ├── config/
│       │   └── db.js
│       │
│       ├── models/
│       │   ├── User.js
│       │   └── Report.js
│       │
│       ├── services/
│       │   ├── safetyScoreEngine.js
│       │   ├── safeStopsService.js
│       │   ├── osmService.js
│       │   ├── nasaService.js
│       │   ├── crimeDataService.js
│       │   └── llmService.js
│       │
│       └── data/
│           ├── historicalCrimeData.json
│           ├── osm_cache.json
│           └── safe_stops_cache.json
│
├── docs/
│
├── package.json
└── README.md
```

---

## 🔄 Route Evaluation & Safe Stops Flow

```text
User enters origin + destination
              ↓
        Node / Express
              ↓
          OSRM Routes
              ↓
      Alternative Routes
              ↓
      Route Coordinates
              ↓
       Sample Route Points
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
   OSM      NASA      Crime
    ↓         ↓         ↓
    └─────────┼─────────┘
              ↓
      Community Reports
              ↓
       Feature Aggregation
              ↓
       Python ML Service
              ↓
       Point Safety Scores
              ↓
        Route Aggregate
              ↓
      Community Penalties
              ↓
       Final Score / 100
              ↓
     ┌────────┴────────┐
     ↓                 ↓
  SAFEST            FASTEST
     ↓                 ↓
     └───────┬─────────┘
             ↓
       AI Route Summary
             ↓
      Route Selection
             ↓
 ┌─────────────────────────┐
 │ SAFE STOPS / POI ENGINE │
 │ (Corridor buffer 500m)  │
 └─────────────────────────┘
             ↓
  Display facilities along 
      selected route
             ↓
        React Map UI
```

---

## 🤖 Role of Generative AI

Generative AI is **not responsible for the core numerical safety score**.

Instead, it is used for higher-level language tasks:

### Community Report Classification

```text
User Report
    ↓
LLM
    ↓
Category + Urgency + Spam Classification
```

### Route Explanation

```text
Route Metrics
    ↓
LLM
    ↓
Human-readable route summary
```

### SOS Message

```text
User + Location + Tracking URL
            ↓
           LLM
            ↓
     Emergency SMS Draft
```

Fallback responses are provided when the LLM service is unavailable.

---

## 🛠️ Getting Started

### Prerequisites

Install:

* Node.js 18+
* Python 3.9+
* MongoDB / MongoDB Atlas
* npm

Optional external services:

* OpenRouter API
* Twilio account

---

### 1. Clone the repository

Clone this repository and enter the project directory.

---

### 2. Install frontend dependencies

```bash
cd client
npm install
```

---

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

---

### 4. Install Python dependencies

```bash
cd ml

python -m venv venv
```

Activate the virtual environment.

#### Windows

```bash
venv\Scripts\activate
```

#### macOS/Linux

```bash
source venv/bin/activate
```

Install the ML dependencies:

```bash
pip install -r requirements.txt
```

For the computer-vision pipeline, the environment also requires the packages used by `app.py`, including OpenCV, NumPy and the YOLO runtime.

---

### 5. Configure environment variables

Create:

```text
server/.env
```

Example:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret

OPENROUTER_API_KEY=your_openrouter_key

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

Do not commit `.env` or API credentials to GitHub.

---

### 6. Start the application

From the `server` directory:

```bash
npm run dev
```

The server starts the Node.js API and Flask ML service.

In another terminal:

```bash
cd client
npm run dev
```

The Vite development server will provide the frontend.

---

### 7. Run automated tests

SafeRoute includes automated unit and integration tests using Jest and Supertest:

```bash
cd server
npm test
```

Test coverage includes:
* `safeStopsService.test.js`: Polyline corridor distance, category normalization, and POI deduplication.
* `safeStopsApi.test.js`: `/api/routes/safe-stops` integration tests.
* `safetyScoreEngine.test.js`: Mathematical helpers, Haversine routing formulas, and offline fallback scoring.
* `api.test.js`: Express rate limiting on sensitive incident report endpoints.

---

## 🚀 Deployment Guide (Vercel + Render)

SafeRoute is configured for cloud deployment with decoupled frontend and backend hosting:

### 1. Backend (Render)
1. Create a **Web Service** on [Render](https://render.com) pointing to the repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Configure environment variables in Render:
   * `MONGODB_URI`: Your MongoDB Atlas connection string.
   * `JWT_SECRET`: A secure random secret key.
   * `OPENROUTER_API_KEY`: *(Optional)* OpenRouter key for AI summaries.
   * `TWILIO_*`: *(Optional)* Twilio credentials for SMS dispatch.

### 2. Frontend (Vercel)
1. Import the repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Framework preset: **Vite**.
4. Add environment variables:
   * `VITE_BACKEND_URL`: Your deployed Render service URL (e.g., `https://saferoute-api.onrender.com`).
   * `VITE_CARTO_API_KEY`: *(Optional)* Carto Basemaps API key.
5. Deploy. SPA routing is managed via `client/vercel.json`.

## 🔑 External Services

SafeRoute integrates with:

### OSRM

Used for route generation and alternative route comparison.

### OpenStreetMap / Overpass

Used to retrieve geographic safety-related features.

### NASA GIBS

Used for satellite-derived macro lighting information.

### OpenRouter

Used for generative AI features such as report classification and route explanations.

### Twilio

Used for optional emergency SMS delivery.

---

## 📊 Data Sources & Limitations

SafeRoute combines several different types of information.

### Historical Crime Data

The repository contains a curated city-level historical crime proxy dataset labeled as 2023 NCRB proxy data.

It should be treated as a **baseline indicator**, not a real-time crime database.

### OpenStreetMap

OSM information depends on the availability and accuracy of mapped geographic features.

Missing or outdated OSM information can affect the resulting safety signals.

### Satellite Lighting

The NASA-based signal represents **macro-level brightness**, not actual street-lamp measurements.

### Community Reports

Community reports are user-generated and may contain incomplete, subjective, or inaccurate information.

### Computer Vision

The current CV pipeline uses bundled reference street images. It is a prototype component and should not be interpreted as live CCTV analysis.

---

## ⚠️ Current Prototype Limitations

SafeRoute is currently a research/hackathon-style prototype rather than a production emergency-service system.

Current limitations include:

* Route generation currently uses the OSRM driving profile.
* NASA lighting analysis uses a fixed satellite imagery date.
* Computer-vision analysis uses bundled reference images.
* Crime information is a historical city-level proxy.
* Live tracking sessions are maintained in server memory.
* External APIs may be rate-limited or unavailable.
* Safety scores should be treated as informational rather than authoritative.
* Emergency functionality should not replace local emergency services.

---

## 🔒 Security Hardening Roadmap

Before production deployment, the following improvements are planned:

* Remove fallback JWT secrets.
* Enforce authenticated ownership checks for emergency contacts.
* Protect administrative endpoints with role-based authorization.
* Restrict Socket.IO CORS origins.
* Authenticate live-tracking sessions.
* Add expiration to tracking sessions.
* Move tracking state to a persistent/centralized store for multi-instance deployment.
* Add stronger request validation.
* Add audit logging for sensitive operations.
* Expand test suite with automated end-to-end CI/CD and ML microservice pipelines.

---

## 🚧 Future Improvements

### Navigation

* Switch to pedestrian-specific routing.
* Add route rerouting during an active journey.
* Incorporate time-of-day route scoring more deeply.
* Add accessible-route preferences.

### Safety Intelligence

* Improve the route-level spatial aggregation model.
* Add more reliable city/district-level crime datasets.
* Introduce better temporal weighting.
* Add verified community-report confidence scores.
* Improve OSM caching and cache invalidation.

### Computer Vision

* Replace reference images with an appropriate real-world image source.
* Add image provenance and confidence handling.
* Improve lighting and crowd-density estimation.

### Infrastructure

* Add Redis for distributed real-time sessions.
* Add background jobs for expensive external-data processing.
* Add structured logging and monitoring.
* Add automated tests and CI/CD.

---

## 🎯 What Makes SafeRoute Technically Interesting

SafeRoute is not simply a CRUD application or a map wrapper.

The project combines:

```text
Full-Stack Web Development
        +
Geospatial Computing
        +
Machine Learning
        +
Computer Vision
        +
Real-Time WebSockets
        +
External API Integration
        +
Generative AI
        +
Authentication & Security
```

The main engineering challenge is combining heterogeneous data sources into a single route-level safety evaluation while keeping the system responsive enough for an interactive map experience.

---

## 👩‍💻 Project

**SafeRoute**

A safety-aware navigation platform combining geospatial intelligence, machine learning, community reporting, real-time tracking, and emergency assistance.

Built with React, Node.js, MongoDB, Python, Socket.IO, OpenStreetMap, NASA GIBS, OSRM, OpenRouter, and Twilio.

---

## 📄 License

MIT License
