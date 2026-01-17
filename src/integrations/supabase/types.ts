export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          segment: string | null
          status: Database["public"]["Enums"]["client_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          segment?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          segment?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          client_id: string | null
          name: string
          email: string | null
          phone: string | null
          role: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          name: string
          email?: string | null
          phone?: string | null
          role?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          name?: string
          email?: string | null
          phone?: string | null
          role?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_templates: {
        Row: {
          id: string
          name: string
          service_type: string | null
          body: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          service_type?: string | null
          body: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          service_type?: string | null
          body?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          unit: string | null
          service_type: string | null
          default_price_cents: number
          default_deadline_text: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          unit?: string | null
          service_type?: string | null
          default_price_cents?: number
          default_deadline_text?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          unit?: string | null
          service_type?: string | null
          default_price_cents?: number
          default_deadline_text?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          entity_type: Database["public"]["Enums"]["activity_entity"]
          entity_id: string
          action: string
          details: Json | null
          payload: Json | null
          actor_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: Database["public"]["Enums"]["activity_entity"]
          entity_id: string
          action: string
          details?: Json | null
          payload?: Json | null
          actor_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: Database["public"]["Enums"]["activity_entity"]
          entity_id?: string
          action?: string
          details?: Json | null
          payload?: Json | null
          actor_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          id: string
          entity_type: Database["public"]["Enums"]["activity_entity"]
          entity_id: string
          bucket: string
          storage_path: string
          file_name: string
          file_type: string | null
          file_size: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: Database["public"]["Enums"]["activity_entity"]
          entity_id: string
          bucket?: string
          storage_path: string
          file_name: string
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: Database["public"]["Enums"]["activity_entity"]
          entity_id?: string
          bucket?: string
          storage_path?: string
          file_name?: string
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string | null
          action: string
          old_data: Json | null
          new_data: Json | null
          actor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id?: string | null
          action: string
          old_data?: Json | null
          new_data?: Json | null
          actor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string | null
          action?: string
          old_data?: Json | null
          new_data?: Json | null
          actor_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          id: string
          quote_id: string | null
          service_id: string | null
          title: string
          description: string | null
          quantity: number
          unit_price_cents: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id?: string | null
          service_id?: string | null
          title: string
          description?: string | null
          quantity?: number
          unit_price_cents?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string | null
          service_id?: string | null
          title?: string
          description?: string | null
          quantity?: number
          unit_price_cents?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_versions: {
        Row: {
          id: string
          quote_id: string | null
          version: number
          reason: string | null
          snapshot: Json
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quote_id?: string | null
          version: number
          reason?: string | null
          snapshot: Json
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quote_id?: string | null
          version?: number
          reason?: string | null
          snapshot?: Json
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_versions_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_acceptances: {
        Row: {
          id: string
          quote_id: string | null
          status: Database["public"]["Enums"]["quote_acceptance_status"]
          name: string
          comment: string | null
          accepted_terms: boolean
          ip: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quote_id?: string | null
          status: Database["public"]["Enums"]["quote_acceptance_status"]
          name: string
          comment?: string | null
          accepted_terms?: boolean
          ip?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quote_id?: string | null
          status?: Database["public"]["Enums"]["quote_acceptance_status"]
          name?: string
          comment?: string | null
          accepted_terms?: boolean
          ip?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_acceptances_quote_id_fkey"
            columns: ["quote_id"]
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_events: {
        Row: {
          id: string
          quote_id: string | null
          event_type: Database["public"]["Enums"]["quote_event_type"]
          payload: Json | null
          ip: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quote_id?: string | null
          event_type: Database["public"]["Enums"]["quote_event_type"]
          payload?: Json | null
          ip?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quote_id?: string | null
          event_type?: Database["public"]["Enums"]["quote_event_type"]
          payload?: Json | null
          ip?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_events_quote_id_fkey"
            columns: ["quote_id"]
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          id: string
          quote_id: string | null
          amount_cents: number
          due_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          paid_at: string | null
          external_id: string | null
          payment_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id?: string | null
          amount_cents?: number
          due_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          paid_at?: string | null
          external_id?: string | null
          payment_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string | null
          amount_cents?: number
          due_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          paid_at?: string | null
          external_id?: string | null
          payment_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          id: string
          ip: string
          endpoint: string
          created_at: string
        }
        Insert: {
          id?: string
          ip: string
          endpoint: string
          created_at?: string
        }
        Update: {
          id?: string
          ip?: string
          endpoint?: string
          created_at?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          id: string
          client_id: string | null
          name: string
          email: string | null
          whatsapp: string
          project_type: string
          description: string
          budget_estimate: string | null
          desired_deadline: string | null
          status: Database["public"]["Enums"]["request_status"]
          source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          name: string
          email?: string | null
          whatsapp: string
          project_type: string
          description: string
          budget_estimate?: string | null
          desired_deadline?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          source?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          name?: string
          email?: string | null
          whatsapp?: string
          project_type?: string
          description?: string
          budget_estimate?: string | null
          desired_deadline?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          source?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          id: string
          client_id: string | null
          request_id: string | null
          title: string
          amount_cents: number
          currency: string
          deadline_text: string | null
          status: Database["public"]["Enums"]["quote_status"]
          notes: string | null
          public_token: string | null
          public_expires_at: string | null
          template_id: string | null
          template_snapshot: string | null
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          discount_percent: number
          discount_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          request_id?: string | null
          title: string
          amount_cents?: number
          currency?: string
          deadline_text?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          notes?: string | null
          public_token?: string | null
          public_expires_at?: string | null
          template_id?: string | null
          template_snapshot?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_percent?: number
          discount_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          request_id?: string | null
          title?: string
          amount_cents?: number
          currency?: string
          deadline_text?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          notes?: string | null
          public_token?: string | null
          public_expires_at?: string | null
          template_id?: string | null
          template_snapshot?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_percent?: number
          discount_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          company_name: string | null
          company_email: string | null
          company_phone: string | null
          company_address: string | null
          monthly_goal_cents: number
          proposal_validity_days: number
          proposal_language: string
          proposal_template: string
          notify_new_requests: boolean
          notify_followup: boolean
          notify_weekly_summary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name?: string | null
          company_email?: string | null
          company_phone?: string | null
          company_address?: string | null
          monthly_goal_cents?: number
          proposal_validity_days?: number
          proposal_language?: string
          proposal_template?: string
          notify_new_requests?: boolean
          notify_followup?: boolean
          notify_weekly_summary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string | null
          company_email?: string | null
          company_phone?: string | null
          company_address?: string | null
          monthly_goal_cents?: number
          proposal_validity_days?: number
          proposal_language?: string
          proposal_template?: string
          notify_new_requests?: boolean
          notify_followup?: boolean
          notify_weekly_summary?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: Database["public"]["Enums"]["task_status"]
          priority: Database["public"]["Enums"]["task_priority"]
          due_at: string | null
          client_id: string | null
          request_id: string | null
          quote_id: string | null
          assigned_to: string | null
          created_by: string | null
          task_type: string
          auto_generated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["task_priority"]
          due_at?: string | null
          client_id?: string | null
          request_id?: string | null
          quote_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          task_type?: string
          auto_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["task_priority"]
          due_at?: string | null
          client_id?: string | null
          request_id?: string | null
          quote_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          task_type?: string
          auto_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_request_id_fkey"
            columns: ["request_id"]
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_quote_id_fkey"
            columns: ["quote_id"]
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_quote_version: {
        Args: {
          p_quote_id: string
          p_reason?: string | null
          p_created_by?: string | null
        }
        Returns: undefined
      }
      get_public_quote: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      record_quote_event: {
        Args: {
          p_token: string
          p_event_type: Database["public"]["Enums"]["quote_event_type"]
          p_payload?: Json | null
          p_ip?: string | null
          p_user_agent?: string | null
        }
        Returns: undefined
      }
      record_quote_acceptance: {
        Args: {
          p_token: string
          p_status: Database["public"]["Enums"]["quote_acceptance_status"]
          p_name: string
          p_comment?: string | null
          p_accepted_terms?: boolean
          p_ip?: string | null
          p_user_agent?: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      request_status: "new" | "review" | "sent" | "approved" | "lost"
      quote_status: "draft" | "sent" | "approved" | "lost"
      client_status: "active" | "negotiation" | "inactive"
      user_role: "admin" | "staff"
      task_status: "todo" | "doing" | "done" | "blocked" | "canceled"
      task_priority: "low" | "medium" | "high"
      activity_entity: "client" | "request" | "quote" | "contact" | "task" | "attachment"
      discount_type: "percent" | "quantity"
      quote_event_type: "sent" | "opened" | "clicked" | "downloaded" | "accepted" | "declined"
      quote_acceptance_status: "accepted" | "declined"
      invoice_status: "pending" | "paid" | "overdue"
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
  public: {
    Enums: {
      request_status: ["new", "review", "sent", "approved", "lost"],
      quote_status: ["draft", "sent", "approved", "lost"],
      client_status: ["active", "negotiation", "inactive"],
      user_role: ["admin", "staff"],
      task_status: ["todo", "doing", "done", "blocked", "canceled"],
      task_priority: ["low", "medium", "high"],
      activity_entity: ["client", "request", "quote", "contact", "task", "attachment"],
      discount_type: ["percent", "quantity"],
      quote_event_type: ["sent", "opened", "clicked", "downloaded", "accepted", "declined"],
      quote_acceptance_status: ["accepted", "declined"],
      invoice_status: ["pending", "paid", "overdue"],
    },
  },
} as const
