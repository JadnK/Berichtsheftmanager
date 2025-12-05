'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from '@/hooks/use-toast'
import { CalendarDays, FileText, Wand2, Search, Plus, Edit, Check, Folder, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react'


interface WeeklyReport {
  id: string
  weekNumber: number | null
  year: number | null
  title: string | null
  rawContent: string
  aiContent: string | null
  status: 'DRAFT' | 'COMPLETED'
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
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
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
    // Automatisch das nächste Datum setzen, wenn ein Bericht existiert
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

  const createNextReport = async () => {
    try {
      const response = await fetch('/api/reports/create-next', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Erfolg",
          description: data.message || "Nächster Bericht wurde automatisch erstellt"
        })
        fetchReports()
      } else {
        const error = await response.json()
        toast({
          title: "Hinweis",
          description: error.error || "Konnte nächsten Bericht nicht automatisch erstellen",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim automatischen Erstellen des nächsten Berichts",
        variant: "destructive"
      })
    }
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
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive"
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
          title: "Erfolg",
          description: "Berichtsheft wurde aktualisiert"
        })
        setIsEditDialogOpen(false)
        setEditingReport(null)
        fetchReports()
      } else {
        throw new Error('Fehler beim Aktualisieren')
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Berichtsheft konnte nicht aktualisiert werden",
        variant: "destructive"
      })
    }
  }

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data)
        setFilteredReports(data) // Direkt setzen, da keine Filter mehr
        
        // Finde das letzte Berichtsdatum für die automatische Berechnung
        if (data.length > 0) {
          const lastReport = data.reduce((latest: any, report: any) => 
            new Date(report.reportDate) > new Date(latest.reportDate) ? report : latest
          )
          setLastReportDate(lastReport.reportDate)
        } else {
          setLastReportDate(null)
        }
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Berichtshefte konnten nicht geladen werden",
        variant: "destructive"
      })
    }
  }

  

  const createReport = async () => {
    if (!newReport.reportDate || !newReport.content) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive"
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
          title: "Erfolg",
          description: "Berichtsheft wurde erstellt"
        })
        setIsCreateDialogOpen(false)
        setNewReport({
          reportDate: '',
          content: ''
        })
        fetchReports() // Das wird auch lastReportDate aktualisieren
      } else {
        throw new Error('Fehler beim Erstellen')
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Berichtsheft konnte nicht erstellt werden",
        variant: "destructive"
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
        setReports(reports.map(report => 
          report.id === reportId 
            ? { ...report, aiContent: data.aiContent }
            : report
        ))
        toast({
          title: "Erfolg",
          description: "Text wurde mit KI verbessert"
        })
      } else {
        throw new Error('Fehler bei der KI-Verbesserung')
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "KI-Verbesserung fehlgeschlagen",
        variant: "destructive"
      })
    } finally {
      setIsImproving(false)
    }
  }

  const toggleStatus = async (reportId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'DRAFT' ? 'COMPLETED' : 'DRAFT'
      const response = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setReports(reports.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus as 'DRAFT' | 'COMPLETED' }
            : report
        ))
        toast({
          title: "Erfolg",
          description: `Status wurde auf ${newStatus === 'COMPLETED' ? 'Fertig' : 'In Bearbeitung'} geändert`
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Berichtsheft Manager</h1>
          <p className="text-muted-foreground">
            Verwalte deine wöchentlichen Berichtshefte und verbessere sie mit KI
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Neues Berichtsheft
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Neues Berichtsheft erstellen</DialogTitle>
                <DialogDescription>
                  Fülle die Informationen für dein wöchentliches Berichtsheft aus
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reportDate">Berichtsdatum</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={newReport.reportDate}
                    onChange={(e) => setNewReport({...newReport, reportDate: e.target.value})}
                    placeholder="TT.MM.JJJJ"
                  />
                  {lastReportDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Letzter Bericht: {new Date(lastReportDate).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="content">Inhalt</Label>
                  <Textarea
                    id="content"
                    value={newReport.content}
                    onChange={(e) => setNewReport({...newReport, content: e.target.value})}
                    placeholder="Schreibe hier deinen Berichtsheft-Inhalt..."
                    className="min-h-32"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createReport} className="flex-1">
                    Berichtsheft erstellen
                  </Button>
                  {reports.length > 0 && (
                    <Button 
                      onClick={createNextReport} 
                      variant="outline"
                    >
                      Nächster automatisch
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Berichtsheft bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeite die Informationen für dein Berichtsheft
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editReportDate">Berichtsdatum</Label>
              <Input
                id="editReportDate"
                type="date"
                value={editForm.reportDate}
                onChange={(e) => setEditForm({...editForm, reportDate: e.target.value})}
                placeholder="TT.MM.JJJJ"
              />
            </div>
            <div>
              <Label htmlFor="editContent">Inhalt</Label>
              <Textarea
                id="editContent"
                value={editForm.content}
                onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                placeholder="Schreibe hier deinen Berichtsheft-Inhalt..."
                className="min-h-32"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={updateReport} className="flex-1">
                Änderungen speichern
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Berichtsheft Liste mit Jahr/Monat-Struktur */}
      <div className="space-y-6">
        {Object.entries(groupReportsByYear(filteredReports)).map(([year, yearReports]) => {
          const isOpen = openYears.has(year)
          const monthGroups = groupReportsByYearMonth(yearReports)
          
          return (
            <Collapsible key={year} open={isOpen} onOpenChange={() => toggleYear(year)}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-2">
                        {isOpen ? <FolderOpen className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                        {year}
                        <Badge variant="secondary" className="ml-2">
                          {yearReports.length} {yearReports.length === 1 ? 'Bericht' : 'Berichte'}
                        </Badge>
                      </div>
                      {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
              </Card>
              
              <CollapsibleContent className="space-y-4 pl-8">
                {Object.entries(monthGroups).map(([yearMonth, monthReports]) => {
                  const [_, month] = yearMonth.split('-')
                  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                                   'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
                  const monthName = monthNames[parseInt(month) - 1]
                  const isMonthOpen = openFolders.has(yearMonth)
                  
                  return (
                    <Collapsible key={yearMonth} open={isMonthOpen} onOpenChange={() => toggleFolder(yearMonth)}>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between text-md">
                              <div className="flex items-center gap-2">
                                {isMonthOpen ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                                {monthName}
                                <Badge variant="outline" className="ml-2">
                                  {monthReports.length} {monthReports.length === 1 ? 'Bericht' : 'Berichte'}
                                </Badge>
                              </div>
                              {isMonthOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                      </Card>
                      
                      <CollapsibleContent className="space-y-4 pl-6">
                        {monthReports.map((report) => (
                          <Card key={report.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Bericht vom {new Date(report.reportDate).toLocaleDateString('de-DE')}
                                  </CardTitle>
                                  <CardDescription>
                                    Erstellt am {new Date(report.createdAt).toLocaleDateString('de-DE')}
                                  </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    onClick={() => openEditDialog(report)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Bearbeiten
                                  </Button>
                                  <Badge variant={report.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                    {report.status === 'COMPLETED' ? 'Fertig' : 'In Bearbeitung'}
                                  </Badge>
                                  <Switch
                                    checked={report.status === 'COMPLETED'}
                                    onCheckedChange={() => toggleStatus(report.id, report.status)}
                                  />
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Tabs defaultValue="raw" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="raw">Original</TabsTrigger>
                                  <TabsTrigger value="ai" disabled={!report.aiContent}>
                                    KI-verbessert
                                    {report.aiContent && <Check className="w-4 h-4 ml-2" />}
                                  </TabsTrigger>
                                </TabsList>
                                <TabsContent value="raw" className="mt-4">
                                  <div className="space-y-4">
                                    <div className="prose prose-sm max-w-none">
                                      <p className="whitespace-pre-wrap">{report.rawContent}</p>
                                    </div>
                                    {!report.aiContent && (
                                      <Button 
                                        onClick={() => improveWithAI(report.id)}
                                        disabled={isImproving}
                                        variant="outline"
                                      >
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        {isImproving ? 'Verbessere...' : 'Mit KI verbessern'}
                                      </Button>
                                    )}
                                  </div>
                                </TabsContent>
                                <TabsContent value="ai" className="mt-4">
                                  {report.aiContent && (
                                    <div className="space-y-4">
                                      <div className="prose prose-sm max-w-none">
                                        <p className="whitespace-pre-wrap">{report.aiContent}</p>
                                      </div>
                                      <Button 
                                        onClick={() => improveWithAI(report.id)}
                                        disabled={isImproving}
                                        variant="outline"
                                        size="sm"
                                      >
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Neu verbessern
                                      </Button>
                                    </div>
                                  )}
                                </TabsContent>
                              </Tabs>
                            </CardContent>
                          </Card>
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Berichtshefte gefunden</h3>
              <p className="text-muted-foreground text-center mb-4">
                {reports.length === 0 
                  ? "Erstelle dein erstes Berichtsheft"
                  : "Keine Berichtshefte für die ausgewählten Filter gefunden"
                }
              </p>
              {reports.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Erstes Berichtsheft erstellen
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Hilfsfunktion zur Gruppierung der Berichte nach Jahr
function groupReportsByYear(reports: WeeklyReport[]) {
  const grouped: { [key: string]: WeeklyReport[] } = {}
  
  reports.forEach(report => {
    const year = new Date(report.reportDate).getFullYear().toString()
    if (!grouped[year]) {
      grouped[year] = []
    }
    grouped[year].push(report)
  })
  
  return grouped
}

// Hilfsfunktion zur Gruppierung der Berichte nach Jahr und Monat (basierend auf reportDate)
function groupReportsByYearMonth(reports: WeeklyReport[]) {
  const grouped: { [key: string]: WeeklyReport[] } = {}
  
  reports.forEach(report => {
    // Verwende reportDate für die Gruppierung
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