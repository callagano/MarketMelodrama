// Test script to simulate ActivePieces sending data
const testData = {
  title: "Market Update: Tech Stocks Rally on AI Optimism",
  sentiment: 75,
  highlights: [
    {
      text: "Tech stocks ▲ surged 3.2% as AI companies reported strong earnings",
      highlights: [
        { word: "Tech stocks", direction: "up" },
        { word: "surged", direction: "up" },
        { word: "AI companies", direction: "up" }
      ]
    },
    {
      text: "Energy sector ▼ declined 1.8% on oil price concerns",
      highlights: [
        { word: "Energy sector", direction: "down" },
        { word: "declined", direction: "down" },
        { word: "oil price concerns", direction: "down" }
      ]
    }
  ],
  big_picture: [
    {
      text: "The market showed mixed signals today with technology leading gains while traditional sectors faced headwinds. Investors remain optimistic about AI-driven growth despite broader economic uncertainties.",
      highlights: [
        { word: "mixed signals", direction: "neutral" },
        { word: "technology leading gains", direction: "up" },
        { word: "AI-driven growth", direction: "up" },
        { word: "economic uncertainties", direction: "down" }
      ]
    }
  ]
};

async function testActivePieces() {
  try {
    console.log('Testing ActivePieces data submission...');
    
    const response = await fetch('https://marketmelodrama.vercel.app/api/activepieces/tldr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Test data sent successfully!');
      
      // Wait a moment then check if data is available
      setTimeout(async () => {
        const getResponse = await fetch('https://marketmelodrama.vercel.app/api/activepieces/tldr');
        const getData = await getResponse.json();
        console.log('Data retrieval test:', JSON.stringify(getData, null, 2));
      }, 2000);
    } else {
      console.log('❌ Failed to send test data');
    }
  } catch (error) {
    console.error('Error testing ActivePieces:', error);
  }
}

testActivePieces();



