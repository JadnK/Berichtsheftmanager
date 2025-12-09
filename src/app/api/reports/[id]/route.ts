import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { reportDate, rawContent,  } = body

    if (!reportDate || !rawContent) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      )
    }

    const report = await db.weeklyReport.findUnique({
      where: { id }
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Berichtsheft nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfen, ob für dieses Datum bereits ein anderer Bericht existiert
    const existingReport = await db.weeklyReport.findFirst({
      where: {
        apprenticeId: report.apprenticeId,
        reportDate: new Date(reportDate),
        id: { not: id } // Nicht der aktuelle Bericht
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Für dieses Datum existiert bereits ein Berichtsheft' },
        { status: 400 }
      )
    }

    const updatedReport = await db.weeklyReport.update({
      where: { id },
      data: {
        reportDate: new Date(reportDate),
        rawContent: rawContent
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

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Berichtshefts' },
      { status: 500 }
    )
  }
}