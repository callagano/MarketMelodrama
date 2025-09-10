# Activepieces Workflow Setup for TLDR Updates

This guide explains how to set up an Activepieces workflow to automatically send daily market TLDR updates to your Market Melodrama app.

## Overview

Your app now has a dedicated ActivePieces endpoint at `/api/activepieces/tldr` that can receive daily text updates from Activepieces. The workflow will send a POST request with the generated text, and it will automatically appear in the TLDR widget on your app.

## Available Endpoints

- **ActivePieces Endpoint**: `/api/activepieces/tldr` - Designed for ActivePieces Return Response action
- **Webhook Endpoint**: `/api/webhook/tldr` - More flexible, accepts various field names
- **API Endpoint**: `/api/tldr-update` - Standard API endpoint

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

### 4. Add HTTP Action
- Look for one of these actions in ActivePieces:
  - **"HTTP Request"** (most common)
  - **"Webhook"** 
  - **"Custom API Call"**
  - **"REST API"**
- This sends data to your app
- Configure it as follows:

#### Step-by-Step Configuration:

1. **Basic Settings**:
   - Set Method to `POST`
   - Enter URL: `https://your-app.vercel.app/api/tldr-update`

2. **Add Headers**:
   - Click "Add Header"
   - Key: `Content-Type`
   - Value: `application/json`

3. **Add Query Parameters** (mandatory field):
   - In the "Query params" text field, enter as JSON:
   
   {
    
     "source": "activepieces"
   }
   
   

4. **Configure Body**:
   - Set Body Type to `JSON`
   - Enter the JSON payload (see below)

#### Webhook Configuration:
- **Action Type**: Webhook or HTTP POST
- **URL**: `https://marketmelodrama.vercel.app/api/tldr-update`
- **Method**: `POST`
- **Headers**: 
  - `Content-Type: application/json`
- **Query Parameters** (mandatory text field):
  - Enter: `{"source": "activepieces"}`
  - Format: JSON object format
- **Payload/Body** (JSON):
```json
{
  "body": "{{your_generated_text}}"
}
```

**Important**: 
- Use **Webhook** or **HTTP POST** action, not HTTP Request
- Make sure the variable `{{your_generated_text}}` is properly quoted
- This sends data TO your app, not requests data FROM your app


**Important**: 
- Do NOT include empty fields like `"date": ""`
- Do NOT include trailing commas
- Only include the `body` field in the JSON payload

**Note**: In ActivePieces, query parameters should be added using the "Add Query Parameter" button in the HTTP Request action, not as JSON in the body.

### 5. Detailed Webhook Setup Guide

#### Step 1: Create New Workflow
1. Open ActivePieces dashboard
2. Click **"Create new workflow"**
3. Name it **"Daily Market TLDR Update"**

#### Step 2: Add Schedule Trigger
1. Click **"Add trigger"**
2. Search for **"Schedule"** or **"Cron"**
3. Select **"Schedule trigger"**
4. Set to **"Daily at 7:00 AM"** (or your preferred time)
5. Click **"Save"**

#### Step 3: Add Text Generation Step
1. Click **"Add action"**
2. Search for one of these:
   - **"OpenAI"** (for AI text generation)
   - **"Web Scraping"** (for news scraping)
   - **"Manual Input"** (if you want to write manually)
3. Configure the text generation:
   - For OpenAI: Set prompt to generate market analysis
   - For Web Scraping: Set URL to financial news site
   - For Manual: Enter your text template
4. **Note the output variable name** (e.g., `{{text}}`, `{{content}}`, `{{output}}`)

#### Step 4: Add HTTP Request Action (or Return Response)
1. Click **"Add action"** again
2. Search for **"HTTP Request"** OR **"Return Response"**
3. Select the appropriate action
4. Configure as follows:

##### Option A: HTTP Request Action

##### HTTP Request Configuration:
- **Method**: Select **"POST"** from dropdown
- **URL**: Enter `https://marketmelodrama.vercel.app/api/activepieces/tldr`
- **Headers**: 
  - Click **"Add Header"**
  - Key: `Content-Type`
  - Value: `application/json`
- **Query Parameters** (mandatory text field):
  - Enter: `{"source": "activepieces"}`
  - Format: JSON object format
- **Body**:
  - Set **Body Type** to **"JSON"**
  - Enter this JSON (webhook accepts multiple field names):
  ```json
  {
    "text": "{{your_generated_text}}"
  }
  ```
  - Alternative field names that work: `text`, `body`, `content`, `message`, `data`
  - Replace `{{your_generated_text}}` with the actual variable name from Step 3

##### Option B: Return Response Action (Your Current Setup)
- **Response Type**: JSON
- **Status**: 200
- **Headers**: 
  - Key: `Content-Type`
  - Value: `application/json`
- **JSON Body**:
  ```json
  {
    "text": "{{your_generated_text}}"
  }
  ```
- **URL to use**: `https://marketmelodrama.vercel.app/api/activepieces/tldr`

#### Step 5: Test the Workflow
1. Click **"Test"** button in ActivePieces
2. Check the response - should show success
3. Visit your app at https://marketmelodrama.vercel.app
4. Look for the TLDR widget with your test message

#### Step 6: Activate the Workflow
1. Once testing works, click **"Activate"** or **"Publish"**
2. The workflow will now run automatically on schedule

### 6. Test the Workflow
- Use the "Test" button in Activepieces
- Check your app to see if the TLDR appears
- Verify the data is stored in the `data/tldr-updates.json` file

## API Endpoint Details

### POST `/api/tldr-update`
**Purpose**: Receive daily TLDR updates

**Query Parameters** (optional):
- `date`: Override the date for the update (format: YYYY-MM-DD)
- `source`: Override the source identifier (default: "activepieces")

**Request Body**:
```json
{
  "body": "Your market analysis text here...",
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
   - Ensure the body field is not empty
   - Check the request format matches the expected schema
   - Verify query parameters are properly formatted if used

4. **"Expected JSON" or "Expected object" errors**:
   - **Query params**: Must be in JSON format, not URL format
     - ❌ Wrong: `source=activepieces`
     - ✅ Correct: `{"source": "activepieces"}`
   - **Body**: Must use "body" field, not "text"
     - ❌ Wrong: `{"text": "your text"}`
     - ✅ Correct: `{"body": "your text"}`
   - **JSON formatting**: No trailing commas, no empty fields
     - ❌ Wrong: `{"body": "text", "date": "",}`
     - ✅ Correct: `{"body": "text"}`

5. **"Text is required" or empty body errors**:
   - **Variable not populated**: Check that `{{your_generated_text}}` is properly set up
   - **Test with static text first**: Use `"body": "Test message"` to verify the connection
   - **Check variable name**: Make sure the variable name matches exactly what you set up in previous steps
   - **Verify text generation step**: Ensure the text generation action is working and outputting text

6. **"Expected JSON" errors with text content**:
   - **JSON formatting issue**: The text is not properly quoted in JSON
   - **Wrong format**: ❌ `"body": Good morning! Global stock markets...`
   - **Correct format**: ✅ `"body": "Good morning! Global stock markets..."`
   - **Solution**: Make sure the variable is wrapped in double quotes: `"{{your_generated_text}}"`

7. **Webhook/HTTP Request specific issues**:
   - **Variable not found**: Make sure the variable name matches exactly from the previous step
   - **Body Type wrong**: Set Body Type to "JSON", not "Raw" or "Text"
   - **URL incorrect**: Use `https://marketmelodrama.vercel.app/api/tldr-update`
   - **Method wrong**: Must be "POST", not "GET"
   - **Headers missing**: Add `Content-Type: application/json` header
   - **Query Parameters format**: Use `{"source": "activepieces"}` (JSON object format)

### Testing Locally:
```bash
curl -X POST http://localhost:3000/api/tldr-update \
  -H "Content-Type: application/json" \
  -d '{"body": "Test market update", "date": "2024-12-19"}'
```

### Testing with Query Parameters:
```bash
curl -X POST "http://localhost:3000/api/tldr-update?date=2024-12-19&source=test" \
  -H "Content-Type: application/json" \
  -d '{"body": "Test market update with query params"}'
```

## Next Steps

1. Set up your Activepieces workflow following this guide
2. Test with a sample text to ensure it works
3. Schedule it to run daily at your preferred time
4. Monitor the app to ensure updates are appearing correctly

The TLDR widget will automatically display the most recent update and show a history of recent updates below it.
