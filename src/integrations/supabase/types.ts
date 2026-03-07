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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      assignment_marks: {
        Row: {
          assignment1: number | null
          assignment2: number | null
          assignment3: number | null
          created_at: string
          id: string
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          assignment1?: number | null
          assignment2?: number | null
          assignment3?: number | null
          created_at?: string
          id?: string
          student_id: string
          subject?: string
          updated_at?: string
        }
        Update: {
          assignment1?: number | null
          assignment2?: number | null
          assignment3?: number | null
          created_at?: string
          id?: string
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          marked_by: string | null
          roll_number: string
          status: string
          student_id: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          id?: string
          marked_by?: string | null
          roll_number: string
          status: string
          student_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          marked_by?: string | null
          roll_number?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_assignments: {
        Row: {
          academic_year: string
          branch: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          academic_year: string
          branch?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          academic_year?: string
          branch?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount: number
          created_at: string
          fee_id: string
          id: string
          payment_date: string
          payment_method: string | null
          receipt_number: string | null
          recorded_by: string | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee_id: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
          recorded_by?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee_id?: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
          recorded_by?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          academic_year: string
          created_at: string
          exam_fee: number
          id: string
          other_fee: number
          student_id: string
          total: number | null
          tuition: number
        }
        Insert: {
          academic_year?: string
          created_at?: string
          exam_fee?: number
          id?: string
          other_fee?: number
          student_id: string
          total?: number | null
          tuition?: number
        }
        Update: {
          academic_year?: string
          created_at?: string
          exam_fee?: number
          id?: string
          other_fee?: number
          student_id?: string
          total?: number | null
          tuition?: number
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_marks: {
        Row: {
          average: number | null
          created_at: string
          id: string
          mid1: number | null
          mid2: number | null
          mid3: number | null
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          average?: number | null
          created_at?: string
          id?: string
          mid1?: number | null
          mid2?: number | null
          mid3?: number | null
          student_id: string
          subject?: string
          updated_at?: string
        }
        Update: {
          average?: number | null
          created_at?: string
          id?: string
          mid1?: number | null
          mid2?: number | null
          mid3?: number | null
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          created_at: string
          description: string
          id: string
          is_pinned: boolean | null
          posted_by: string | null
          posted_by_name: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_pinned?: boolean | null
          posted_by?: string | null
          posted_by_name?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_pinned?: boolean | null
          posted_by?: string | null
          posted_by_name?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          academic_year: string
          admission_year: number | null
          branch: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          roll_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academic_year?: string
          admission_year?: number | null
          branch?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          roll_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academic_year?: string
          admission_year?: number | null
          branch?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          roll_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transport_registrations: {
        Row: {
          academic_year: string
          created_at: string
          id: string
          pickup_point: string
          route_name: string
          status: string
          student_id: string
          transport_fee: number
        }
        Insert: {
          academic_year?: string
          created_at?: string
          id?: string
          pickup_point: string
          route_name: string
          status?: string
          student_id: string
          transport_fee?: number
        }
        Update: {
          academic_year?: string
          created_at?: string
          id?: string
          pickup_point?: string
          route_name?: string
          status?: string
          student_id?: string
          transport_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "transport_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "management" | "staff" | "faculty" | "student"
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
      app_role: ["admin", "management", "staff", "faculty", "student"],
    },
  },
} as const
