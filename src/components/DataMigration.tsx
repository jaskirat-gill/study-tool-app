'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, Upload } from 'lucide-react'
import { saveStudySet, saveStudyNotes, saveStudySession } from '@/lib/storage'
import { StudySet, StudyNotes, StudySession } from '@/types'

interface MigrationStatus {
  studySets: { total: number; migrated: number; errors: string[] }
  studyNotes: { total: number; migrated: number; errors: string[] }
  studySessions: { total: number; migrated: number; errors: string[] }
}

export function DataMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<MigrationStatus | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const migrateFromLocalStorage = async () => {
    setIsRunning(true)
    setError('')
    setSuccess('')
    
    const migrationStatus: MigrationStatus = {
      studySets: { total: 0, migrated: 0, errors: [] },
      studyNotes: { total: 0, migrated: 0, errors: [] },
      studySessions: { total: 0, migrated: 0, errors: [] },
    }

    try {
      // Migrate Study Sets
      const studySetsData = localStorage.getItem('study-tool-sets')
      if (studySetsData) {
        const rawStudySets = JSON.parse(studySetsData)
        const studySets: StudySet[] = rawStudySets.map((set: Record<string, unknown>) => ({
          ...set,
          created: new Date(set.created as string),
          lastModified: new Date(set.lastModified as string),
          flashcards: (set.flashcards as Array<Record<string, unknown>>)?.map((card) => ({
            ...card,
            created: new Date(card.created as string),
            lastReviewed: card.lastReviewed ? new Date(card.lastReviewed as string) : undefined,
          })) || [],
        }))

        migrationStatus.studySets.total = studySets.length

        for (const studySet of studySets) {
          try {
            await saveStudySet(studySet)
            migrationStatus.studySets.migrated++
          } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error'
            migrationStatus.studySets.errors.push(`${studySet.title}: ${error}`)
          }
          setStatus({ ...migrationStatus })
        }
      }

      // Migrate Study Notes
      const studyNotesData = localStorage.getItem('study-tool-notes')
      if (studyNotesData) {
        const rawStudyNotes = JSON.parse(studyNotesData)
        const studyNotes: StudyNotes[] = rawStudyNotes.map((note: Record<string, unknown>) => ({
          ...note,
          created: new Date(note.created as string),
          lastModified: new Date(note.lastModified as string),
        }))

        migrationStatus.studyNotes.total = studyNotes.length

        for (const note of studyNotes) {
          try {
            await saveStudyNotes(note)
            migrationStatus.studyNotes.migrated++
          } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error'
            migrationStatus.studyNotes.errors.push(`${note.title}: ${error}`)
          }
          setStatus({ ...migrationStatus })
        }
      }

      // Migrate Study Sessions
      const studySessionsData = localStorage.getItem('study-tool-sessions')
      if (studySessionsData) {
        const rawStudySessions = JSON.parse(studySessionsData)
        const studySessions: StudySession[] = rawStudySessions.map((session: Record<string, unknown>) => ({
          ...session,
          startTime: new Date(session.startTime as string),
          endTime: session.endTime ? new Date(session.endTime as string) : undefined,
        }))

        migrationStatus.studySessions.total = studySessions.length

        for (const session of studySessions) {
          try {
            await saveStudySession(session)
            migrationStatus.studySessions.migrated++
          } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error'
            migrationStatus.studySessions.errors.push(`Session ${session.id}: ${error}`)
          }
          setStatus({ ...migrationStatus })
        }
      }

      const totalMigrated = migrationStatus.studySets.migrated + 
                          migrationStatus.studyNotes.migrated + 
                          migrationStatus.studySessions.migrated
      const totalErrors = migrationStatus.studySets.errors.length + 
                         migrationStatus.studyNotes.errors.length + 
                         migrationStatus.studySessions.errors.length

      if (totalErrors === 0) {
        setSuccess(`Migration completed successfully! Migrated ${totalMigrated} items.`)
      } else {
        setSuccess(`Migration completed with ${totalErrors} errors. ${totalMigrated} items migrated successfully.`)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed')
    } finally {
      setIsRunning(false)
    }
  }

  const getTotalItems = () => {
    if (!status) return 0
    return status.studySets.total + status.studyNotes.total + status.studySessions.total
  }

  const getTotalMigrated = () => {
    if (!status) return 0
    return status.studySets.migrated + status.studyNotes.migrated + status.studySessions.migrated
  }

  const getProgress = () => {
    const total = getTotalItems()
    const migrated = getTotalMigrated()
    return total === 0 ? 0 : (migrated / total) * 100
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Migrate Local Data to Cloud
        </CardTitle>
        <CardDescription>
          Transfer your existing study data from localStorage to your Supabase account.
          This is a one-time migration that will sync your data across devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isRunning && !status && (
          <Button onClick={migrateFromLocalStorage} className="w-full">
            Start Migration
          </Button>
        )}

        {isRunning && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Migrating data...</span>
              <span className="text-sm text-muted-foreground">
                {getTotalMigrated()} / {getTotalItems()}
              </span>
            </div>
            <Progress value={getProgress()} />
          </div>
        )}

        {status && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">Study Sets</div>
                <div className="text-lg">
                  {status.studySets.migrated} / {status.studySets.total}
                </div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">Study Notes</div>
                <div className="text-lg">
                  {status.studyNotes.migrated} / {status.studyNotes.total}
                </div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">Study Sessions</div>
                <div className="text-lg">
                  {status.studySessions.migrated} / {status.studySessions.total}
                </div>
              </div>
            </div>

            {/* Show errors if any */}
            {[...status.studySets.errors, ...status.studyNotes.errors, ...status.studySessions.errors].length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Migration Errors:</h4>
                {[...status.studySets.errors, ...status.studyNotes.errors, ...status.studySessions.errors].map((error, index) => (
                  <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <strong>Note:</strong> After successful migration, your data will be stored in the cloud and synced across all your devices. 
          Your local data will remain unchanged as a backup.
        </div>
      </CardContent>
    </Card>
  )
}
