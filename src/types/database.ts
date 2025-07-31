// Database types for Supabase schema
export interface Profile {
  id: string
  name?: string | null
  avatar_url?: string | null
  university?: string | null
  major?: string | null
  graduation_year?: number | null
  bio?: string | null
  created_at: string
  updated_at: string
}

export interface TaskCategory {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description?: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date?: string | null
  completed_at?: string | null
  tags: string[]
  category_id?: string | null
  user_id: string
  created_at: string
  updated_at: string
  // Relations
  user?: Profile
  category?: TaskCategory | null
}

export interface NoteFolder {
  id: string
  name: string
  color: string
  parent_id?: string | null
  user_id: string
  created_at: string
  updated_at: string
  // Relations
  parent?: NoteFolder | null
  children?: NoteFolder[]
  notes?: Note[]
}

export interface Note {
  id: string
  title: string
  content: Record<string, unknown> // JSON content from Tiptap
  summary?: string | null
  tags: string[]
  is_public: boolean
  template?: string | null
  folder_id?: string | null
  user_id: string
  created_at: string
  updated_at: string
  // Relations
  user?: Profile
  folder?: NoteFolder | null
}

export interface Resource {
  id: string
  title: string
  description: string
  type: ResourceType
  file_url?: string | null
  file_size?: number | null
  subject: string
  course_code?: string | null
  tags: string[]
  upvotes: number
  downvotes: number
  score: number
  is_verified: boolean
  user_id: string
  created_at: string
  updated_at: string
  // Relations
  user?: Profile
  votes?: Vote[]
  comments?: Comment[]
}

export interface Vote {
  id: string
  type: VoteType
  user_id: string
  resource_id: string
  created_at: string
  // Relations
  user?: Profile
  resource?: Resource
}

export interface Comment {
  id: string
  content: string
  parent_id?: string | null
  user_id: string
  resource_id: string
  created_at: string
  updated_at: string
  // Relations
  user?: Profile
  resource?: Resource
  parent?: Comment | null
  replies?: Comment[]
}

export interface StudyGroup {
  id: string
  name: string
  description?: string | null
  subject?: string | null
  university?: string | null
  is_private: boolean
  owner_id: string
  created_at: string
  updated_at: string
  // Relations
  owner?: Profile
  members?: GroupMember[]
}

export interface GroupMember {
  id: string
  role: GroupRole
  joined_at: string
  user_id: string
  group_id: string
  // Relations
  user?: Profile
  group?: StudyGroup
}

// Enums
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type ResourceType =
  | 'PDF'
  | 'DOCX'
  | 'PPT'
  | 'VIDEO'
  | 'LINK'
  | 'IMAGE'
  | 'OTHER'
export type VoteType = 'UPVOTE' | 'DOWNVOTE'
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER'

// Form types for creating/updating records
export interface CreateProfileData {
  name?: string
  avatar_url?: string
  university?: string
  major?: string
  graduation_year?: number
  bio?: string
}

export interface UpdateProfileData {
  name?: string
  avatar_url?: string
  university?: string
  major?: string
  graduation_year?: number
  bio?: string
}

export interface CreateTaskData {
  title: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string
  tags?: string[]
  category_id?: string
}

export interface UpdateTaskData {
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string
  completed_at?: string | null
  tags?: string[]
  category_id?: string
}

// Form data types
export interface TaskFormData {
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  due_date?: string
  tags: string[]
  category_id?: string
}

export interface UpdateTaskFormData {
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string
  completed_at?: string | null
  tags?: string[]
  category_id?: string
}

export interface TaskCategoryFormData {
  name: string
  color: string
}

export interface UpdateTaskCategoryFormData {
  name?: string
  color?: string
}

export interface CreateNoteData {
  title: string
  content: Record<string, unknown>
  summary?: string
  tags?: string[]
  is_public?: boolean
  template?: string
  folder_id?: string
}

export interface UpdateNoteData {
  title?: string
  content?: Record<string, unknown>
  summary?: string
  tags?: string[]
  is_public?: boolean
  template?: string
  folder_id?: string
}

export interface CreateNoteFolderData {
  name: string
  color?: string
  parent_id?: string
}

export interface UpdateNoteFolderData {
  name?: string
  color?: string
  parent_id?: string
}

export interface CreateResourceData {
  title: string
  description: string
  type: ResourceType
  file_url?: string
  file_size?: number
  subject: string
  course_code?: string
  tags?: string[]
}

export interface UpdateResourceData {
  title?: string
  description?: string
  type?: ResourceType
  file_url?: string
  file_size?: number
  subject?: string
  course_code?: string
  tags?: string[]
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error: string | null
}

// Filter and search types
export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  category_id?: string
  tags?: string[]
  due_date_from?: string
  due_date_to?: string
  search?: string
}

export interface TaskFiltersData extends TaskFilters {
  sort_by?: 'created_at' | 'due_date' | 'priority' | 'title'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ResourceFilters {
  type?: ResourceType[]
  subject?: string[]
  tags?: string[]
  is_verified?: boolean
  search?: string
  sortBy?: 'recent' | 'popular' | 'score'
  page?: number
  limit?: number
}

export interface NoteFilters {
  folder_id?: string
  tags?: string[]
  is_public?: boolean
  search?: string
}

// File Storage Types
export interface FileFolder {
  id: string
  name: string
  description?: string | null
  color: string
  parent_id?: string | null
  user_id: string
  created_at: string
  updated_at: string
  // Relations
  parent?: FileFolder | null
  children?: FileFolder[]
  files?: FileRecord[]
}

export interface FileRecord {
  id: string
  name: string
  original_name: string
  file_path: string
  file_url: string
  file_size: number
  mime_type: string
  file_type: FileType
  description?: string | null
  tags: string[]
  folder_id?: string | null
  is_public: boolean
  download_count: number
  user_id: string
  created_at: string
  updated_at: string
  // Relations
  user?: Profile
  folder?: FileFolder | null
  shares?: FileShare[]
}

export interface FileShare {
  id: string
  file_id: string
  share_token: string
  expires_at?: string | null
  password_hash?: string | null
  max_downloads?: number | null
  download_count: number
  is_active: boolean
  created_by: string
  created_at: string
  // Relations
  file?: FileRecord
  creator?: Profile
}

export interface FileAccessLog {
  id: string
  file_id: string
  user_id?: string | null
  action: FileAction
  ip_address?: string | null
  user_agent?: string | null
  share_token?: string | null
  created_at: string
  // Relations
  file?: FileRecord
  user?: Profile | null
}

// File-related enums
export type FileType =
  | 'PDF'
  | 'IMAGE'
  | 'DOCUMENT'
  | 'VIDEO'
  | 'AUDIO'
  | 'ARCHIVE'
  | 'OTHER'
export type FileAction = 'VIEW' | 'DOWNLOAD' | 'SHARE' | 'UPLOAD'

// File form data types
export interface CreateFileData {
  name: string
  original_name: string
  file_path: string
  file_url: string
  file_size: number
  mime_type: string
  file_type: FileType
  description?: string
  tags?: string[]
  folder_id?: string
  is_public?: boolean
}

export interface UpdateFileData {
  name?: string
  description?: string
  tags?: string[]
  folder_id?: string
  is_public?: boolean
}

export interface CreateFileFolderData {
  name: string
  description?: string
  color?: string
  parent_id?: string
}

export interface UpdateFileFolderData {
  name?: string
  description?: string
  color?: string
  parent_id?: string
}

export interface CreateFileShareData {
  file_id: string
  expires_at?: string
  password?: string
  max_downloads?: number
}

export interface FileFilters {
  folder_id?: string
  file_type?: FileType[]
  tags?: string[]
  is_public?: boolean
  search?: string
  sort_by?: 'name' | 'created_at' | 'file_size' | 'download_count'
  sort_order?: 'asc' | 'desc'
}
