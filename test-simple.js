// Simple test to verify data persistence
async function testSimple() {
  try {
    console.log('=== Testing simple data persistence ===');
    
    // Test POST
    const postResponse = await fetch('https://marketmelodrama.vercel.app/api/activepieces/tldr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: "Test Market Update",
        sentiment: 50,
        highlights: [
          {
            text: "Test highlight",
            highlights: [{ word: "Test", direction: "neutral" }]
          }
        ],
        big_picture: [
          {
            text: "Test big picture",
            highlights: [{ word: "Test", direction: "neutral" }]
          }
        ]
      })
    });
    
    const postResult = await postResponse.json();
    console.log('POST Result:', JSON.stringify(postResult, null, 2));
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test GET immediately after
    const getResponse = await fetch('https://marketmelodrama.vercel.app/api/activepieces/tldr');
    const getResult = await getResponse.json();
    console.log('GET Result:', JSON.stringify(getResult, null, 2));
    
    if (getResult.body && getResult.body.total > 0) {
      console.log('✅ Data persistence working!');
    } else {
      console.log('❌ Data persistence not working');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSimple();



