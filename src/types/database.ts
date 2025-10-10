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
  is_archived: boolean
  archived_at?: string | null
  last_activity_at: string
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
  user?: {
    id: string
    email?: string
    user_metadata?: {
      name?: string
      full_name?: string
      avatar_url?: string
    }
    name?: string
    avatar_url?: string
  }
  profile?: {
    id: string
    name?: string | null
    full_name?: string | null
    email?: string
    avatar_url?: string | null
  }
  group?: StudyGroup
}

export interface GroupJoinRequest {
  id: string
  user_id: string
  group_id: string
  message?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  updated_at: string
  // Relations
  user?: {
    id: string
    email?: string
    user_metadata?: {
      name?: string
      full_name?: string
      avatar_url?: string
    }
    name?: string
    avatar_url?: string
  }
  profile?: {
    id: string
    name?: string | null
    full_name?: string | null
    email?: string
    avatar_url?: string | null
  }
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

// Study Group form data types
export interface CreateStudyGroupData {
  name: string
  description?: string
  subject?: string
  university?: string
  is_private?: boolean
}

export interface UpdateStudyGroupData {
  name?: string
  description?: string
  subject?: string
  university?: string
  is_private?: boolean
  is_archived?: boolean
  archived_at?: string | null
  last_activity_at?: string
}

export interface CreateJoinRequestData {
  message?: string
}

export interface UpdateJoinRequestData {
  status: 'APPROVED' | 'REJECTED'
}

export interface StudyGroupFilters {
  subject?: string[]
  university?: string[]
  is_private?: boolean
  search?: string
  sort_by?: 'name' | 'created_at' | 'member_count'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Study Board Types
export interface StudyBoard {
  id: string
  group_id: string
  name: string
  description?: string | null
  canvas_data: Record<string, unknown>
  template_type?: string | null
  settings: BoardSettings
  version: number
  created_by?: string | null
  created_at: string
  updated_at: string
  last_modified_by?: string | null
  last_modified_at: string
  // Relations
  group?: StudyGroup
  creator?: Profile | null
  elements?: CanvasElement[]
  permissions?: BoardPermission[]
  changes?: BoardChange[]
}

export interface CanvasElement {
  id: string
  board_id: string
  element_type: ElementType
  position: Point
  properties: Record<string, unknown>
  layer_index: number
  created_by?: string | null
  created_at: string
  updated_at: string
  updated_by?: string | null
  // Relations
  board?: StudyBoard
  creator?: Profile | null
}

export interface UserPresence {
  user_id: string
  board_id: string
  cursor_position?: Point | null
  current_tool?: string | null
  is_active: boolean
  last_seen: string
  session_id: string
  // Relations
  user?: Profile
  board?: StudyBoard
}

export interface BoardPermission {
  id: string
  board_id: string
  user_id: string
  permission_level: PermissionLevel
  granted_by?: string | null
  granted_at: string
  // Relations
  board?: StudyBoard
  user?: Profile
  granter?: Profile | null
}

export interface BoardChange {
  id: string
  board_id: string
  element_id?: string | null
  change_type: ChangeType
  change_data: Record<string, unknown>
  user_id?: string | null
  version: number
  timestamp: string
  applied: boolean
  // Relations
  board?: StudyBoard
  element?: CanvasElement | null
  user?: Profile | null
}

// Study Board related types
export interface Point {
  x: number
  y: number
}

export interface BoardSettings {
  width: number
  height: number
  backgroundColor: string
  gridEnabled: boolean
  snapToGrid: boolean
  gridSize: number
}

// Study Board enums
export type ElementType = 'text' | 'drawing' | 'sticky' | 'shape'
export type PermissionLevel = 'VIEW' | 'EDIT' | 'ADMIN'
export type ChangeType = 'add' | 'update' | 'delete' | 'board_update'

// Study Board form data types
export interface CreateStudyBoardData {
  group_id: string
  name?: string
  description?: string
  template_type?: string
  settings?: Partial<BoardSettings>
}

export interface UpdateStudyBoardData {
  name?: string
  description?: string
  canvas_data?: Record<string, unknown>
  template_type?: string
  settings?: Partial<BoardSettings>
}

export interface CreateCanvasElementData {
  board_id: string
  element_type: ElementType
  position: Point
  properties: Record<string, unknown>
  layer_index?: number
}

export interface UpdateCanvasElementData {
  element_type?: ElementType
  position?: Point
  properties?: Record<string, unknown>
  layer_index?: number
}

export interface CreateBoardPermissionData {
  board_id: string
  user_id: string
  permission_level: PermissionLevel
}

export interface UpdateBoardPermissionData {
  permission_level: PermissionLevel
}

export interface UpdateUserPresenceData {
  cursor_position?: Point | null
  current_tool?: string | null
  session_id?: string
}

export interface StudyBoardFilters {
  group_id?: string
  template_type?: string[]
  created_by?: string
  search?: string
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'last_modified_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}
