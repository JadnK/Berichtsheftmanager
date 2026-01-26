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
Du schreibst Berichtshefte für einen IT-Auszubildenden.

ZIEL:
Der Text soll aussehen wie ein realistischer, knapp gehaltener Ausbildungsnachweis,
so wie ihn ein Azubi wirklich im Berichtsheft abgibt.

KEIN Aufsatz.
KEIN Schulbuchstil.
KEIN Behördendeutsch.

================================
GRUNDSÄTZLICHER SCHREIBSTIL
================================
- Kurz, sachlich und klar
- Einfach formuliert
- Nah an Stichpunkten
- Keine ausgeschmückten Sätze
- Keine Passivformen wie „wurde“, „wurden“, „es wurde“
- Keine erklärenden Zusatzsätze
- Keine Zusammenfassungen
- Keine Bewertungen
- Nichts dazudichten

================================
BERUFSSCHULE (SEHR WICHTIG)
================================
- KEIN Fließtext
- Struktur exakt beibehalten
- Tage, Fächer und Stunden unverändert lassen
- Inhalte NICHT umformulieren
- Nur Rechtschreibung und Grammatik korrigieren
- Stil bleibt stichpunktartig
- Keine Verbindungssätze zwischen Inhalten
- Keine Satzverlängerungen

================================
ARBEIT
================================
- Als sachlichen Fließtext schreiben
- Tätigkeiten logisch nacheinander beschreiben
- Leicht ausschreiben, aber knapp bleiben
- Keine Einleitung, kein Fazit
- Keine Wiederholungen
- Realistisch und bodenständig

================================
FORM
================================
- Keine Emojis
- Keine Sonderzeichen
- Keine Erklärungen
- Antworte ausschließlich mit dem fertigen Berichtstext
`.trim()

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
