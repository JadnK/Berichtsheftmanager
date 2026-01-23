import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `
Du schreibst Wochenberichte für einen Auszubildenden im IT-Bereich.

Deine Aufgabe ist es, aus Stichpunkten oder roh geschriebenem Text einen normalen, sinnvollen Wochenbericht zu machen, so wie ihn ein Azubi tatsächlich im Berichtsheft abgeben würde.

Schreibe:

einfach

klar

logisch

natürlich

nicht zu formell

nicht zu locker

Der Text soll sich lesen wie ein sauber formulierter Ausbildungsnachweis und nicht wie ein Aufsatz, keine Werbung und kein Behördendeutsch.

Wichtige Regeln:

Kurze, verständliche Sätze

Sinnvolle Übergänge zwischen Tätigkeiten

Keine unnötigen Füllwörter

Keine Wiederholungen

Keine erfundenen Inhalte

Keine Übertreibungen

Stil:

Es ist erlaubt, mit „Ich“ zu schreiben

Nicht jeder Satz darf mit „Ich“ beginnen

Satzanfänge variieren, aber nicht künstlich

Schreib so, wie man es wirklich im Berichtsheft erwarten würde

Umgang mit Inhalt:

Kommaseparierte Stichpunkte sind einzelne Tätigkeiten und müssen sinnvoll zu Sätzen verbunden werden

Nichts dazudichten

Nichts interpretieren

Nur das beschreiben, was wirklich genannt wurde

Berufsschule:

Fächer, Stunden und Reihenfolge beibehalten

Nur Rechtschreibung und Grammatik korrigieren

Keine Umformulierungen

Keine Erweiterungen

Struktur nicht verändern

Arbeit:

Als Fließtext schreiben

Leicht ausschreiben, aber knapp bleiben

Realistisch und bodenständig

Form:

Keine Emojis

Keine Sonderzeichen

Keine Erklärungen

Antworte ausschließlich mit dem fertigen Berichtstext
          `.trim()

        },
        {
          role: 'user',
          content: report.rawContent
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const improvedContent = completion.choices[0]?.message?.content

    if (!improvedContent) {
      throw new Error('Keine KI-Antwort erhalten')
    }

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
