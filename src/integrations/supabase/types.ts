export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          query?: string
          operationName?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_job: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          payload_json: Json
          run_at: string
          started_at: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload_json?: Json
          run_at?: string
          started_at?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload_json?: Json
          run_at?: string
          started_at?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_run: {
        Row: {
          cost_cents: number | null
          created_at: string
          error_message: string | null
          id: string
          job_id: string | null
          order_id: string | null
          steps_json: Json
          success: boolean
          timings_json: Json
          user_id: string
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          order_id?: string | null
          steps_json?: Json
          success?: boolean
          timings_json?: Json
          user_id: string
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          order_id?: string | null
          steps_json?: Json
          success?: boolean
          timings_json?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_run_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "agent_job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_run_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "content_order"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_files: {
        Row: {
          chatwoot_attachment_id: number | null
          chatwoot_attachment_url: string | null
          contact_identifier: string | null
          created_at: string
          duration_seconds: number | null
          file_path: string | null
          id: string
          meeting_note_id: string | null
          openai_model: string | null
          original_file_size: number | null
          processed_at: string | null
          transcription: string | null
          transcription_error: string | null
          transcription_status: string | null
          user_id: string | null
        }
        Insert: {
          chatwoot_attachment_id?: number | null
          chatwoot_attachment_url?: string | null
          contact_identifier?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_path?: string | null
          id?: string
          meeting_note_id?: string | null
          openai_model?: string | null
          original_file_size?: number | null
          processed_at?: string | null
          transcription?: string | null
          transcription_error?: string | null
          transcription_status?: string | null
          user_id?: string | null
        }
        Update: {
          chatwoot_attachment_id?: number | null
          chatwoot_attachment_url?: string | null
          contact_identifier?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_path?: string | null
          id?: string
          meeting_note_id?: string | null
          openai_model?: string | null
          original_file_size?: number | null
          processed_at?: string | null
          transcription?: string | null
          transcription_error?: string | null
          transcription_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_files_meeting_note_id_fkey"
            columns: ["meeting_note_id"]
            isOneToOne: false
            referencedRelation: "meeting_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      content_context: {
        Row: {
          content_suggestion_id: string | null
          created_at: string
          id: string
          meeting_note_id: string | null
          weight: number | null
        }
        Insert: {
          content_suggestion_id?: string | null
          created_at?: string
          id?: string
          meeting_note_id?: string | null
          weight?: number | null
        }
        Update: {
          content_suggestion_id?: string | null
          created_at?: string
          id?: string
          meeting_note_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_context_content_suggestion_id_fkey"
            columns: ["content_suggestion_id"]
            isOneToOne: false
            referencedRelation: "content_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_context_meeting_note_id_fkey"
            columns: ["meeting_note_id"]
            isOneToOne: false
            referencedRelation: "meeting_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      content_order: {
        Row: {
          created_at: string
          id: string
          params_json: Json
          source: string
          triggered_by: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          params_json?: Json
          source: string
          triggered_by: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          params_json?: Json
          source?: string
          triggered_by?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_performance: {
        Row: {
          content_suggestion_id: string | null
          created_at: string
          engagement_metrics: Json | null
          id: string
          linkedin_post_id: string | null
          performance_score: number | null
          posted_at: string | null
          user_id: string
        }
        Insert: {
          content_suggestion_id?: string | null
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          linkedin_post_id?: string | null
          performance_score?: number | null
          posted_at?: string | null
          user_id: string
        }
        Update: {
          content_suggestion_id?: string | null
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          linkedin_post_id?: string | null
          performance_score?: number | null
          posted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_content_suggestion_id_fkey"
            columns: ["content_suggestion_id"]
            isOneToOne: false
            referencedRelation: "enhanced_content_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_suggestions: {
        Row: {
          call_to_action: string | null
          content: string | null
          content_type: string | null
          context_sources: Json | null
          context_used: Json | null
          created_at: string
          description: string | null
          estimated_engagement: number | null
          full_content: string | null
          generation_metadata: Json | null
          generation_prompt: string | null
          hashtags: string[] | null
          id: string
          is_active: boolean | null
          quality_score: number | null
          suggested_outline: string | null
          title: string
          used_at: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          call_to_action?: string | null
          content?: string | null
          content_type?: string | null
          context_sources?: Json | null
          context_used?: Json | null
          created_at?: string
          description?: string | null
          estimated_engagement?: number | null
          full_content?: string | null
          generation_metadata?: Json | null
          generation_prompt?: string | null
          hashtags?: string[] | null
          id?: string
          is_active?: boolean | null
          quality_score?: number | null
          suggested_outline?: string | null
          title: string
          used_at?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          call_to_action?: string | null
          content?: string | null
          content_type?: string | null
          context_sources?: Json | null
          context_used?: Json | null
          created_at?: string
          description?: string | null
          estimated_engagement?: number | null
          full_content?: string | null
          generation_metadata?: Json | null
          generation_prompt?: string | null
          hashtags?: string[] | null
          id?: string
          is_active?: boolean | null
          quality_score?: number | null
          suggested_outline?: string | null
          title?: string
          used_at?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enhanced_content_suggestions: {
        Row: {
          call_to_action: string | null
          context_sources: Json | null
          created_at: string
          description: string | null
          estimated_engagement: number | null
          full_content: string
          generation_metadata: Json | null
          hashtags: string[] | null
          id: string
          is_active: boolean | null
          quality_score: number | null
          title: string
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          call_to_action?: string | null
          context_sources?: Json | null
          created_at?: string
          description?: string | null
          estimated_engagement?: number | null
          full_content: string
          generation_metadata?: Json | null
          hashtags?: string[] | null
          id?: string
          is_active?: boolean | null
          quality_score?: number | null
          title: string
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          call_to_action?: string | null
          context_sources?: Json | null
          created_at?: string
          description?: string | null
          estimated_engagement?: number | null
          full_content?: string
          generation_metadata?: Json | null
          hashtags?: string[] | null
          id?: string
          is_active?: boolean | null
          quality_score?: number | null
          title?: string
          updated_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inspirations: {
        Row: {
          about: string | null
          company: string | null
          created_at: string
          headline: string | null
          id: string
          linkedin_data: Json | null
          linkedin_url: string
          location: string | null
          name: string | null
          scraped_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string | null
          company?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          linkedin_data?: Json | null
          linkedin_url: string
          location?: string | null
          name?: string | null
          scraped_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string | null
          company?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          linkedin_data?: Json | null
          linkedin_url?: string
          location?: string | null
          name?: string | null
          scraped_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_files: {
        Row: {
          content_extracted: boolean | null
          created_at: string
          extracted_content: string | null
          extraction_metadata: Json | null
          file_hash: string | null
          gcs_bucket: string | null
          gcs_path: string | null
          id: string
          metadata: Json | null
          name: string
          size: number | null
          storage_path: string | null
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          content_extracted?: boolean | null
          created_at?: string
          extracted_content?: string | null
          extraction_metadata?: Json | null
          file_hash?: string | null
          gcs_bucket?: string | null
          gcs_path?: string | null
          id?: string
          metadata?: Json | null
          name: string
          size?: number | null
          storage_path?: string | null
          type: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          content_extracted?: boolean | null
          created_at?: string
          extracted_content?: string | null
          extraction_metadata?: Json | null
          file_hash?: string | null
          gcs_bucket?: string | null
          gcs_path?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          size?: number | null
          storage_path?: string | null
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meeting_notes: {
        Row: {
          chatwoot_contact_id: string | null
          chatwoot_conversation_id: string | null
          chatwoot_message_id: string | null
          contact_identifier: string | null
          content: string | null
          created_at: string
          error_details: string | null
          gcs_storage_path: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          processed_at: string
          processing_status: string | null
          source_type: string
          user_id: string | null
        }
        Insert: {
          chatwoot_contact_id?: string | null
          chatwoot_conversation_id?: string | null
          chatwoot_message_id?: string | null
          contact_identifier?: string | null
          content?: string | null
          created_at?: string
          error_details?: string | null
          gcs_storage_path?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          processed_at?: string
          processing_status?: string | null
          source_type: string
          user_id?: string | null
        }
        Update: {
          chatwoot_contact_id?: string | null
          chatwoot_conversation_id?: string | null
          chatwoot_message_id?: string | null
          contact_identifier?: string | null
          content?: string | null
          created_at?: string
          error_details?: string | null
          gcs_storage_path?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          processed_at?: string
          processing_status?: string | null
          source_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_linkedin: string | null
          content_guides: Json | null
          content_pillars: Json | null
          created_at: string | null
          display_name: string | null
          goals: Json | null
          guides: Json | null
          id: string
          inspirations: Json | null
          is_onboarded: boolean | null
          linkedin_about: string | null
          linkedin_company: string | null
          linkedin_data: Json | null
          linkedin_headline: string | null
          linkedin_location: string | null
          linkedin_name: string | null
          linkedin_profile: string | null
          linkedin_scraped_at: string | null
          onboarding_completed: boolean | null
          pacing_preferences: Json | null
          phone_number: string | null
          updated_at: string | null
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          company_linkedin?: string | null
          content_guides?: Json | null
          content_pillars?: Json | null
          created_at?: string | null
          display_name?: string | null
          goals?: Json | null
          guides?: Json | null
          id?: string
          inspirations?: Json | null
          is_onboarded?: boolean | null
          linkedin_about?: string | null
          linkedin_company?: string | null
          linkedin_data?: Json | null
          linkedin_headline?: string | null
          linkedin_location?: string | null
          linkedin_name?: string | null
          linkedin_profile?: string | null
          linkedin_scraped_at?: string | null
          onboarding_completed?: boolean | null
          pacing_preferences?: Json | null
          phone_number?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          company_linkedin?: string | null
          content_guides?: Json | null
          content_pillars?: Json | null
          created_at?: string | null
          display_name?: string | null
          goals?: Json | null
          guides?: Json | null
          id?: string
          inspirations?: Json | null
          is_onboarded?: boolean | null
          linkedin_about?: string | null
          linkedin_company?: string | null
          linkedin_data?: Json | null
          linkedin_headline?: string | null
          linkedin_location?: string | null
          linkedin_name?: string | null
          linkedin_profile?: string | null
          linkedin_scraped_at?: string | null
          onboarding_completed?: boolean | null
          pacing_preferences?: Json | null
          phone_number?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      saved_drafts: {
        Row: {
          citations_json: Json | null
          content: string
          created_at: string
          id: string
          order_id: string | null
          status: string
          suggestion_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          citations_json?: Json | null
          content?: string
          created_at?: string
          id?: string
          order_id?: string | null
          status?: string
          suggestion_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          citations_json?: Json | null
          content?: string
          created_at?: string
          id?: string
          order_id?: string | null
          status?: string
          suggestion_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_drafts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "content_order"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_count: number | null
          activity_date: string
          activity_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_count?: number | null
          activity_date: string
          activity_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_count?: number | null
          activity_date?: string
          activity_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_bucket_mapping: {
        Row: {
          bucket_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bucket_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_context_analysis: {
        Row: {
          analysis_data: Json
          analyzed_at: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          analysis_data: Json
          analyzed_at?: string
          created_at?: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          analyzed_at?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_user_mapping: {
        Row: {
          chatwoot_account_id: string | null
          chatwoot_contact_id: string | null
          created_at: string
          id: string
          is_verified: boolean | null
          updated_at: string
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          chatwoot_account_id?: string | null
          chatwoot_contact_id?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean | null
          updated_at?: string
          user_id: string
          whatsapp_number: string
        }
        Update: {
          chatwoot_account_id?: string | null
          chatwoot_contact_id?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_streak: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          active_days_this_month: number
          longest_streak: number
          total_activities: number
        }[]
      }
      track_user_activity: {
        Args: { p_activity_type: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

