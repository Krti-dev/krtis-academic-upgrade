import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, subject, topic, difficulty, content } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    switch (type) {
      case 'practice-questions':
        prompt = `Generate 5 ${difficulty} level practice questions for ${subject} on the topic: ${topic}. Include detailed answers and explanations.`;
        break;
      case 'flashcards':
        prompt = `Create 10 flashcards for ${subject} on the topic: ${topic}. Format as JSON with "front" and "back" fields. Make them ${difficulty} difficulty.`;
        break;
      case 'summary':
        prompt = `Create a comprehensive summary of this content for ${subject}: ${content}. Structure it with key points, definitions, and important concepts.`;
        break;
      case 'study-guide':
        prompt = `Create a detailed study guide for ${subject} on ${topic}. Include key concepts, important formulas/facts, study tips, and potential exam questions.`;
        break;
      default:
        throw new Error('Invalid material type');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. Generate high-quality, pedagogically sound study materials.'
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      type,
      content: generatedContent,
      subject,
      topic,
      difficulty 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Study materials generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});