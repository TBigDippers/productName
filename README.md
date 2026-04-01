# Product Function Naming Generator

A modern web application built with React, Vite, and Tailwind CSS for generating high-quality product feature names.

## Features

- **Modern UI**: Built with React 18 and Tailwind CSS for a responsive, beautiful interface
- **Smart Generation**: Generate 10 naming candidates across four dimensions (direct, metaphor, emotional, action)
- **Detailed Analysis**: Each candidate includes naming rationale, feasibility review, and multi-dimensional scoring
- **Comparison Tool**: Compare up to 4 candidates side-by-side
- **History Tracking**: View and reload previous naming tasks
- **Export**: Download results as CSV
- **Real-time Feedback**: Loading states, error handling, and toast notifications

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Backend**: Node.js HTTP Server
- **Build Tool**: Vite

## Quick Start

### Requirements

- Node.js 18+

### Installation

```bash
# Clone the repository
git clone https://github.com/TBigDippers/productName.git
cd productName

# Install dependencies
npm install
```

### Development

```bash
# Start both the API server and React dev server
npm start
```

This will start:
- API Server: `http://localhost:3000`
- React Dev Server: `http://localhost:5173`

Open `http://localhost:5173` in your browser.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```text
productName/
├── index.html           # Vite entry point
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── server.js            # Backend API server
├── src/
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Main application component
│   ├── api.js           # API client functions
│   ├── index.css        # Tailwind CSS imports
│   └── components/
│       ├── Header.jsx          # App header with navigation
│       ├── NamingForm.jsx      # Form for generating names
│       ├── ResultsPanel.jsx    # Display generated candidates
│       ├── CandidateCard.jsx   # Individual candidate card
│       ├── CompareDrawer.jsx   # Side-by-side comparison
│       ├── HistoryDialog.jsx   # View past tasks
│       └── Toast.jsx           # Notification component
├── data/                # Runtime data storage
└── exports/             # Generated CSV files
```

## API Endpoints

### Generate names

```http
POST /api/naming/generate
Content-Type: application/json
```

```json
{
  "featureDescription": "Help shoppers monitor price changes and get notified when prices drop.",
  "targetUsers": ["ecommerce shoppers"],
  "brandTone": ["reliable", "warm"],
  "namingPreference": ["concise"],
  "industry": "ecommerce",
  "language": "en-US",
  "dimensionWeight": {
    "direct": 0.3,
    "metaphor": 0.2,
    "emotional": 0.2,
    "action": 0.3
  }
}
```

### Get config

```http
GET /api/naming/config
```

### Get history

```http
GET /api/naming/tasks
```

### Compare candidates

```http
POST /api/naming/compare
Content-Type: application/json
```

```json
{
  "taskId": "task_xxx",
  "candidateIds": ["cand_1", "cand_2", "cand_3"]
}
```

### Export CSV

```http
POST /api/naming/export
Content-Type: application/json
```

```json
{
  "taskId": "task_xxx",
  "format": "csv"
}
```

## Scoring Model

| Dimension | Weight | Description |
| --- | --- | --- |
| Clarity | 25% | How quickly users understand the name |
| Brand Fit | 20% | How well the name matches the selected tone |
| Memorability | 20% | How easy the name is to remember |
| Spreadability | 15% | How easily the name can be said and shared |
| Uniqueness | 10% | How distinctive the name feels |
| Registrability | 10% | Trademark-risk heuristic |

## Key Features

### Form Validation
- Real-time character count
- Required field validation
- Dimension weight must equal 100%

### User Experience
- Loading skeletons during data fetch
- Toast notifications for feedback
- Expandable candidate details
- Responsive design for all screen sizes

### Data Management
- React Query for caching and state
- Persistent task history
- CSV export functionality

## Notes

- Trademark evaluation is heuristic only and not legal advice.
- The current MVP outputs English naming candidates.
- CSV is the only export format in this version.

## 中文文档

[README_CN.md](./README_CN.md)
