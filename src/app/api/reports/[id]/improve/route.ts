import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await db.weeklyReport.findUnique({
      where: { id }
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Berichtsheft nicht gefunden' },
        { status: 404 }
      )
    }

    // KI-Verbesserung mit z-ai-web-dev-sdk
    const zai = await ZAI.create()
    
    const prompt = `Verbessere den folgenden Text grob was Grammatik/Rechtschreibung betrifft, es soll wie ein 18 jähriger Azubi klingen. Wichtig: Verwende keine Emojis, Sonderzeichen oder übertriebene Ausdrücke. Halte den Ton natürlich und professionell für einen Azubibericht.

${report.rawContent}`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Du bist ein hilfreicher Assistent, der Texte von Azubis verbessert. Du verbesserst nur Grammatik und Rechtschreibung und passt den Ton an, dass er wie ein 18-jähriger Azubi klingt. Wichtig: Verwende niemals Emojis, Sonderzeichen oder übertriebene Ausdrücke. Halte den Ton natürlich und professionell für einen Azubibericht.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const improvedContent = completion.choices[0]?.message?.content

    if (!improvedContent) {
      throw new Error('Keine KI-Antwort erhalten')
    }

    // Speichere den verbesserten Inhalt in der Datenbank
    const updatedReport = await db.weeklyReport.update({
      where: { id },
      data: {
        aiContent: improvedContent
      }
    })

    return NextResponse.json({ 
      aiContent: improvedContent,
      report: updatedReport 
    })
  } catch (error) {
    console.error('Error improving report with AI:', error)
    return NextResponse.json(
      { error: 'Fehler bei der KI-Verbesserung des Berichtshefts' },
      { status: 500 }
    )
  }
}