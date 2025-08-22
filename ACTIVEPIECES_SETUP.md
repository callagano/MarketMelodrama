# Activepieces Workflow Setup for TLDR Updates

This guide explains how to set up an Activepieces workflow to automatically send daily market TLDR updates to your Market Melodrama app.

## Overview

Your app now has a webhook endpoint at `/api/tldr-update` that can receive daily text updates from Activepieces. The workflow will send a POST request with the generated text, and it will automatically appear in the TLDR widget on your app.

## Workflow Setup in Activepieces

### 1. Create New Workflow
- Open Activepieces
- Click "Create new workflow"
- Name it "Daily Market TLDR Update"

### 2. Add Trigger
- Choose a **Schedule trigger**
- Set it to run **Daily at 7:00 AM** (or your preferred time)
- This ensures fresh market analysis every morning

### 3. Add Text Generation Action
- Add an action to generate your market TLDR text
- This could be:
  - **AI Text Generation** (using OpenAI, Claude, etc.)
  - **Web Scraping** from financial news sites
  - **Database Query** from your market analysis
  - **Manual Input** (if you prefer to write it yourself)

### 4. Add HTTP Request Action
- Add an **HTTP Request** action
- Configure it as follows:

#### HTTP Request Configuration:
- **Method**: `POST`
- **URL**: `https://your-app.vercel.app/api/tldr-update`
  - Replace `your-app.vercel.app` with your actual Vercel domain
  - For local testing: `http://localhost:3000/api/tldr-update`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "text": "{{your_generated_text}}",
  "date": "{{current_date}}",
  "source": "activepieces"
}
```

### 5. Test the Workflow
- Use the "Test" button in Activepieces
- Check your app to see if the TLDR appears
- Verify the data is stored in the `data/tldr-updates.json` file

## API Endpoint Details

### POST `/api/tldr-update`
**Purpose**: Receive daily TLDR updates

**Request Body**:
```json
{
  "text": "Your market analysis text here...",
  "date": "2024-12-19",  // Optional, defaults to today
  "source": "activepieces"  // Optional, defaults to "activepieces"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Text updated successfully",
  "date": "2024-12-19",
  "textLength": 220
}
```

### GET `/api/tldr-update`
**Purpose**: Retrieve current TLDR data

**Response**:
```json
{
  "today": {
    "text": "Today's market analysis...",
    "date": "2024-12-19",
    "source": "activepieces",
    "createdAt": "2024-12-19T07:00:00.000Z"
  },
  "recent": [...],
  "total": 1
}
```

## Data Storage

- TLDR updates are stored in `data/tldr-updates.json`
- Only the last 30 days of updates are kept
- Each update includes timestamp and source information
- The data directory is automatically created and gitignored

## Troubleshooting

### Common Issues:

1. **Workflow not running**:
   - Check the schedule trigger time
   - Verify the workflow is activated

2. **Text not appearing in app**:
   - Check the HTTP request URL
   - Verify the JSON payload format
   - Check browser console for errors

3. **API errors**:
   - Ensure the text field is not empty
   - Check the request format matches the expected schema

### Testing Locally:
```bash
curl -X POST http://localhost:3000/api/tldr-update \
  -H "Content-Type: application/json" \
  -d '{"text": "Test market update", "date": "2024-12-19"}'
```

## Next Steps

1. Set up your Activepieces workflow following this guide
2. Test with a sample text to ensure it works
3. Schedule it to run daily at your preferred time
4. Monitor the app to ensure updates are appearing correctly

The TLDR widget will automatically display the most recent update and show a history of recent updates below it.
