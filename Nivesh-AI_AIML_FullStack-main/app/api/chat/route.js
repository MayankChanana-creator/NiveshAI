import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Backend Tools Logic ───────────────────────────────────────────────────────
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const tools = [
  {
    type: "function",
    function: {
      name: "get_portfolio",
      description: "Get the user's current investment portfolio (stocks, mutual funds, etc.). The userId is already known — always use it automatically, never ask the user.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "The user's ID (auto-injected, never ask user)" },
        },
        required: ["userId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_stock_details",
      description: "Get real-time price, quote, and profile information for a specific stock symbol (e.g. TCS.NS, AAPL, RELIANCE.NS)",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "The ticker symbol, e.g. INFY.NS" },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_stock_news",
      description: "Get the latest market news and updates for a specific stock symbol",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "The ticker symbol" },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sandbox_dashboard",
      description: "Get the user's sandbox trading status, including level, credit score, and current strategy. The userId is already known — always use it automatically.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "The user's ID (auto-injected, never ask user)" },
        },
        required: ["userId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "plan_financial_goal",
      description: "Generates an autonomous financial plan to achieve a specific target amount. Use this when the user mentions saving for a goal like a house, car, retirement, or target amount over a specific timeframe.",
      parameters: {
        type: "object",
        properties: {
          target_amount: { type: "number", description: "The target numerical amount in INR to save (e.g. 2000000 for 20 Lakhs)" },
          timeframe_years: { type: "number", description: "The total timeframe the user has to save this amount in years (e.g. 5)" },
          risk_profile: { type: "string", description: "The risk profile based on user's urgency or preferences (conservative, moderate, aggressive)" },
          goal_name: { type: "string", description: "A simple name for the goal (e.g. 'House Down Payment', 'Retirement Corpus')" },
        },
        required: ["target_amount", "timeframe_years", "risk_profile", "goal_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_portfolio",
      description: "Add a stock, mutual fund, or cryptocurrency to the user's investment portfolio. Use this IMMEDIATELY whenever the user says they want to add, buy, invest in, or include any asset in their portfolio. Do NOT ask for confirmation — just add it. The userId is already known — always use it automatically.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "The user's ID (auto-injected, never ask user)" },
          symbol: { type: "string", description: "The ticker symbol of the asset (e.g. TCS.NS, RELIANCE.NS, BTC, HDFCMF). For Indian stocks use .NS suffix, for crypto use the coin symbol, for mutual funds use a short identifier." },
          name: { type: "string", description: "The human-readable name of the asset (e.g. 'Tata Consultancy Services', 'Bitcoin', 'HDFC Mid-Cap Opportunities Fund')" },
          item_type: { type: "string", enum: ["stock", "crypto", "mutual_fund"], description: "The type of asset being added" },
        },
        required: ["userId", "symbol", "name", "item_type"],
      },
    },
  },
];

async function callTool(name, args) {
  try {
    if (name === "get_portfolio") {
      const r = await fetch(`${BACKEND_URL}/api/portfolio/${args.userId}`);
      if (r.ok) {
        const data = await r.json();
        if (!data || (Array.isArray(data) && data.length === 0)) {
          return { info: "The user's portfolio is currently empty. They haven't added any investments yet. Encourage them to explore stocks, mutual funds, or crypto on the platform." };
        }
        return data;
      }
      return { info: "Portfolio data is temporarily unavailable. Provide general financial guidance instead." };
    }
    if (name === "get_stock_details") {
      const [q, p] = await Promise.all([
        fetch(`${BACKEND_URL}/api/stock/quote/${args.symbol}`).then(r => r.ok ? r.json() : null),
        fetch(`${BACKEND_URL}/api/stock/profile/${args.symbol}`).then(r => r.ok ? r.json() : null),
      ]);
      if (!q && !p) {
        return { info: `Could not fetch live data for ${args.symbol}. Provide analysis based on your general knowledge of this stock.` };
      }
      return { quote: q, profile: p };
    }
    if (name === "get_stock_news") {
      const r = await fetch(`${BACKEND_URL}/api/stock/news/${args.symbol}`);
      if (r.ok) {
        const data = await r.json();
        if (!data || (Array.isArray(data) && data.length === 0)) {
          return { info: `No recent news found for ${args.symbol}. Provide a general market outlook for this stock based on your knowledge.` };
        }
        return data;
      }
      return { info: `News feed is temporarily unavailable for ${args.symbol}. Share general insights about this stock's sector and recent trends.` };
    }
    if (name === "get_sandbox_dashboard") {
      const r = await fetch(`${BACKEND_URL}/api/tradeverse/dashboard/${args.userId}`);
      if (r.ok) {
        return await r.json();
      }
      return { info: "Sandbox data is not yet available for this user. They may not have started sandbox trading yet. Explain how the sandbox works and encourage them to try it." };
    }
    if (name === "plan_financial_goal") {
      const r = await fetch(`${BACKEND_URL}/api/goal-plan/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args)
      });
      if (r.ok) {
        const data = await r.json();
        // IMPORTANT: We tell the LLM exactly what string to output to trigger the widget
        return { 
          info: "The agent calculated the financial plan correctly. DO NOT try to explain the plan or print the numbers. YOU MUST ONLY output the following exact markdown on a new line to render the interactive widget:", 
          widget_payload: `\`\`\`goal\n${JSON.stringify(data)}\n\`\`\``
        };
      }
      return { info: "Goal planning engine is temporarily unavailable. Provide general advice on how to save for goals based on standard practices." };
    }
    if (name === "add_to_portfolio") {
      const r = await fetch(`${BACKEND_URL}/api/portfolio/add/${args.userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: args.symbol,
          name: args.name,
          item_type: args.item_type,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        return { 
          success: true, 
          info: `Successfully added ${args.name} (${args.symbol}) as a ${args.item_type} to the user's portfolio.`,
          item: data 
        };
      }
      const errorBody = await r.text();
      if (r.status === 400 && errorBody.includes("already")) {
        return { success: false, info: `${args.name} (${args.symbol}) is already in the user's portfolio. Let them know it's already added.` };
      }
      return { success: false, info: `Could not add ${args.name} to portfolio right now. Acknowledge the request and suggest the user try again through the dashboard.` };
    }
  } catch (err) {
    console.error(`Tool call error [${name}]:`, err);
    return { info: `The ${name} service is momentarily busy. Provide helpful information from your general financial knowledge instead.` };
  }
}

// ── API Route Handler ────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const { messages, userId, lang = "en" } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const userIdDisplay = userId || "guest";

    const systemPrompt = `
You are "AI Dost", the WealthPulse platform's expert financial assistant — warm, confident, and deeply knowledgeable.

═══ IDENTITY ═══
- You are a trusted financial advisor and friend.
- Respond in ${lang === 'hi' ? 'HINDI' : 'ENGLISH'} only.
- Be conversational, professional, and insightful.

═══ USER CONTEXT (CRITICAL) ═══
- The currently logged-in user's ID is: "${userIdDisplay}"
- You ALREADY KNOW their identity. NEVER ask the user for their ID, user ID, email, or any identifying information.
- When calling tools like get_portfolio, get_sandbox_dashboard, or add_to_portfolio, ALWAYS use "${userIdDisplay}" as the userId. Do NOT ask the user for this.

═══ RESPONSE RULES ═══
1. **NEVER say** "I don't have access to that", "I cannot access", "I'm unable to retrieve", or any variation. This is STRICTLY FORBIDDEN.
2. If a tool returns an error or empty data, seamlessly provide helpful information from your own financial expertise. Frame it positively — e.g., "Here's what I can share about that..." or "Based on current market trends...".
3. If portfolio is empty, say something like "You haven't added investments to your portfolio yet. Here's how to get started..." — never say you "can't access" it.
4. ALWAYS have something valuable to say. You are a knowledgeable financial expert with deep understanding of Indian and global markets.

═══ PORTFOLIO MANAGEMENT (VERY IMPORTANT) ═══
You have the ability to ADD assets directly to the user's portfolio using the 'add_to_portfolio' tool.
**RULES FOR ADDING TO PORTFOLIO:**
1. When the user says ANY of the following, you MUST call 'add_to_portfolio' IMMEDIATELY:
   - "Add X to my portfolio"
   - "I want to invest in X"
   - "Buy X"
   - "Include X in my portfolio"
   - "I want X in my holdings"
   - "Put X in my portfolio"
   - "Track X for me"
   - Any variation implying they want an asset added
2. Do NOT ask for confirmation before adding. If the user explicitly says to add something, just DO IT.
3. After successfully adding, confirm with a brief message like "Done! I've added **X** to your portfolio."
4. If the user mentions multiple assets to add, call add_to_portfolio for EACH one.
5. For Indian stocks, use the .NS suffix (e.g., RELIANCE.NS, TCS.NS, TATAMOTORS.NS).
6. For crypto, use standard symbols (e.g., BTC, ETH, SOL).
7. For mutual funds, use a short meaningful identifier.
8. You MUST determine the correct symbol and name yourself based on your knowledge. Do NOT ask the user for the symbol.

═══ FORMATTING ═══
- Use **bold** for key terms, numbers, and important concepts
- Use ## for section headers when organizing information
- Use bullet points (- ) for lists
- Use numbered lists (1. 2. 3.) for steps
- Structure your answers clearly with sections when the answer is longer than 2-3 sentences
- Keep responses focused and under 250 words unless the user asks for detailed analysis

═══ CAPABILITIES ═══
- Call 'get_portfolio' with userId "${userIdDisplay}" to view user's holdings
- Call 'add_to_portfolio' with userId "${userIdDisplay}" to add stocks, crypto, or mutual funds to user's portfolio
- Call 'get_stock_details' for real-time stock data
- Call 'get_stock_news' for market news
- Call 'get_sandbox_dashboard' with userId "${userIdDisplay}" for sandbox progress
- If tools fail, switch to your expert knowledge — the user should never know about any technical issues

═══ CONSTRAINTS ═══
- Do NOT give direct buy/sell advice. Use terms like "this might be worth exploring" or "the data suggests".
- Present yourself as a knowledgeable friend, not a robot.
`;

    // 1. Initial Call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      tools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;

    // 2. Handle Tool Calls if any
    if (responseMessage.tool_calls) {
      const toolMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
        responseMessage
      ];

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        // ALWAYS inject userId for tools that need it — never rely on LLM to provide it
        if (functionName === "get_portfolio" || functionName === "get_sandbox_dashboard" || functionName === "add_to_portfolio") {
          functionArgs.userId = userId || userIdDisplay;
        }

        const toolResult = await callTool(functionName, functionArgs);

        toolMessages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(toolResult),
        });
      }

      // Final completion after tools — with extra instruction to format nicely
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          ...toolMessages,
          {
            role: "system",
            content: "REMINDER: Format your response with **bold** for key data, ## headers for sections, and - bullets for lists. NEVER say you cannot access something. If data was empty or errored, provide helpful expert insights instead."
          }
        ],
      });

      return NextResponse.json(finalResponse.choices[0].message);
    }

    // Default simple response
    return NextResponse.json(responseMessage);

  } catch (error) {
    console.error("AI Dost Agent Error:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
