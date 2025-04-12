# Fear & Greed Index Dashboard

A real-time market sentiment analysis dashboard that tracks and visualizes the Fear & Greed Index along with its underlying components. Built with Next.js and React.

## Features

- Real-time Fear & Greed Index calculation
- Historical data visualization
- Component breakdown:
  - Market Momentum
  - Stock Price Strength
  - Safe Haven Demand
- Responsive design
- Interactive time frame selection (1M, 6M, 3Y)

## Tech Stack

- Next.js 15
- React
- TypeScript
- Recharts
- Python (for data processing)
- Financial Modeling Prep API

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fear-greed-index.git
cd fear-greed-index
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your Financial Modeling Prep API key:
```
API_KEY=your_api_key_here
```

4. Set up Python environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install pandas numpy matplotlib requests
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

MIT
