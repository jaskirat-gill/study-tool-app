import { StudySet, User } from "@/types";
import { supabase } from "../supabase/client";

export async function saveStudySet(studySet: StudySet, user: User): Promise<void> {
  try {
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
      console.error('Error saving study set:', studySetError);
      throw studySetError
    }

    // Delete existing flashcards for this study set
    const { error: deleteError } = await supabase
      .from('flashcards')
      .delete()
      .eq('study_set_id', studySet.id)

    if (deleteError) {
      console.error('Error deleting existing flashcards:', deleteError);
      throw deleteError
    }
    console.log('Study set saved successfully:', studySet.flashcards);
    // Insert new flashcards
    if (studySet.flashcards.length > 0) {
      console.log('Inserting new flashcards:', studySet.flashcards);
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
      console.log('Inserting flashcards:', flashcardsData);
      const { error: flashcardsError } = await supabase
        .from('flashcards')
        .insert(flashcardsData)

      if (flashcardsError) {
        throw flashcardsError
      }
      console.log("flashcard error", flashcardsError);
    }
  } catch (error) {
    console.error('Error saving study set:', error)
    throw error
  }
}

export async function getStudySets(user: User): Promise<StudySet[]> {
  try {

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

export async function getStudySet(id: string, user: User): Promise<StudySet | null> {
  try {

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

export async function deleteStudySet(id: string, user: User): Promise<void> {
  try {
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