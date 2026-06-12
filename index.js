require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

// 1. Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || 'https://mock.supabase.co', supabaseKey || 'mock-key');

// 2. Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 3. Initialize Telegraf Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const SYSTEM_PROMPT = `
# ROLE & IDENTITY
You are a smart, polite, and helpful School Assistant Telegram Bot for [ដាក់ឈ្មោះសាលារៀននៅទីនេះ]. Your main task is to extract information from the provided school database (Supabase) and present it clearly to students, parents, or staff.

# DATABASE STRUCTURAL CONTEXT
You have access to a database table filled with school data (imported from an Excel sheet). The key fields available are:
- \`student_id\`: Unique identification number of the student.
- \`student_name\`: Full name of the student.
- \`class_room\`: The grade or class name.
- \`attendance\`: Attendance record.
- \`result\`: Exam scores or grades.
- \`announcement\`: General school updates or schedule notices.

# LANGUAGE & TONE
- Always respond in polite, clear, and natural Khmer (ភាសាខ្មែរ).
- Use respectful particles like "បាទ/ចាស" and professional greetings.
- Use structured formatting (bullet points, bold text) to make responses highly readable on Telegram.

# RESPONSE LOGIC & GUIDELINES
1. **Identify User Intent:** Determine if the user is asking for student info, exam results, schedules, or general help.
2. **Handle ID Queries:** If the user provides a number or ID (e.g., "STU001" or "001"), interpret it as a query for \`student_id\`.
3. **Data Mapping:** Map the database values to a beautiful Telegram message. 
   - *Example Format:*
     🏫 **ព័ត៌មានលម្អិតរបស់សិស្ស**
     
     🔹 **ឈ្មោះសិស្ស:** [student_name]
     🔹 **អត្តសញ្ញាណប័ណ្ណ:** [student_id]
     🔹 **ថ្នាក់សិក្សា:** [class_room]
     ---
     📊 **លទ្ធផលការសិក្សា:** [result]
     📌 **អវត្តមាន:** [attendance]
4. **Data Missing/Not Found:** If the database search returns empty or no match is found, reply politely:
   "🚫 សូមអភ័យទោស ខ្ញុំមិនអាចស្វែងរកព័ត៌មានដែលលោកអ្នកស្នើសុំបានទេ។ សូមពិនិត្យមើល លេខសម្គាល់ (ID) ឬពាក្យគន្លឹះឡើងវិញ រួចព្យាយាមម្ដងទៀត។"
5. **Security & Privacy:** Do not expose raw database errors or system internal codes to the user. Always wrap errors in a friendly Khmer response.

# CRITICAL RESTRICTION
Only answer questions based on the school data or general school assistance. If a user asks something completely unrelated to school (e.g., "Who won the World Cup?"), politely redirect them back to school-related inquiries.
`;

const getStudentInfoTool = {
  name: 'get_student_info',
  description: 'Search the database for a student by their student_id or name.',
  parameters: {
    type: 'OBJECT',
    properties: {
      student_id: {
        type: 'STRING',
        description: 'The unique student ID to search for (e.g. STU001, 001, etc.)'
      }
    },
    required: ['student_id']
  }
};

// Tool implementation
async function getStudentInfo(student_id) {
  try {
    // If you haven't set up Supabase yet, this will return a mock or fail gracefully.
    // Replace 'students' with your actual table name.
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', student_id)
      .single();

    if (error) {
      console.error('Supabase Error:', error.message);
      return { status: 'error', message: 'Not found or error occurred' };
    }

    if (!data) {
      return { status: 'not_found' };
    }

    return { status: 'success', data };
  } catch (err) {
    console.error('Execution Error:', err);
    return { status: 'error', message: 'Internal system error' };
  }
}

// Keep track of chat sessions (in memory for simplicity)
const chatSessions = {};

bot.start((ctx) => {
  ctx.reply('សួស្តី! ខ្ញុំគឺជា Bot ជំនួយការសាលារៀន។ តើអ្នកចង់ឱ្យខ្ញុំជួយស្វែងរកព័ត៌មានសិស្ស ឬមានសំណួរអ្វីផ្សេងដែរឬទេ? សូមបញ្ចូលលេខសម្គាល់សិស្ស (ID) នៅទីនេះបាទ/ចាស។ 🏫');
});

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  const chatId = ctx.chat.id;

  try {
    // Send typing action
    await ctx.sendChatAction('typing');

    if (!chatSessions[chatId]) {
      chatSessions[chatId] = await ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: [getStudentInfoTool] }],
          temperature: 0.7,
        }
      });
    }

    const chat = chatSessions[chatId];
    
    // Send message to Gemini
    let response = await chat.sendMessage({ text: userMessage });

    // Handle function calls if Gemini decides to use the tool
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      
      if (functionCall.name === 'get_student_info') {
        const { student_id } = functionCall.args;
        const dbResult = await getStudentInfo(student_id);
        
        // Send the tool response back to Gemini to generate the final text
        response = await chat.sendMessage({
          functionResponses: [{
            name: 'get_student_info',
            response: dbResult
          }]
        });
      }
    }

    // Send the final response to Telegram
    const botReply = response.text;
    if (botReply) {
      await ctx.reply(botReply, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply("សូមអភ័យទោស មានបញ្ហាបន្តិចបន្តួច។ សូមព្យាយាមម្តងទៀត។");
    }

  } catch (error) {
    console.error('Bot Error:', error);
    await ctx.reply('🚫 សូមអភ័យទោស ប្រព័ន្ធមានបញ្ហាខាងបច្ចេកទេសបន្តិចបន្តួច។ សូមរង់ចាំបន្តិចសិន។');
  }
});

if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_here') {
  bot.launch().then(() => {
    console.log('🤖 Bot is up and running!');
  }).catch(err => {
    console.error('Failed to launch bot:', err);
  });
} else {
  console.log('⚠️ Please set TELEGRAM_BOT_TOKEN in .env to start the bot.');
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
