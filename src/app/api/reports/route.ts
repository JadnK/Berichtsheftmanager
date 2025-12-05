import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Für Demo-Zwecke erstellen wir einen Standard-Azubi, falls keiner existiert
    let apprentice = await db.apprentice.findFirst()
    
    if (!apprentice) {
      apprentice = await db.apprentice.create({
        data: {
          name: 'Demo Azubi',
          email: 'demo@azubi.de'
        }
      })
    }

    const reports = await db.weeklyReport.findMany({
      where: {
        apprenticeId: apprentice.id
      },
      orderBy: {
        createdAt: 'desc'
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

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Berichtshefte' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportDate, rawContent } = body

    if (!reportDate || !rawContent) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      )
    }

    // Für Demo-Zwecke erstellen wir einen Standard-Azubi, falls keiner existiert
    let apprentice = await db.apprentice.findFirst()
    
    if (!apprentice) {
      apprentice = await db.apprentice.create({
        data: {
          name: 'Demo Azubi',
          email: 'demo@azubi.de'
        }
      })
    }

    // Prüfen, ob für dieses Datum bereits ein Berichtsheft existiert
    const existingReport = await db.weeklyReport.findFirst({
      where: {
        apprenticeId: apprentice.id,
        reportDate: new Date(reportDate)
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Für dieses Datum existiert bereits ein Berichtsheft' },
        { status: 400 }
      )
    }

    // Erstelle den Bericht ohne Startdatum
    const report = await db.weeklyReport.create({
      data: {
        reportDate: new Date(reportDate),
        rawContent,
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

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Berichtshefts' },
      { status: 500 }
    )
  }
}