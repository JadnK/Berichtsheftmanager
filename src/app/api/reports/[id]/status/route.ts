import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['DRAFT', 'SUBMITTED', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Ungültiger Status' },
        { status: 400 }
      )
    }
    const normalizedStatus = status === 'COMPLETED' ? 'DRAFT' : status

    const report = await db.weeklyReport.findUnique({
      where: { id }
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Berichtsheft nicht gefunden' },
        { status: 404 }
      )
    }

    const updatedReport = await db.weeklyReport.update({
      where: { id },
      data: {
        status: normalizedStatus
      }
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('Error updating report status:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Status' },
      { status: 500 }
    )
  }
}
