// Enhanced type definitions for multi-type invitation system

export enum InvitationType {
  WEDDING = 'wedding',
  BIRTHDAY = 'birthday',
  GRADUATION = 'graduation',
  BABY_SHOWER = 'baby_shower',
  BUSINESS = 'business',
  ANNIVERSARY = 'anniversary',
  PARTY = 'party'
}

export enum InvitationStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  EXPIRED = 'expired'
}

export enum TemplateStyle {
  CLASSIC = 'classic',
  MODERN = 'modern',
  ELEGANT = 'elegant',
  FLORAL = 'floral',
  MINIMALIST = 'minimalist',
  RUSTIC = 'rustic',
  VINTAGE = 'vintage',
  TROPICAL = 'tropical'
}

export enum GuestResponse {
  PENDING = 'pending',
  ATTENDING = 'attending',
  NOT_ATTENDING = 'not_attending',
  MAYBE = 'maybe'
}

// Base interfaces
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// Template interface
export interface Template extends BaseEntity {
  name: string
  description: string | null
  thumbnail_url: string | null
  preview_url: string | null
  category: InvitationType
  style: TemplateStyle
  template_data: Record<string, any>
  default_config: Record<string, any> | null
  supported_fields: string[] | null
  is_premium: boolean
  price: number
  popularity_score: number
  usage_count: number
  features: string[] | null
  tags: string[] | null
  is_active: boolean
  created_by: string | null
}

// Dynamic form data structures for different invitation types
export interface WeddingFormData {
  groomName: string
  brideName: string
  groomParents?: string[]
  brideParents?: string[]
  eventDate: string
  ceremonyTime: string
  receptionTime?: string
  venueName: string
  venueAddress: string
  story?: string
  message?: string
  hashtag?: string
  dresscode?: string
  timeline: Array<{
    time: string
    title: string
    description: string
    location: string
  }>
  rsvpEnabled: boolean
  giftRegistryEnabled: boolean
  bankAccount?: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  backgroundMusic?: {
    enabled: boolean
    url?: string
    title?: string
    artist?: string
    autoplay: boolean
    volume: number
  }
}

export interface BirthdayFormData {
  celebrantName: string
  age: number
  celebrantPhoto?: string
  partyDate: string
  partyTime: string
  venueName: string
  venueAddress: string
  theme?: string
  dresscode?: string
  message?: string
  hashtag?: string
  activities: Array<{
    time: string
    activity: string
    location: string
  }>
  giftRegistry?: {
    enabled: boolean
    wishlistUrl?: string
    preferences?: string
  }
  rsvpEnabled: boolean
}

export interface GraduationFormData {
  graduateName: string
  degree: string
  school: string
  graduationDate: string
  ceremonyTime: string
  venueName: string
  venueAddress: string
  achievements?: string[]
  message?: string
  hashtag?: string
  receptionDetails?: {
    date: string
    time: string
    venue: string
    address: string
  }
  rsvpEnabled: boolean
}

export interface BabyShowerFormData {
  parentNames: string[]
  babyName?: string
  dueDate: string
  gender?: 'boy' | 'girl' | 'surprise'
  partyDate: string
  partyTime: string
  venueName: string
  venueAddress: string
  theme?: string
  message?: string
  hashtag?: string
  giftRegistry?: {
    enabled: boolean
    registryUrl?: string
    preferences?: string
  }
  games?: Array<{
    name: string
    description: string
  }>
  rsvpEnabled: boolean
}

export interface BusinessFormData {
  eventTitle: string
  company: string
  eventType: string
  eventDate: string
  eventTime: string
  venueName: string
  venueAddress: string
  agenda: Array<{
    time: string
    topic: string
    speaker?: string
  }>
  dresscode?: string
  contactPerson: {
    name: string
    email: string
    phone?: string
  }
  rsvpEnabled: boolean
  requiresApproval: boolean
}

// Union type for all form data types
export type InvitationFormData = 
  | WeddingFormData 
  | BirthdayFormData 
  | GraduationFormData 
  | BabyShowerFormData 
  | BusinessFormData

// Template customization interface
export interface TemplateCustomization {
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
  }
  fonts?: {
    heading?: string
    body?: string
    accent?: string
  }
  layout?: {
    headerStyle?: string
    sectionSpacing?: string
    cardStyle?: string
  }
  features?: {
    showParents?: boolean
    showTimeline?: boolean
    showGallery?: boolean
    enableMusic?: boolean
    showMap?: boolean
  }
}

// Main invitation interface
export interface Invitation extends BaseEntity {
  user_id: string
  template_id: string | null
  title: string
  type: InvitationType
  status: InvitationStatus
  form_data: InvitationFormData
  event_date: string | null
  venue_name: string | null
  venue_address: string | null
  template_customization: TemplateCustomization | null
  slug: string | null
  is_published: boolean
  published_at: string | null
  expires_at: string | null
  rsvp_enabled: boolean
  rsvp_deadline: string | null
  guest_can_invite_others: boolean
  require_approval: boolean
  view_count: number
  unique_view_count: number
  rsvp_count: number
  confirmed_count: number
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
}

// Guest interface
export interface InvitationGuest extends BaseEntity {
  invitation_id: string
  name: string
  email: string | null
  phone: string | null
  response: GuestResponse
  response_data: Record<string, any> | null
  plus_ones_count: number
  plus_ones_details: Record<string, any> | null
  invitation_opened_at: string | null
  response_submitted_at: string | null
  reminder_sent_count: number
  last_reminder_sent_at: string | null
  email_notifications: boolean
  sms_notifications: boolean
}

// Analytics interface
export interface InvitationAnalytics extends BaseEntity {
  invitation_id: string
  event_type: string
  event_data: Record<string, any> | null
  session_id: string | null
  user_agent: string | null
  ip_address: string | null
  referrer: string | null
  country: string | null
  city: string | null
}

// Media interface
export interface InvitationMedia extends BaseEntity {
  invitation_id: string
  file_name: string
  file_path: string
  file_type: string
  mime_type: string | null
  file_size: number | null
  media_type: string
  display_order: number
  alt_text: string | null
  is_processed: boolean
  thumbnail_path: string | null
  compressed_path: string | null
}

// API request/response types
export interface CreateInvitationRequest {
  title: string
  type: InvitationType
  template_id?: string
  form_data: Partial<InvitationFormData>
}

export interface UpdateInvitationRequest {
  title?: string
  form_data?: Partial<InvitationFormData>
  template_customization?: TemplateCustomization
  status?: InvitationStatus
}

export interface PublishInvitationRequest {
  expires_at?: string
  meta_title?: string
  meta_description?: string
}

export interface InvitationListResponse {
  invitations: Invitation[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface TemplateListResponse {
  templates: Template[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface InvitationStatsResponse {
  total_invitations: number
  published_invitations: number
  draft_invitations: number
  total_views: number
  total_rsvps: number
  recent_activity: Array<{
    type: string
    message: string
    timestamp: string
  }>
}

// Form validation schemas
export interface FormFieldConfig {
  type: 'text' | 'email' | 'tel' | 'date' | 'time' | 'textarea' | 'select' | 'checkbox' | 'file'
  label: string
  placeholder?: string
  required: boolean
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    options?: string[]
  }
  dependency?: {
    field: string
    value: any
  }
}

export interface FormStepConfig {
  id: string
  title: string
  description: string
  icon: string
  fields: Record<string, FormFieldConfig>
  validation: (data: any) => boolean
}

export interface InvitationTypeConfig {
  type: InvitationType
  name: string
  description: string
  steps: FormStepConfig[]
  defaultData: Partial<InvitationFormData>
  previewComponent: string
}

// Error types
export interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
}

export interface ValidationError extends ApiError {
  field: string
  value: any
}
