const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata/";
const START_DATE = '2020-09-19';

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Get date 30 days ago
function getRecentDate() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  return thirtyDaysAgo.toISOString().split('T')[0];
}

// Convert timestamp to date string
function timestampToDate(timestamp) {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

// Make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      
      // Check for HTTP errors
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          console.error('JSON parse error:', e.message);
          console.error('Response data:', data.substring(0, 200) + '...');
          reject(new Error(`Invalid JSON response: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Load existing CSV data
function loadExistingData() {
  const csvPath = path.join(__dirname, 'fear-greed.csv');
  const data = new Map();
  
  try {
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n');
      
      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (line) {
          const [date, fearGreed] = line.split(',');
          if (date && fearGreed) {
            data.set(date, parseInt(fearGreed));
          }
        }
      }
    } else {
      console.log('No existing CSV file found, starting fresh');
    }
  } catch (error) {
    console.log('Error loading existing data, starting fresh:', error.message);
  }
  
  return data;
}

// Save data to CSV
function saveToCSV(data) {
  const csvPath = path.join(__dirname, 'fear-greed.csv');
  const csvLines = ['Date,Fear Greed'];
  
  // Sort by date
  const sortedEntries = Array.from(data.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  for (const [date, fearGreed] of sortedEntries) {
    csvLines.push(`${date},${fearGreed}`);
  }
  
  fs.writeFileSync(csvPath, csvLines.join('\n'));
}

// Save data to JSON
function saveToJSON(data) {
  const jsonPath = path.join(__dirname, 'all_fng_csv.csv');
  const jsonData = [];
  
  // Sort by date
  const sortedEntries = Array.from(data.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  for (const [date, fearGreed] of sortedEntries) {
    jsonData.push({
      date: date,
      Fear_Greed_Index: fearGreed
    });
  }
  
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
}

// Main function
async function main() {
  try {
    console.log('Starting Fear & Greed Index update...');
    
    const currentDate = getCurrentDate();
    const recentDate = getRecentDate();
    
    console.log(`Current date: ${currentDate}`);
    console.log(`Recent date: ${recentDate}`);
    
    // Load existing data
    const existingData = loadExistingData();
    console.log(`Loaded ${existingData.size} existing data points`);
    
    // Get historical data
    console.log('Fetching historical data...');
    const historicalData = await makeRequest(BASE_URL + START_DATE);
    
    // Get recent data
    console.log('Fetching recent data...');
    const recentData = await makeRequest(BASE_URL + recentDate);
    
    // Process historical data
    if (historicalData.fear_and_greed_historical && historicalData.fear_and_greed_historical.data) {
      for (const dataPoint of historicalData.fear_and_greed_historical.data) {
        const date = timestampToDate(dataPoint.x);
        const fearGreed = parseInt(dataPoint.y);
        
        if (fearGreed !== 0) { // Only include non-zero values
          existingData.set(date, fearGreed);
        }
      }
    }
    
    // Process recent data
    if (recentData.fear_and_greed_historical && recentData.fear_and_greed_historical.data) {
      for (const dataPoint of recentData.fear_and_greed_historical.data) {
        const date = timestampToDate(dataPoint.x);
        const fearGreed = parseInt(dataPoint.y);
        
        if (fearGreed !== 0) { // Only include non-zero values
          existingData.set(date, fearGreed);
        }
      }
    }
    
    console.log(`Total data points after update: ${existingData.size}`);
    
    // Save data
    saveToCSV(existingData);
    saveToJSON(existingData);
    
    console.log('Fear & Greed Index update completed successfully');
    
    // Return the data for API response
    return {
      success: true,
      message: 'Fear & Greed Index updated successfully',
      dataPoints: existingData.size,
      lastUpdate: currentDate
    };
    
  } catch (error) {
    console.error('Error updating Fear & Greed Index:', error);
    throw error;
  }
}

// Export for use in API
module.exports = { main };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
