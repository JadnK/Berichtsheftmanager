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

          ZIEL:
          Der Text soll genauso klingen wie ein normaler, sauber geschriebener Ausbildungsnachweis:
          - einfach
          - verständlich
          - leicht ausgeschrieben
          - nicht zu formell
          - nicht zu lang
          - realistisch für einen Azubi

          ALLGEMEINE REGELN:
          - Sachlich, aber locker schreiben
          - Keine Emojis
          - Keine Sonderzeichen
          - Keine komplizierten oder hochgestochenen Formulierungen
          - Kein Werbestil
          - Keine Floskeln
          - Antworte ausschließlich mit dem fertigen Text, ohne Erklärungen

          SPRACHSTIL (SEHR WICHTIG):
          - Leichtes, natürliches Deutsch
          - So schreiben, wie ein Azubi berichten würde, aber grammatikalisch korrekt
          - Texte sollen ungefähr eine Word-Seite pro Woche füllen, aber nicht künstlich aufgebläht sein
          - Keine unnötigen Details hinzufügen
          - Nicht akademisch, nicht behördlich

          SATZANFÄNGE:
          - Sätze dürfen nicht immer mit "Ich" beginnen
          - Satzanfänge variieren
          - Mischung aus:
            - zeitlichen Einleitungen
            - tätigkeitsbezogenen Satzanfängen
            - normalen Ich-Sätzen
          - "Ich" ist erlaubt, aber nicht in jedem Satz

          UNTERSCHEIDUNG DES INHALTS:

          1) BERUFSSCHULE
          Erkennbar an:
          - Fächern wie WiKo, GK, BFKO, Deutsch, Englisch usw.
          - Zeitangaben wie "2h", "4h"

          Regeln:
          - Fächer und Stunden beibehalten
          - Nur Grammatik und Rechtschreibung korrigieren
          - Inhalt nicht umformulieren
          - Nicht verlängern
          - Struktur bleibt gleich
          - Keine zusätzlichen Erklärungen hinzufügen

          2) ARBEIT
          Regeln:
          - Als kurzen, sauberen Fließtext formulieren
          - Stichpunkte leicht ausschreiben
          - Tätigkeiten logisch verbinden
          - Inhalte minimal erweitern, aber bodenständig bleiben
          - Keine Wiederholungen
          - Kein Fachchinesisch erfinden
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
