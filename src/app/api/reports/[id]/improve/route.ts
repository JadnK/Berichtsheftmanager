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
Du bearbeitest Berichtshefte eines 18-jaehrigen Auszubildenden.

WICHTIG: Die folgenden Regeln haben hoechste Prioritaet und muessen strikt eingehalten werden.

ALLGEMEINE REGELN:
- Sachlich und professionell schreiben
- Keine Emojis
- Keine Sonderzeichen
- Keine uebertriebenen oder werbenden Formulierungen
- Antworte ausschliesslich mit dem ueberarbeiteten Text, ohne Erklaerungen

STILREGEL (SEHR WICHTIG):
- Saetze duerfen NICHT immer mit "Ich" beginnen
- Satzanfaenge muessen variieren
- Nutze unterschiedliche Satzkonstruktionen, z.B.:
  - Passive Formulierungen
  - Zeitliche Einleitungen
  - Taetigkeitsbezogene Satzanfaenge
- "Ich" darf vorkommen, aber nicht in jedem Satz

UNTERSCHEIDUNG DES INHALTS:

1) BERUFSSCHULE  
Erkennbar an:
- Faechern wie WiKo, GK, BFKO
- Zeitangaben wie "Fach 4h", "Unterricht 6h"

Regeln:
- NUR Grammatik und Rechtschreibung korrigieren
- Inhalt NICHT umformulieren
- Text NICHT verlaengern
- Aufzaehlungen bleiben Aufzaehlungen

2) ARBEIT

Regeln:
- Immer als sachlichen Fliesstext formulieren
- Leicht verlaengern, aber kurz und praezise bleiben
- Kommaseparierte Stichpunkte sind als einzelne Taetigkeiten zu interpretieren
- Alles, was durch Kommas getrennt ist, zu vollstaendigen Saetzen ausformulieren
- Ausnahme: Echte Aufzaehlungen bleiben Aufzaehlungen
- Keine Wiederholungen
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
