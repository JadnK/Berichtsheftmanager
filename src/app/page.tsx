'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Check, ChevronDown, ChevronRight, Edit, FileText, Folder, FolderOpen, Plus, Wand2 } from 'lucide-react'

interface WeeklyReport {
  id: string
  weekNumber: number | null
  year: number | null
  title: string | null
  rawContent: string
  aiContent: string | null
  status: 'DRAFT' | 'COMPLETED' | 'SUBMITTED'
  reportDate: string
  startDate: string | null
  createdAt: string
  apprentice: {
    name: string
    email: string
  }
}

export default function BerichtsheftManager() {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [filteredReports, setFilteredReports] = useState<WeeklyReport[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [isLoadingReports, setIsLoadingReports] = useState(true)
  const [activeTabs, setActiveTabs] = useState<Record<string, 'raw' | 'ai'>>({})
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
  const [openYears, setOpenYears] = useState<Set<string>>(new Set())
  const [lastReportDate, setLastReportDate] = useState<string | null>(null)
  const [editingReport, setEditingReport] = useState<WeeklyReport | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    reportDate: '',
    content: ''
  })

  const [newReport, setNewReport] = useState({
    reportDate: '',
    content: ''
  })

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    if (lastReportDate && !newReport.reportDate) {
      const nextDate = new Date(lastReportDate)
      nextDate.setDate(nextDate.getDate() + 7)
      const formattedDate = nextDate.toISOString().split('T')[0]
      setNewReport({
        reportDate: formattedDate,
        content: ''
      })
    }
  }, [lastReportDate, newReport.reportDate])

  const toggleFolder = (folderKey: string) => {
    const newOpenFolders = new Set(openFolders)
    if (newOpenFolders.has(folderKey)) {
      newOpenFolders.delete(folderKey)
    } else {
      newOpenFolders.add(folderKey)
    }
    setOpenFolders(newOpenFolders)
  }

  const toggleYear = (year: string) => {
    const newOpenYears = new Set(openYears)
    if (newOpenYears.has(year)) {
      newOpenYears.delete(year)
    } else {
      newOpenYears.add(year)
    }
    setOpenYears(newOpenYears)
  }
  
  const openEditDialog = (report: WeeklyReport) => {
    setEditingReport(report)
    setEditForm({
      reportDate: report.reportDate.split('T')[0],
      content: report.rawContent
    })
    setIsEditDialogOpen(true)
  }

  const updateReport = async () => {
    if (!editingReport || !editForm.reportDate || !editForm.content) {
      toast({
        title: 'Fehler',
        description: 'Bitte fülle alle Felder aus',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`/api/reports/${editingReport.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportDate: editForm.reportDate,
          rawContent: editForm.content
        })
      })

      if (response.ok) {
        toast({
          title: 'Erfolg',
          description: 'Berichtsheft wurde aktualisiert'
        })
        setIsEditDialogOpen(false)
        setEditingReport(null)
        fetchReports()
      } else {
        throw new Error('Fehler beim Aktualisieren')
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Berichtsheft konnte nicht aktualisiert werden',
        variant: 'destructive'
      })
    }
  }
  const fetchReports = async () => {
    setIsLoadingReports(true)
    try {
      const response = await fetch('/api/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data)
        setFilteredReports(data)

        if (data.length > 0) {
          const lastReport = data.reduce((latest: WeeklyReport, report: WeeklyReport) =>
            new Date(report.reportDate) > new Date(latest.reportDate) ? report : latest
          )
          setLastReportDate(lastReport.reportDate)
        } else {
          setLastReportDate(null)
        }
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Berichtshefte konnten nicht geladen werden',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingReports(false)
    }
  }

  const createReport = async () => {
    if (!newReport.reportDate || !newReport.content) {
      toast({
        title: 'Fehler',
        description: 'Bitte fülle alle Felder aus',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportDate: newReport.reportDate,
          rawContent: newReport.content
        })
      })

      if (response.ok) {
        toast({
          title: 'Erfolg',
          description: 'Berichtsheft wurde erstellt'
        })
        setIsCreateDialogOpen(false)
        setNewReport({
          reportDate: '',
          content: ''
        })
        fetchReports()
      } else {
        throw new Error('Fehler beim Erstellen')
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Berichtsheft konnte nicht erstellt werden',
        variant: 'destructive'
      })
    }
  }
  const improveWithAI = async (reportId: string) => {
    setIsImproving(true)
    try {
      const response = await fetch(`/api/reports/${reportId}/improve`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setReports((currentReports) =>
          currentReports.map((report) =>
            report.id === reportId ? { ...report, aiContent: data.aiContent } : report
          )
        )
        setFilteredReports((currentReports) =>
          currentReports.map((report) =>
            report.id === reportId ? { ...report, aiContent: data.aiContent } : report
          )
        )
        setActiveTabs((currentTabs) => ({ ...currentTabs, [reportId]: 'ai' }))
        toast({
          title: 'Erfolg',
          description: 'Text wurde verbessert'
        })
      } else {
        throw new Error('Fehler bei der Verbesserung')
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Verbesserung fehlgeschlagen',
        variant: 'destructive'
      })
    } finally {
      setIsImproving(false)
    }
  }
  const toggleStatus = async (reportId: string, currentStatus: string) => {
    try {
      const statusOrder = ['DRAFT', 'SUBMITTED'] as const
      const normalizedStatus = currentStatus === 'COMPLETED' ? 'DRAFT' : currentStatus
      const currentIndex = statusOrder.indexOf(normalizedStatus as (typeof statusOrder)[number])
      const nextIndex = (currentIndex + 1) % statusOrder.length
      const newStatus = statusOrder[nextIndex]
      const response = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setReports(
          reports.map((report) =>
            report.id === reportId
              ? { ...report, status: newStatus as 'DRAFT' | 'SUBMITTED' }
              : report
          )
        )
        setFilteredReports(
          filteredReports.map((report) =>
            report.id === reportId
              ? { ...report, status: newStatus as 'DRAFT' | 'SUBMITTED' }
              : report
          )
        )
        const statusLabels: Record<typeof newStatus, string> = {
          DRAFT: 'Offen',
          SUBMITTED: 'Abgeschickt'
        }
        toast({
          title: 'Erfolg',
          description: `Status wurde auf ${statusLabels[newStatus]} geändert`
        })
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht geändert werden',
        variant: 'destructive'
      })
    }
  }

  const totalCount = filteredReports.length
  const openCount = filteredReports.filter((report) => report.status !== 'SUBMITTED').length
  const submittedCount = filteredReports.filter((report) => report.status === 'SUBMITTED').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-10 space-y-6">
            <div className="space-y-3">
              <Card className="border-slate-800/80 bg-slate-900/60">
                <CardHeader className="pb-2">
                  <CardDescription>Gesamt</CardDescription>
                  <CardTitle className="text-2xl text-white">{totalCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-slate-800/80 bg-slate-900/60">
                <CardHeader className="pb-2">
                  <CardDescription>Offen</CardDescription>
                  <CardTitle className="text-2xl text-violet-300">{openCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-slate-800/80 bg-slate-900/60">
                <CardHeader className="pb-2">
                  <CardDescription>Abgeschickt</CardDescription>
                  <CardTitle className="text-2xl text-violet-200">{submittedCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="w-full bg-violet-400 text-slate-950 hover:bg-violet-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                Bericht anlegen
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          {isLoadingReports && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-transparent" />
                <span>Verbinde und lade Berichtshefte...</span>
              </div>
              <div className="hidden h-1 w-32 overflow-hidden rounded-full bg-slate-800 md:block">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-violet-400/70" />
              </div>
            </div>
          )}
          <header className="flex flex-col gap-5 lg:hidden">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-violet-400 text-slate-950 hover:bg-violet-300">
                <Plus className="mr-2 h-4 w-4" />
                Bericht anlegen
              </Button>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3 lg:hidden">
            <Card className="border-slate-800/80 bg-slate-900/60">
              <CardHeader className="pb-2">
                <CardDescription>Gesamt</CardDescription>
                <CardTitle className="text-2xl text-white">{totalCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-800/80 bg-slate-900/60">
              <CardHeader className="pb-2">
                <CardDescription>Offen</CardDescription>
                <CardTitle className="text-2xl text-violet-300">{openCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-800/80 bg-slate-900/60">
              <CardHeader className="pb-2">
                <CardDescription>Abgeschickt</CardDescription>
                <CardTitle className="text-2xl text-violet-200">{submittedCount}</CardTitle>
              </CardHeader>
            </Card>
          </section>

          <section className="space-y-6">
            {Object.entries(groupReportsByYear(filteredReports)).map(([year, yearReports]) => {
              const isOpen = openYears.has(year)
              const monthGroups = groupReportsByYearMonth(yearReports)

              return (
                <Collapsible key={year} open={isOpen} onOpenChange={() => toggleYear(year)}>
                  <Card className="border-slate-800/80 bg-slate-900/60 shadow-lg shadow-black/20">
                    <CollapsibleTrigger asChild>
                      <div role="button" tabIndex={0} className="w-full cursor-pointer">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-lg">
                            <div className="flex items-center gap-2">
                              {isOpen ? (
                                <FolderOpen className="h-6 w-6 text-violet-300" />
                              ) : (
                                <Folder className="h-6 w-6 text-violet-300" />
                              )}
                              <span className="font-semibold text-white">{year}</span>
                              <Badge variant="secondary" className="ml-2 bg-violet-500/15 text-violet-200">
                                {yearReports.length} {yearReports.length === 1 ? 'Bericht' : 'Berichte'}
                              </Badge>
                            </div>
                            {isOpen ? (
                              <ChevronDown className="h-5 w-5 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            )}
                          </CardTitle>
                        </CardHeader>
                      </div>
                    </CollapsibleTrigger>
                  </Card>

                  <CollapsibleContent className="space-y-4 pl-6">
                    {Object.entries(monthGroups).map(([yearMonth, monthReports]) => {
                      const [, month] = yearMonth.split('-')
                      const monthNames = [
                        'Januar',
                        'Februar',
                        'M„rz',
                        'April',
                        'Mai',
                        'Juni',
                        'Juli',
                        'August',
                        'September',
                        'Oktober',
                        'November',
                        'Dezember'
                      ]
                      const monthName = monthNames[parseInt(month, 10) - 1]
                      const isMonthOpen = openFolders.has(yearMonth)

                      return (
                        <Collapsible key={yearMonth} open={isMonthOpen} onOpenChange={() => toggleFolder(yearMonth)}>
                          <Card className="border-slate-800/80 bg-slate-900/50">
                            <CollapsibleTrigger asChild>
                              <div role="button" tabIndex={0} className="w-full cursor-pointer">
                                <CardHeader className="pb-3">
                                  <CardTitle className="flex items-center justify-between text-base">
                                    <div className="flex items-center gap-2">
                                      {isMonthOpen ? (
                                        <FolderOpen className="h-5 w-5 text-violet-200" />
                                      ) : (
                                        <Folder className="h-5 w-5 text-violet-200" />
                                      )}
                                      <span className="font-medium text-slate-100">{monthName}</span>
                                      <Badge variant="outline" className="ml-2 border-slate-700 text-slate-300">
                                        {monthReports.length} {monthReports.length === 1 ? 'Bericht' : 'Berichte'}
                                      </Badge>
                                    </div>
                                    {isMonthOpen ? (
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-slate-400" />
                                    )}
                                  </CardTitle>
                                </CardHeader>
                              </div>
                            </CollapsibleTrigger>
                          </Card>

                          <CollapsibleContent className="space-y-4 pl-6">
                            {monthReports.map((report) => (
                              <Collapsible key={report.id}>
                                <Card className="border-slate-800/80 bg-slate-900/80 shadow-lg shadow-black/20">
                                  <CardHeader className="space-y-4">
                                    <CollapsibleTrigger asChild>
                                      <div role="button" tabIndex={0} className="w-full cursor-pointer">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                          <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-violet-300" />
                                            <div>
                                              <CardTitle className="text-lg text-white">
                                                Bericht vom {new Date(report.reportDate).toLocaleDateString('de-DE')}
                                              </CardTitle>
                                              <CardDescription className="mt-1 text-slate-400">
                                                Erstellt am {new Date(report.createdAt).toLocaleDateString('de-DE')}
                                              </CardDescription>
                                            </div>
                                          </div>
                                          <Badge
                                            variant={report.status === 'SUBMITTED' ? 'default' : 'secondary'}
                                            className={
                                              report.status === 'SUBMITTED'
                                                ? 'bg-violet-500/25 text-violet-100'
                                                : 'bg-violet-400/10 text-violet-200'
                                            }
                                          >
                                            {report.status === 'SUBMITTED' ? 'Abgeschickt' : 'Offen'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CollapsibleTrigger>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button
                                        onClick={() => toggleStatus(report.id, report.status)}
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-700 text-slate-200"
                                      >
                                        Status wechseln
                                      </Button>
                                      <Button
                                        onClick={() => openEditDialog(report)}
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-700 text-slate-200"
                                      >
                                        <Edit className="mr-1 h-4 w-4" />
                                        Ändern
                                      </Button>
                                    </div>
                                  </CardHeader>
                                  <CollapsibleContent className="px-6 pb-6">
                                    <Tabs
                                      value={activeTabs[report.id] ?? 'raw'}
                                      onValueChange={(value) =>
                                        setActiveTabs((currentTabs) => ({
                                          ...currentTabs,
                                          [report.id]: value as 'raw' | 'ai'
                                        }))
                                      }
                                      className="w-full"
                                    >
                                      <TabsList className="grid w-full grid-cols-2 bg-slate-800/70">
                                        <TabsTrigger value="raw" className="data-[state=active]:bg-slate-700">
                                          Original
                                        </TabsTrigger>
                                        <TabsTrigger
                                          value="ai"
                                          disabled={!report.aiContent}
                                          className="data-[state=active]:bg-slate-700"
                                        >
                                          Verbessern
                                          {report.aiContent && <Check className="ml-2 h-4 w-4" />}
                                        </TabsTrigger>
                                      </TabsList>
                                      <TabsContent value="raw" className="mt-4">
                                        <div className="space-y-4">
                                          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 text-sm text-slate-200">
                                            <p className="whitespace-pre-wrap">{report.rawContent}</p>
                                          </div>
                                          {!report.aiContent && (
                                            <Button
                                              onClick={() => improveWithAI(report.id)}
                                              disabled={isImproving}
                                              variant="outline"
                                              className="border-slate-700 text-slate-200"
                                            >
                                              <Wand2 className="mr-2 h-4 w-4" />
                                              {isImproving ? 'Verbesserung...' : 'Verbessern'}
                                            </Button>
                                          )}
                                        </div>
                                      </TabsContent>
                                      <TabsContent value="ai" className="mt-4">
                                        {report.aiContent && (
                                          <div className="space-y-4">
                                            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 text-sm text-slate-200">
                                              <p className="whitespace-pre-wrap">{report.aiContent}</p>
                                            </div>
                                            <Button
                                              onClick={() => improveWithAI(report.id)}
                                              disabled={isImproving}
                                              variant="outline"
                                              size="sm"
                                              className="border-slate-700 text-slate-200"
                                            >
                                              <Wand2 className="mr-2 h-4 w-4" />
                                              Erneut Verbessern
                                            </Button>
                                          </div>
                                        )}
                                      </TabsContent>
                                    </Tabs>
                                  </CollapsibleContent>
                                </Card>
                              </Collapsible>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}

            {filteredReports.length === 0 && (
              <Card className="border-slate-800/80 bg-slate-900/70">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-6 h-16 w-16 text-slate-500" />
                  <h3 className="mb-3 text-xl font-semibold text-white">Keine Berichtshefte gefunden</h3>
                  <p className="mb-6 max-w-md text-slate-400">
                    {reports.length === 0
                      ? 'Erstelle dein erstes Berichtsheft, um mit der Dokumentation zu starten.'
                      : 'Keine Berichtshefte fr die ausgew„hlte Ansicht gefunden.'}
                  </p>
                  {reports.length === 0 && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-violet-400 text-slate-950 hover:bg-violet-300"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Erstes Berichtsheft
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
        </main>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neues Berichtsheft erstellen</DialogTitle>
            <DialogDescription>Trage die Infos für dein wöchentliches Berichtsheft ein.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportDate">Berichtsdatum</Label>
              <Input
                id="reportDate"
                type="date"
                value={newReport.reportDate}
                onChange={(e) => setNewReport({ ...newReport, reportDate: e.target.value })}
                placeholder="TT.MM.JJJJ"
              />
              {lastReportDate && (
                <p className="mt-1 text-sm text-slate-400">
                  Letzter Bericht: {new Date(lastReportDate).toLocaleDateString('de-DE')}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="content">Inhalt</Label>
              <Textarea
                id="content"
                value={newReport.content}
                onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                placeholder="Schreibe hier deinen Berichtsheft-Inhalt..."
                className="min-h-32"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={createReport} className="flex-1 bg-violet-400 text-slate-950 hover:bg-violet-300">
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Berichtsheft bearbeiten</DialogTitle>
            <DialogDescription>Bearbeite die Informationen fr dein Berichtsheft.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editReportDate">Berichtsdatum</Label>
              <Input
                id="editReportDate"
                type="date"
                value={editForm.reportDate}
                onChange={(e) => setEditForm({ ...editForm, reportDate: e.target.value })}
                placeholder="TT.MM.JJJJ"
              />
            </div>
            <div>
              <Label htmlFor="editContent">Inhalt</Label>
              <Textarea
                id="editContent"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Schreibe hier deinen Berichtsheft-Inhalt..."
                className="min-h-32"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={updateReport} className="flex-1 bg-violet-400 text-slate-950 hover:bg-violet-300">
                Änderungen speichern
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-700 text-slate-200">
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function groupReportsByYear(reports: WeeklyReport[]) {
  const grouped: { [key: string]: WeeklyReport[] } = {}

  reports.forEach((report) => {
    const year = new Date(report.reportDate).getFullYear().toString()
    if (!grouped[year]) {
      grouped[year] = []
    }
    grouped[year].push(report)
  })

  return grouped
}

function groupReportsByYearMonth(reports: WeeklyReport[]) {
  const grouped: { [key: string]: WeeklyReport[] } = {}

  reports.forEach((report) => {
    const date = new Date(report.reportDate)
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const key = `${year}-${month}`

    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(report)
  })

  return grouped
}
