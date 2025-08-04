import { StudyNotes, User } from "@/types"
import { supabase } from "../supabase/client"

export async function saveStudyNotes(notes: StudyNotes, user: User): Promise<void> {
  try {

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

export async function getStudyNotes(user: User): Promise<StudyNotes[]> {
  try {

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

export async function getStudyNote(id: string, user: User): Promise<StudyNotes | null> {
  try {

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

export async function deleteStudyNote(id: string, user: User): Promise<void> {
  try {
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
