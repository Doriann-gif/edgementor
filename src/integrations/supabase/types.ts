export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      code_redemptions: {
        Row: {
          code_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string
          current_uses: number
          discount_percent: number
          expires_at: string | null
          id: string
          max_uses: number | null
          mentor_id: string | null
          type: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by: string
          current_uses?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          mentor_id?: string | null
          type?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string
          current_uses?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          mentor_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_codes_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      feed_posts: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      intro_requests: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          message: string | null
          requester_email: string
          requester_name: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          message?: string | null
          requester_email: string
          requester_name: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          message?: string | null
          requester_email?: string
          requester_name?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intro_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_applications: {
        Row: {
          bio: string
          concepts: string[]
          country: string | null
          created_at: string
          email: string | null
          experience: string
          full_name: string
          id: string
          instruments: string[]
          monthly_price: number
          payment_type: string
          proof_url: string | null
          session: string
          social_link: string | null
          status: string
          user_id: string
        }
        Insert: {
          bio: string
          concepts?: string[]
          country?: string | null
          created_at?: string
          email?: string | null
          experience: string
          full_name: string
          id?: string
          instruments?: string[]
          monthly_price: number
          payment_type?: string
          proof_url?: string | null
          session: string
          social_link?: string | null
          status?: string
          user_id: string
        }
        Update: {
          bio?: string
          concepts?: string[]
          country?: string | null
          created_at?: string
          email?: string | null
          experience?: string
          full_name?: string
          id?: string
          instruments?: string[]
          monthly_price?: number
          payment_type?: string
          proof_url?: string | null
          session?: string
          social_link?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_content: {
        Row: {
          content_type: string
          content_url: string
          created_at: string
          description: string
          display_order: number
          id: string
          mentor_id: string
          title: string
        }
        Insert: {
          content_type?: string
          content_url?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          mentor_id: string
          title: string
        }
        Update: {
          content_type?: string
          content_url?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          mentor_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_content_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_content_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_payment_config: {
        Row: {
          auto_payout: boolean
          created_at: string
          mentor_id: string
          payouts_enabled: boolean
          stripe_connect_account_id: string | null
          updated_at: string
        }
        Insert: {
          auto_payout?: boolean
          created_at?: string
          mentor_id: string
          payouts_enabled?: boolean
          stripe_connect_account_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_payout?: boolean
          created_at?: string
          mentor_id?: string
          payouts_enabled?: boolean
          stripe_connect_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_payment_config_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_payment_config_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_reviews: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          rating: number
          review_date: string
          review_text: string
          reviewer_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          rating: number
          review_date: string
          review_text: string
          reviewer_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          rating?: number
          review_date?: string
          review_text?: string
          reviewer_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_showcase_images: {
        Row: {
          caption: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          mentor_id: string
        }
        Insert: {
          caption?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          mentor_id: string
        }
        Update: {
          caption?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          mentor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_showcase_images_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_showcase_images_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          available: boolean
          avatar: string
          banner_color: string
          bio: string
          concepts: string[]
          country: string | null
          created_at: string
          experience: string
          full_bio: string
          highlights: string[]
          id: string
          ideal_for: string | null
          instruments: string[]
          languages: string[] | null
          monthly_price: number
          name: string
          payment_type: string
          proof_track_record_url: string | null
          proof_verified_at: string | null
          rating: number
          response_time: string | null
          session: string
          social_link: string | null
          status: string
          students: number
          tier: string
          timezone: string | null
          user_id: string | null
        }
        Insert: {
          available?: boolean
          avatar: string
          banner_color?: string
          bio: string
          concepts?: string[]
          country?: string | null
          created_at?: string
          experience: string
          full_bio?: string
          highlights?: string[]
          id?: string
          ideal_for?: string | null
          instruments?: string[]
          languages?: string[] | null
          monthly_price: number
          name: string
          payment_type?: string
          proof_track_record_url?: string | null
          proof_verified_at?: string | null
          rating?: number
          response_time?: string | null
          session: string
          social_link?: string | null
          status?: string
          students?: number
          tier?: string
          timezone?: string | null
          user_id?: string | null
        }
        Update: {
          available?: boolean
          avatar?: string
          banner_color?: string
          bio?: string
          concepts?: string[]
          country?: string | null
          created_at?: string
          experience?: string
          full_bio?: string
          highlights?: string[]
          id?: string
          ideal_for?: string | null
          instruments?: string[]
          languages?: string[] | null
          monthly_price?: number
          name?: string
          payment_type?: string
          proof_track_record_url?: string | null
          proof_verified_at?: string | null
          rating?: number
          response_time?: string | null
          session?: string
          social_link?: string | null
          status?: string
          students?: number
          tier?: string
          timezone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_mentor_id: string | null
          sender_name: string
          sender_user_id: string | null
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_mentor_id?: string | null
          sender_name: string
          sender_user_id?: string | null
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_mentor_id?: string | null
          sender_name?: string
          sender_user_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_mentor_id_fkey"
            columns: ["sender_mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_mentor_id_fkey"
            columns: ["sender_mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email_notifications: boolean
          id: string
          marketing_emails: boolean
          timezone: string | null
          trading_experience: string | null
          trading_interests: string[]
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean
          id: string
          marketing_emails?: boolean
          timezone?: string | null
          trading_experience?: string | null
          trading_interests?: string[]
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          timezone?: string | null
          trading_experience?: string | null
          trading_interests?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      saved_mentors: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_mentors_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_mentors_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          expires_at: string | null
          id: string
          mentor_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          mentor_id: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          mentor_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_payment_config: {
        Row: {
          created_at: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      mentors_public: {
        Row: {
          available: boolean | null
          avatar: string | null
          banner_color: string | null
          bio: string | null
          concepts: string[] | null
          country: string | null
          created_at: string | null
          experience: string | null
          full_bio: string | null
          highlights: string[] | null
          id: string | null
          instruments: string[] | null
          monthly_price: number | null
          name: string | null
          payment_type: string | null
          rating: number | null
          session: string | null
          social_link: string | null
          status: string | null
          students: number | null
          tier: string | null
        }
        Insert: {
          available?: boolean | null
          avatar?: string | null
          banner_color?: string | null
          bio?: string | null
          concepts?: string[] | null
          country?: string | null
          created_at?: string | null
          experience?: string | null
          full_bio?: string | null
          highlights?: string[] | null
          id?: string | null
          instruments?: string[] | null
          monthly_price?: number | null
          name?: string | null
          payment_type?: string | null
          rating?: number | null
          session?: string | null
          social_link?: string | null
          status?: string | null
          students?: number | null
          tier?: string | null
        }
        Update: {
          available?: boolean | null
          avatar?: string | null
          banner_color?: string | null
          bio?: string | null
          concepts?: string[] | null
          country?: string | null
          created_at?: string | null
          experience?: string | null
          full_bio?: string | null
          highlights?: string[] | null
          id?: string | null
          instruments?: string[] | null
          monthly_price?: number | null
          name?: string | null
          payment_type?: string | null
          rating?: number | null
          session?: string | null
          social_link?: string | null
          status?: string | null
          students?: number | null
          tier?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_user_id_by_email: { Args: { _email: string }; Returns: string }
      message_mentor: {
        Args: { _mentor_id: string; _subject: string; _body: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
