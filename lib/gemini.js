import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client safely
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function reviewPRWithGemini(prData) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY environment variable is not configured. Please add it to your .env.local file.');
  }

  // Use Gemini 2.5 Flash as requested
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are a senior software engineer with 10+ years of experience doing thorough, constructive, and highly technical code reviews.

Review the following Pull Request and provide structured, detailed feedback. 

PR TITLE: ${prData.title}
PR DESCRIPTION: ${prData.description}
AUTHOR: ${prData.author}
BASE BRANCH: ${prData.baseBranch}
HEAD BRANCH: ${prData.headBranch}
FILES CHANGED: ${prData.changedFiles}
ADDITIONS: +${prData.additions} lines
DELETIONS: -${prData.deletions} lines

CODE DIFF:
\`\`\`diff
${prData.diff.slice(0, 20000)}
\`\`\`

Analyze the code changes for:
1. Syntax errors, logic bugs, race conditions, memory leaks, or unhandled exceptions.
2. Safety concerns, security holes (injection, XSS, insecure storage, etc.).
3. Code style, best practices, readability, duplication, and modularity.
4. Testing coverage and general robustness.

Provide your review in the following EXACT JSON format. Return ONLY the raw JSON string, do NOT wrap it in markdown code blocks or add any trailing conversation:

{
  "summary": "2-3 sentence overall assessment of this PR",
  "score": 7,
  "verdict": "Approve" | "Request Changes" | "Needs Discussion",
  "critical": [
    {
      "file": "filename.js",
      "line": "approx line number or range",
      "issue": "Clear description of the bug or critical problem",
      "suggestion": "Specific fix or improvement"
    }
  ],
  "warnings": [
    {
      "file": "filename.js",
      "issue": "Description of the warning",
      "suggestion": "How to improve it"
    }
  ],
  "improvements": [
    {
      "category": "Performance" | "Readability" | "Security" | "Best Practice" | "Testing",
      "suggestion": "Specific improvement suggestion"
    }
  ],
  "positives": [
    "Something done well in this PR"
  ],
  "testingNotes": "Notes about test coverage and what should be tested"
}

Be specific, highly constructive, and friendly yet rigorous. Reference actual file names and line regions in your assessment.
`;

  try {
    let text;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (primaryError) {
    console.warn("Primary model 'gemini-2.5-flash' failed or overloaded. Trying 'gemini-2.5-flash-lite' fallback...", primaryError);
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const result = await fallbackModel.generateContent(prompt);
      text = result.response.text();
    } catch (fallbackError) {
      console.warn("Fallback model 'gemini-2.5-flash-lite' failed. Trying 'gemini-3.1-flash-lite'...", fallbackError);
      try {
        const fallbackModel2 = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
        const result = await fallbackModel2.generateContent(prompt);
        text = result.response.text();
      } catch (fallbackError2) {
        console.error("All model fallbacks exhausted.", fallbackError2);
        throw new Error(`Gemini AI service error: The service is currently experiencing very high demand (503 Service Unavailable). Please try again in a few moments.`);
      }
    }
  }
    
    // Clean and parse JSON response resiliently
    let cleaned = text.trim();
    
    // Attempt to extract the JSON block if the model wrapped it in markdown code blocks
    const jsonBlockRegex = /```(?:json)?([\s\S]*?)```/i;
    const match = cleaned.match(jsonBlockRegex);
    if (match) {
      cleaned = match[1].trim();
    }

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.error('JSON parsing failed. Attempting deep cleaning.', parseError);
      
      // Fallback clean: Remove accidental leading/trailing markdown characters
      cleaned = cleaned.replace(/^[^[{]*/, '').replace(/[^\]}]*$/, '');
      return JSON.parse(cleaned);
    }
  } catch (error) {
    console.error('Gemini API review error:', error);
    throw new Error(`Gemini AI service error: ${error.message}`);
  }
}
