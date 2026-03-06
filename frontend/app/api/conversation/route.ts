import { NextRequest, NextResponse } from 'next/server';
import { generateConversationTurn } from '@/lib/claude';
import { ConversationTurn } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { history, scenario }: { history: ConversationTurn[]; scenario: string } = body;

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario is required' }, { status: 400 });
    }

    const result = await generateConversationTurn(history ?? [], scenario);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Conversation error:', error);
    return NextResponse.json(
      { error: 'Conversation failed. Please try again.' },
      { status: 500 }
    );
  }
}
