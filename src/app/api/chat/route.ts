import { NextResponse } from 'next/server';
import { personalities, scenarios } from '@/lib/data';

export async function POST(req: Request) {
  try {
    const { personalityId, scenarioId, messages } = await req.json();

    const personality = personalities.find(p => p.id === personalityId);
    const scenario = scenarios.find(s => s.id === scenarioId);

    if (!personality || !scenario) {
      return NextResponse.json({ error: 'Invalid personality or scenario' }, { status: 400 });
    }

    const systemPrompt = `
你是SBTI性格测试中的“${personality.title}”(${personality.name})。
${personality.prompt}

当前的情境是：${scenario.description}
在这个情境中，你扮演的角色是：【${scenario.aiRole}】。
和你对话的用户扮演的角色是：【${scenario.userRole}】。

请根据你的性格设定，以【${scenario.aiRole}】的身份和立场，简短、精炼地回复【${scenario.userRole}】（不要超过50个字）。
保持你的极端性格，沉浸在角色中，绝不能脱离角色，也不要表现出自己是个AI。
注意：
1. 直接输出你的回复内容，绝对不要在回复开头带上“老板：”、“伴侣：”等任何角色名字前缀！
2. 绝对不要包含任何“收到指令”、“正在模拟”等系统性、旁白性或动作描写的文字，必须是纯粹的人类对话！
`;

    // Filter messages to only include user and assistant (for this personality)
    // For MiniMax v2, system prompt is usually sent as a system message
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .map((m: any) => ({
          role: m.role,
          content: m.content,
        }))
    ];

    const modelName = process.env.MINIMAX_MODEL || 'abab6.5s-chat';
    const apiKey = process.env.MINIMAX_API_KEY || 'sk-mock-key';

    // Call MiniMax API directly based on official docs
    const response = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('MiniMax API response error:', errText);
      try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.error?.message || errJson.message || `HTTP ${response.status}`);
      } catch (e: any) {
        if (e.message.includes('HTTP')) throw e;
        throw new Error(`HTTP ${response.status}: ${errText.substring(0, 50)}...`);
      }
    }

    const data = await response.json();
    
    // Parse the response based on typical OpenAI-like structure from MiniMax v2
    const replyText = data.choices?.[0]?.message?.content || '【未获取到回复内容】';

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error('MiniMax API Error:', error);
    return NextResponse.json({ reply: `【API报错】${error.message}` });
  }
}
