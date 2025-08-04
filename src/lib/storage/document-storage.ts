import { DocumentUpload, User } from "@/types"
import { supabase } from "../supabase/client"

export async function saveDocumentUpload(document: DocumentUpload, user: User): Promise<void> {
  try {
    const documentData = {
      id: document.id,
      user_id: user.id,
      name: document.name,
      type: document.type,
      size: document.size,
      content: document.content,
      description: document.description || null,
      created: document.created.toISOString(),
      last_modified: document.lastModified.toISOString(),
    }

    const { error } = await supabase
      .from('document_uploads')
      .upsert(documentData)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error saving document upload:', error)
    throw error
  }
}

export async function getDocumentUploads(user: User): Promise<DocumentUpload[]> {
  try {
    const { data: documents, error } = await supabase
      .from('document_uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('created', { ascending: false })

    if (error) {
      throw error
    }

    return documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      content: doc.content,
      description: doc.description,
      created: new Date(doc.created),
      lastModified: new Date(doc.last_modified),
    }))
  } catch (error) {
    console.error('Error loading document uploads:', error)
    return []
  }
}

export async function getDocumentUpload(id: string, user: User): Promise<DocumentUpload | null> {
  try {
    const { data: document, error } = await supabase
      .from('document_uploads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return {
      id: document.id,
      name: document.name,
      type: document.type,
      size: document.size,
      content: document.content,
      description: document.description,
      created: new Date(document.created),
      lastModified: new Date(document.last_modified),
    }
  } catch (error) {
    console.error('Error loading document upload:', error)
    return null
  }
}

export async function deleteDocumentUpload(id: string, user: User): Promise<void> {
  try {
    const { error } = await supabase
      .from('document_uploads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting document upload:', error)
    throw error
  }
}
