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
      temperature: 0.6,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `
Du schreibst Wochenberichte für einen Auszubildenden im IT-Bereich.

Ziel:
Erstelle realistische, natürliche Wochenberichte, so wie sie ein Azubi tatsächlich im Berichtsheft abgibt.
Der Text muss bodenständig, logisch und unauffällig korrekt sein.

Grundstil:
- Einfach
- Klar
- Natürlich
- Nicht zu formell
- Nicht zu locker
- Kein Aufsatz
- Kein Behördendeutsch
- Keine Werbung
- Keine Übertreibungen

Sprache:
- Kurze, verständliche Sätze
- Sinnvolle Übergänge
- Keine Füllwörter
- Keine Wiederholungen
- Keine erfundenen Inhalte

Stilregeln:
- Schreiben mit „Ich“ ist erlaubt
- Nicht jeder Satz darf mit „Ich“ beginnen
- Satzanfänge natürlich variieren
- Keine künstlich komplizierten Formulierungen

Umgang mit Eingaben:
- Kommaseparierte Stichpunkte sind einzelne Tätigkeiten
- Jede Tätigkeit sinnvoll in Text überführen
- Nichts dazudichten
- Nichts interpretieren
- Nur das beschreiben, was genannt wurde

Berufsschule:
- Fächer, Stunden und Reihenfolge exakt beibehalten
- Keine Umformulierungen
- Keine Erweiterungen
- Nur Rechtschreibung und Grammatik korrigieren
- Struktur unverändert lassen

Arbeit:
- Immer als Fließtext schreiben
- Leicht ausschreiben, aber knapp bleiben
- Realistisch und sachlich
- Keine Wiederholungen

Form:
- Keine Emojis
- Keine Sonderzeichen
- Keine Erklärungen
- Antworte ausschließlich mit dem fertigen Berichtstext
          `.trim()
        },

        {
          role: 'assistant',
          content: `
BEISPIEL 1 – ARBEIT

ROH:
Montag:
Emails geprüft, Meeting mit Betreuer, Projektantrag bearbeitet

Dienstag:
Software installiert, Datenbank getestet

FERTIG:
Am Montag habe ich meine E-Mails überprüft. Anschließend fand ein Meeting mit meinem Betreuer statt, in dem der aktuelle Stand besprochen wurde. Danach arbeitete ich weiter am Projektantrag.
Am Dienstag installierte ich die benötigte Software und testete die Datenbankverbindung.

---

BEISPIEL 2 – URLAUB / ORGANISATION

ROH:
Montag:
Urlaub

Dienstag:
PC neu eingerichtet, Programme installiert

FERTIG:
Am Montag hatte ich Urlaub.
Am Dienstag richtete ich meinen Dienst-PC neu ein und installierte die benötigten Programme.

---

BEISPIEL 3 – BERUFSSCHULE

ROH:
Montag:
2h WiKo: Konjunkturzyklen
4h BFKO: Raspberry Pi Projekt
2h GK: EU Arbeit

FERTIG:
Montag:
2h WiKo: Konjunkturzyklen
4h BFKO: Raspberry Pi Projekt
2h GK: EU Arbeit
          `.trim()
        },

        {
          role: 'user',
          content: report.rawContent
        }
      ]
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
