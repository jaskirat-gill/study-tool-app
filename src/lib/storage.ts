import { StudySet, StudySession, StudyNotes } from '@/types';

const STUDY_SETS_KEY = 'study-tool-sets';
const STUDY_SESSIONS_KEY = 'study-tool-sessions';
const STUDY_NOTES_KEY = 'study-tool-notes';

export function saveStudySet(studySet: StudySet): void {
  try {
    const existingSets = getStudySets();
    const updatedSets = existingSets.filter(set => set.id !== studySet.id);
    updatedSets.push(studySet);
    
    localStorage.setItem(STUDY_SETS_KEY, JSON.stringify(updatedSets));
  } catch (error) {
    console.error('Error saving study set:', error);
  }
}

export function getStudySets(): StudySet[] {
  try {
    const stored = localStorage.getItem(STUDY_SETS_KEY);
    if (!stored) return [];
    
    const sets = JSON.parse(stored);
    return sets.map((set: Partial<StudySet>) => ({
      ...set,
      created: new Date(set.created!),
      lastModified: new Date(set.lastModified!),
      flashcards: set.flashcards?.map((card: Partial<StudySet['flashcards'][0]>) => ({
        ...card,
        created: new Date(card.created!),
        lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
      })) || [],
    })) as StudySet[];
  } catch (error) {
    console.error('Error loading study sets:', error);
    return [];
  }
}

export function getStudySet(id: string): StudySet | null {
  const sets = getStudySets();
  return sets.find(set => set.id === id) || null;
}

export function deleteStudySet(id: string): void {
  try {
    const existingSets = getStudySets();
    const updatedSets = existingSets.filter(set => set.id !== id);
    localStorage.setItem(STUDY_SETS_KEY, JSON.stringify(updatedSets));
  } catch (error) {
    console.error('Error deleting study set:', error);
  }
}

export function saveStudySession(session: StudySession): void {
  try {
    const existingSessions = getStudySessions();
    const updatedSessions = existingSessions.filter(s => s.id !== session.id);
    updatedSessions.push(session);
    
    localStorage.setItem(STUDY_SESSIONS_KEY, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error('Error saving study session:', error);
  }
}

export function getStudySessions(studySetId?: string): StudySession[] {
  try {
    const stored = localStorage.getItem(STUDY_SESSIONS_KEY);
    if (!stored) return [];
    
    const sessions = JSON.parse(stored).map((session: Partial<StudySession>) => ({
      ...session,
      startTime: new Date(session.startTime!),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
    })) as StudySession[];
    
    return studySetId 
      ? sessions.filter((session: StudySession) => session.studySetId === studySetId)
      : sessions;
  } catch (error) {
    console.error('Error loading study sessions:', error);
    return [];
  }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function exportStudySet(studySet: StudySet): void {
  try {
    const dataStr = JSON.stringify(studySet, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${studySet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting study set:', error);
  }
}

export function importStudySet(file: File): Promise<StudySet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const studySet = JSON.parse(content);
        
        // Validate the structure
        if (!studySet.id || !studySet.title || !Array.isArray(studySet.flashcards)) {
          throw new Error('Invalid study set format');
        }
        
        // Generate new ID to avoid conflicts
        studySet.id = generateId();
        studySet.lastModified = new Date();
        
        resolve(studySet);
      } catch {
        reject(new Error('Failed to parse study set file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Notes storage functions
export function saveStudyNotes(notes: StudyNotes): void {
  try {
    const existingNotes = getStudyNotes();
    const updatedNotes = existingNotes.filter(note => note.id !== notes.id);
    updatedNotes.push(notes);
    
    localStorage.setItem(STUDY_NOTES_KEY, JSON.stringify(updatedNotes));
  } catch (error) {
    console.error('Error saving study notes:', error);
  }
}

export function getStudyNotes(): StudyNotes[] {
  try {
    const stored = localStorage.getItem(STUDY_NOTES_KEY);
    if (!stored) return [];
    
    const notes = JSON.parse(stored);
    return notes.map((note: Partial<StudyNotes>) => ({
      ...note,
      created: new Date(note.created!),
      lastModified: new Date(note.lastModified!),
    })) as StudyNotes[];
  } catch (error) {
    console.error('Error loading study notes:', error);
    return [];
  }
}

export function getStudyNote(id: string): StudyNotes | null {
  try {
    const notes = getStudyNotes();
    return notes.find(note => note.id === id) || null;
  } catch (error) {
    console.error('Error loading study note:', error);
    return null;
  }
}

export function deleteStudyNote(id: string): void {
  try {
    const existingNotes = getStudyNotes();
    const updatedNotes = existingNotes.filter(note => note.id !== id);
    localStorage.setItem(STUDY_NOTES_KEY, JSON.stringify(updatedNotes));
  } catch (error) {
    console.error('Error deleting study note:', error);
  }
}
