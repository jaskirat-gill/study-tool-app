import { createClient } from '@/lib/supabase/client'
import { StudySet, StudySession, StudyNotes } from '@/types'

// Helper function to get current user
async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User must be authenticated')
  }
  return user
}

// Study Sets Functions
export async function saveStudySet(studySet: StudySet): Promise<void> {
  console.log('Saving study set:', studySet);
  try {
    const user = await getCurrentUser()
    const supabase = createClient()
    
    // First, save or update the study set
    const studySetData = {
      id: studySet.id,
      user_id: user.id,
      title: studySet.title,
      description: studySet.description || null,
      created: studySet.created.toISOString(),
      last_modified: studySet.lastModified.toISOString(),
      source_document_name: studySet.sourceDocument?.name || null,
      source_document_type: studySet.sourceDocument?.type || null,
      source_document_size: studySet.sourceDocument?.size || null,
    }

    const { error: studySetError } = await supabase
      .from('study_sets')
      .upsert(studySetData)

    if (studySetError) {
      throw studySetError
    }

    // Delete existing flashcards for this study set
    const { error: deleteError } = await supabase
      .from('flashcards')
      .delete()
      .eq('study_set_id', studySet.id)

    if (deleteError) {
      throw deleteError
    }

    // Insert new flashcards
    if (studySet.flashcards.length > 0) {
      const flashcardsData = studySet.flashcards.map(card => ({
        id: card.id,
        study_set_id: studySet.id,
        front: card.front,
        back: card.back,
        difficulty: card.difficulty,
        created: new Date(card.created).toISOString(),
        last_reviewed: card.lastReviewed ? new Date(card.lastReviewed).toISOString() : null,
        review_count: card.reviewCount,
        correct_count: card.correctCount,
      }))

      const { error: flashcardsError } = await supabase
        .from('flashcards')
        .insert(flashcardsData)

      if (flashcardsError) {
        throw flashcardsError
      }
    }
  } catch (error) {
    console.error('Error saving study set:', error)
    throw error
  }
}

export async function getStudySets(): Promise<StudySet[]> {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    const { data: studySets, error: studySetsError } = await supabase
      .from('study_sets')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('user_id', user.id)
      .order('created', { ascending: false })

    if (studySetsError) {
      throw studySetsError
    }

    return studySets.map(set => ({
      id: set.id,
      title: set.title,
      description: set.description,
      created: new Date(set.created),
      lastModified: new Date(set.last_modified),
      sourceDocument: set.source_document_name ? {
        name: set.source_document_name,
        type: set.source_document_type,
        size: set.source_document_size,
      } : undefined,
      flashcards: set.flashcards.map((card: {
        id: string;
        front: string;
        back: string;
        difficulty: string;
        created: string;
        last_reviewed: string | null;
        review_count: number;
        correct_count: number;
      }) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        difficulty: card.difficulty,
        created: new Date(card.created),
        lastReviewed: card.last_reviewed ? new Date(card.last_reviewed) : undefined,
        reviewCount: card.review_count,
        correctCount: card.correct_count,
      })),
    }))
  } catch (error) {
    console.error('Error loading study sets:', error)
    return []
  }
}

export async function getStudySet(id: string): Promise<StudySet | null> {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    const { data: studySet, error } = await supabase
      .from('study_sets')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return {
      id: studySet.id,
      title: studySet.title,
      description: studySet.description,
      created: new Date(studySet.created),
      lastModified: new Date(studySet.last_modified),
      sourceDocument: studySet.source_document_name ? {
        name: studySet.source_document_name,
        type: studySet.source_document_type,
        size: studySet.source_document_size,
      } : undefined,
      flashcards: studySet.flashcards.map((card: {
        id: string;
        front: string;
        back: string;
        difficulty: string;
        created: string;
        last_reviewed: string | null;
        review_count: number;
        correct_count: number;
      }) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        difficulty: card.difficulty,
        created: new Date(card.created),
        lastReviewed: card.last_reviewed ? new Date(card.last_reviewed) : undefined,
        reviewCount: card.review_count,
        correctCount: card.correct_count,
      })),
    }
  } catch (error) {
    console.error('Error loading study set:', error)
    return null
  }
}

export async function deleteStudySet(id: string): Promise<void> {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    const { error } = await supabase
      .from('study_sets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting study set:', error)
    throw error
  }
}

// Study Sessions Functions
export async function saveStudySession(session: StudySession): Promise<void> {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    const sessionData = {
      id: session.id,
      user_id: user.id,
      study_set_id: session.studySetId,
      start_time: session.startTime.toISOString(),
      end_time: session.endTime?.toISOString() || null,
      flashcards_reviewed: session.flashcardsReviewed,
      correct_answers: session.correctAnswers,
      completed_flashcards: session.completedFlashcards,
    }

    const { error } = await supabase
      .from('study_sessions')
      .upsert(sessionData)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error saving study session:', error)
    throw error
  }
}

export async function getStudySessions(studySetId?: string): Promise<StudySession[]> {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    let query = supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)

    if (studySetId) {
      query = query.eq('study_set_id', studySetId)
    }

    const { data: sessions, error } = await query.order('start_time', { ascending: false })

    if (error) {
      throw error
    }

    return sessions.map(session => ({
      id: session.id,
      studySetId: session.study_set_id,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : undefined,
      flashcardsReviewed: session.flashcards_reviewed,
      correctAnswers: session.correct_answers,
      completedFlashcards: session.completed_flashcards,
    }))
  } catch (error) {
    console.error('Error loading study sessions:', error)
    return []
  }
}

// Study Notes Functions
export async function saveStudyNotes(notes: StudyNotes): Promise<void> {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    const notesData = {
      id: notes.id,
      user_id: user.id,
      title: notes.title,
      content: notes.content,
      created: notes.created.toISOString(),
      last_modified: notes.lastModified.toISOString(),
      source_content: notes.sourceContent || null,
    }

    const { error } = await supabase
      .from('study_notes')
      .upsert(notesData)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error saving study notes:', error)
    throw error
  }
}

export async function getStudyNotes(): Promise<StudyNotes[]> {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    const { data: notes, error } = await supabase
      .from('study_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created', { ascending: false })

    if (error) {
      throw error
    }

    return notes.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      created: new Date(note.created),
      lastModified: new Date(note.last_modified),
      sourceContent: note.source_content,
    }))
  } catch (error) {
    console.error('Error loading study notes:', error)
    return []
  }
}

export async function getStudyNote(id: string): Promise<StudyNotes | null> {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    const { data: note, error } = await supabase
      .from('study_notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return {
      id: note.id,
      title: note.title,
      content: note.content,
      created: new Date(note.created),
      lastModified: new Date(note.last_modified),
      sourceContent: note.source_content,
    }
  } catch (error) {
    console.error('Error loading study note:', error)
    return null
  }
}

export async function deleteStudyNote(id: string): Promise<void> {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    const { error } = await supabase
      .from('study_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting study note:', error)
    throw error
  }
}

// Migration Functions
export async function runDataMigration(): Promise<void> {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()
    
    // Check if migration has already been done for this user
    const { data: existingData } = await supabase
      .from('study_sets')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
    
    // If user already has data in Supabase, skip migration
    if (existingData && existingData.length > 0) {
      return
    }
    
    // Check localStorage for data to migrate
    const localStudySets = localStorage.getItem('studySets')
    const localStudySessions = localStorage.getItem('studySessions')
    const localStudyNotes = localStorage.getItem('studyNotes')
    
    if (!localStudySets && !localStudySessions && !localStudyNotes) {
      // No local data to migrate
      return
    }
    
    console.log('Starting background data migration...')
    
    // Migrate study sets and flashcards
    if (localStudySets) {
      const studySets = JSON.parse(localStudySets) as StudySet[]
      for (const studySet of studySets) {
        await saveStudySet({
          ...studySet,
          created: new Date(studySet.created),
          lastModified: new Date(studySet.lastModified)
        })
      }
    }
    
    // Migrate study sessions
    if (localStudySessions) {
      const sessions = JSON.parse(localStudySessions) as StudySession[]
      for (const session of sessions) {
        await saveStudySession({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined
        })
      }
    }
    
    // Migrate study notes
    if (localStudyNotes) {
      const notes = JSON.parse(localStudyNotes) as StudyNotes[]
      for (const note of notes) {
        await saveStudyNotes({
          ...note,
          created: new Date(note.created),
          lastModified: new Date(note.lastModified)
        })
      }
    }
    
    console.log('Background data migration completed successfully')
    
    // Clear localStorage after successful migration
    localStorage.removeItem('studySets')
    localStorage.removeItem('studySessions')
    localStorage.removeItem('studyNotes')
    
  } catch (error) {
    console.error('Error during background data migration:', error)
    // Don't throw error to prevent disrupting user experience
  }
}

// Utility Functions
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export function exportStudySet(studySet: StudySet): void {
  try {
    const dataStr = JSON.stringify(studySet, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `${studySet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error exporting study set:', error)
  }
}

export function importStudySet(file: File): Promise<StudySet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const studySet = JSON.parse(content)
        
        // Validate the structure
        if (!studySet.id || !studySet.title || !Array.isArray(studySet.flashcards)) {
          throw new Error('Invalid study set format')
        }
        
        // Generate new ID to avoid conflicts
        studySet.id = generateId()
        studySet.lastModified = new Date()
        
        resolve(studySet)
      } catch {
        reject(new Error('Failed to parse study set file'))
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
