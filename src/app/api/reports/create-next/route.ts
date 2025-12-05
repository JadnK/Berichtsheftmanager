import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Für Demo-Zwecke erstellen wir einen Standard-Azubi, falls keiner existiert
    let apprentice = await db.apprentice.findFirst()
    
    if (!apprentice) {
      return NextResponse.json(
        { error: 'Kein Azubi gefunden' },
        { status: 404 }
      )
    }

    // Finde das letzte Berichtsheft
    const lastReport = await db.weeklyReport.findFirst({
      where: {
        apprenticeId: apprentice.id
      },
      orderBy: {
        reportDate: 'desc'
      }
    })

    if (!lastReport) {
      return NextResponse.json(
        { error: 'Kein Bericht gefunden. Bitte erstellen Sie zuerst einen Bericht manuell.' },
        { status: 404 }
      )
    }

    // Berechne das nächste Datum (7 Tage später)
    const nextDate = new Date(lastReport.reportDate)
    nextDate.setDate(nextDate.getDate() + 7)

    // Prüfe, ob für dieses Datum bereits ein Berichtsheft existiert
    const existingReport = await db.weeklyReport.findFirst({
      where: {
        apprenticeId: apprentice.id,
        reportDate: nextDate
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Für das nächste Datum existiert bereits ein Berichtsheft' },
        { status: 400 }
      )
    }

    // Erstelle den neuen Bericht mit Standardinhalt
    const defaultContent = `Hier kommt dein Berichtsheft-Inhalt für die Woche vom ${lastReport.reportDate.toLocaleDateString('de-DE')} bis ${nextDate.toLocaleDateString('de-DE')}...`

    const newReport = await db.weeklyReport.create({
      data: {
        reportDate: nextDate,
        rawContent: defaultContent,
        apprenticeId: apprentice.id
      },
      include: {
        apprentice: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      report: newReport,
      message: 'Nächster Bericht wurde automatisch erstellt'
    })
  } catch (error) {
    console.error('Error creating next report:', error)
    return NextResponse.json(
      { error: 'Fehler beim automatischen Erstellen des nächsten Berichts' },
      { status: 500 }
    )
  }
}