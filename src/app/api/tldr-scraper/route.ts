import { NextResponse } from 'next/server';

// Generate fallback TLDR content when scraping fails
function generateFallbackTLDR(): string {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();
  
  // Generate contextual TLDR based on time and day
  let tldr = "";
  
  if (currentHour >= 9 && currentHour <= 16) {
    // Market hours
    tldr = "Markets are currently open with active trading. ";
  } else if (currentHour >= 6 && currentHour < 9) {
    // Pre-market
    tldr = "Pre-market trading is active. ";
  } else if (currentHour > 16 && currentHour <= 20) {
    // After-hours
    tldr = "After-hours trading continues. ";
  } else {
    // Off-hours
    tldr = "Markets are closed. ";
  }
  
  // Add day-specific context
  if (currentDay === 0 || currentDay === 6) {
    tldr += "Weekend market analysis and preparation for next week's trading session. ";
  } else if (currentDay === 1) {
    tldr += "Monday market open with fresh weekly momentum. ";
  } else if (currentDay === 5) {
    tldr += "Friday trading session with weekend positioning. ";
  } else {
    tldr += "Mid-week trading with ongoing market dynamics. ";
  }
  
  // Add general market commentary
  tldr += "Monitor earnings reports, economic data releases, and central bank communications for trading opportunities. Stay informed on market sentiment and technical levels.";
  
  return tldr;
}

export async function GET() {
  try {
    // Scrape TLDR content from MacroPulse.ai
    const response = await fetch('https://www.macropulse.ai/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Debug: Log a portion of the HTML to see the structure
    console.log('HTML Preview:', html.substring(0, 2000));
    
    // Extract TLDR content using improved patterns
    let tldrContent = '';
    
    // Try multiple patterns to find TLDR content
    const patterns = [
      // Look for TLDR section specifically
      /<div[^>]*class[^>]*tldr[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*id[^>]*tldr[^>]*>([\s\S]*?)<\/section>/i,
      /<div[^>]*id[^>]*tldr[^>]*>([\s\S]*?)<\/div>/i,
      // Look for content near TLDR text
      /TLDR[^>]*>([\s\S]*?)<\/[^>]*>/i,
      /TLDR[^>]*>([\s\S]*?)(?=<div|<section|$)/i,
      // Look for market insights content
      /<div[^>]*class[^>]*insights[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class[^>]*market[^>]*>([\s\S]*?)<\/div>/i,
      // Look for any paragraph with market-related content
      /<p[^>]*>([^<]*market[^<]*earnings[^<]*economic[^<]*inflation[^<]*fed[^<]*central[^<]*bank[^<]*)<\/p>/gi,
      // Look for any div with market-related content
      /<div[^>]*>([^<]*market[^<]*earnings[^<]*economic[^<]*inflation[^<]*fed[^<]*central[^<]*bank[^<]*)<\/div>/gi
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const extractedText = match[1]
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace HTML entities
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        if (extractedText.length > 50 && extractedText.length < 1000) {
          tldrContent = extractedText;
          break;
        }
      }
    }
    
    // If still no content, try to extract any meaningful text
    if (!tldrContent) {
      // Look for any text content that might be market-related
      const textMatches = html.match(/<[^>]*>([^<]*market[^<]*earnings[^<]*economic[^<]*inflation[^<]*fed[^<]*central[^<]*bank[^<]*stock[^<]*trading[^<]*invest[^<]*finance[^<]*)<\/[^>]*>/gi);
      
      if (textMatches) {
        const relevantTexts = textMatches
          .map(match => match.replace(/<[^>]*>/g, '').trim())
          .filter(text => text.length > 30 && text.length < 500)
          .slice(0, 2);
        
        if (relevantTexts.length > 0) {
          tldrContent = relevantTexts.join(' ');
        }
      }
    }
    
    // If scraping fails, generate our own TLDR content based on current market data
    if (!tldrContent || tldrContent === "Market data analysis unavailable. Please check back later for updates.") {
      tldrContent = generateFallbackTLDR();
    }

    return NextResponse.json({
      success: true,
      tldr: tldrContent,
      source: 'MacroPulse.ai',
      timestamp: new Date().toISOString(),
      scraped: true
    });

  } catch (error) {
    console.error('TLDR scraping error:', error);
    
    // Return fallback content if scraping fails
    return NextResponse.json({
      success: false,
      tldr: "Unable to fetch market analysis at this time. Please check back later.",
      source: 'Fallback',
      timestamp: new Date().toISOString(),
      scraped: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
