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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          country: string
          created_at: string | null
          id: string
          is_municipality: boolean | null
          latitude: number
          longitude: number
          name: string
          population: number | null
          region: string | null
        }
        Insert: {
          country?: string
          created_at?: string | null
          id?: string
          is_municipality?: boolean | null
          latitude: number
          longitude: number
          name: string
          population?: number | null
          region?: string | null
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          is_municipality?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          population?: number | null
          region?: string | null
        }
        Relationships: []
      }
      collection_events: {
        Row: {
          city_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string
          id: string
          latitude: number
          location_name: string | null
          longitude: number
          max_participants: number | null
          notes: string | null
          required_equipment: string[] | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type?: string
          id?: string
          latitude: number
          location_name?: string | null
          longitude: number
          max_participants?: number | null
          notes?: string | null
          required_equipment?: string[] | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string
          id?: string
          latitude?: number
          location_name?: string | null
          longitude?: number
          max_participants?: number | null
          notes?: string | null
          required_equipment?: string[] | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_routes: {
        Row: {
          assigned_team: string | null
          city_id: string | null
          created_at: string | null
          created_by: string | null
          estimated_duration_minutes: number | null
          id: string
          name: string
          route_type: string
          schedule_days: string[] | null
          schedule_time: string | null
          status: string
          updated_at: string | null
          waypoints: Json
        }
        Insert: {
          assigned_team?: string | null
          city_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          name: string
          route_type?: string
          schedule_days?: string[] | null
          schedule_time?: string | null
          status?: string
          updated_at?: string | null
          waypoints?: Json
        }
        Update: {
          assigned_team?: string | null
          city_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          name?: string
          route_type?: string
          schedule_days?: string[] | null
          schedule_time?: string | null
          status?: string
          updated_at?: string | null
          waypoints?: Json
        }
        Relationships: [
          {
            foreignKeyName: "collection_routes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      discharge_sites: {
        Row: {
          address: string | null
          capacity_percentage: number | null
          city_id: string | null
          closing_time: string | null
          contact_name: string | null
          created_at: string | null
          created_by: string | null
          current_capacity_tons: number | null
          email: string | null
          id: string
          latitude: number
          longitude: number
          max_capacity_tons: number | null
          name: string
          notes: string | null
          opening_time: string | null
          operating_days: string[] | null
          phone: string | null
          site_type: string
          status: string
          updated_at: string | null
          waste_types_accepted: string[] | null
        }
        Insert: {
          address?: string | null
          capacity_percentage?: number | null
          city_id?: string | null
          closing_time?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          current_capacity_tons?: number | null
          email?: string | null
          id?: string
          latitude: number
          longitude: number
          max_capacity_tons?: number | null
          name: string
          notes?: string | null
          opening_time?: string | null
          operating_days?: string[] | null
          phone?: string | null
          site_type?: string
          status?: string
          updated_at?: string | null
          waste_types_accepted?: string[] | null
        }
        Update: {
          address?: string | null
          capacity_percentage?: number | null
          city_id?: string | null
          closing_time?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          current_capacity_tons?: number | null
          email?: string | null
          id?: string
          latitude?: number
          longitude?: number
          max_capacity_tons?: number | null
          name?: string
          notes?: string | null
          opening_time?: string | null
          operating_days?: string[] | null
          phone?: string | null
          site_type?: string
          status?: string
          updated_at?: string | null
          waste_types_accepted?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "discharge_sites_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          organization_id: string | null
          participant_name: string
          participant_type: string
          status: string
          team_size: number | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          participant_name: string
          participant_type: string
          status?: string
          team_size?: number | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          participant_name?: string
          participant_type?: string
          status?: string
          team_size?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "collection_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_regions: {
        Row: {
          city_id: string
          created_at: string | null
          id: string
          ngo_user_id: string
        }
        Insert: {
          city_id: string
          created_at?: string | null
          id?: string
          ngo_user_id: string
        }
        Update: {
          city_id?: string
          created_at?: string | null
          id?: string
          ngo_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_regions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string | null
          organization_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          organization_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          organization_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_territories: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          city_id: string
          id: string
          organization_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          city_id: string
          id?: string
          organization_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          city_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_territories_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_territories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partner_companies: {
        Row: {
          address: string | null
          city_id: string | null
          company_type: string
          contact_name: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string | null
          services: string[] | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          company_type?: string
          contact_name?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          services?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string | null
          company_type?: string
          contact_name?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          services?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_companies_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          impact_score: number | null
          is_active: boolean | null
          last_login_at: string | null
          phone: string | null
          preferred_language: string | null
          reports_count: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          impact_score?: number | null
          is_active?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          preferred_language?: string | null
          reports_count?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          impact_score?: number | null
          is_active?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          preferred_language?: string | null
          reports_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      report_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          report_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          report_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          report_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_assignments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_assignments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      report_history: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_data: Json | null
          new_status: string | null
          notes: string | null
          old_data: Json | null
          old_status: string | null
          report_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          new_status?: string | null
          notes?: string | null
          old_data?: Json | null
          old_status?: string | null
          report_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          new_status?: string | null
          notes?: string | null
          old_data?: Json | null
          old_status?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_duplicate_of: string | null
          ai_priority_score: number | null
          category: Database["public"]["Enums"]["report_category"]
          city_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string
          environmental_impact_score: number | null
          id: string
          is_deleted: boolean | null
          latitude: number
          longitude: number
          photos: string[] | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          resolved_at: string | null
          resolved_by: string | null
          sla_due_date: string | null
          status: Database["public"]["Enums"]["report_status"] | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          ai_duplicate_of?: string | null
          ai_priority_score?: number | null
          category: Database["public"]["Enums"]["report_category"]
          city_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description: string
          environmental_impact_score?: number | null
          id?: string
          is_deleted?: boolean | null
          latitude: number
          longitude: number
          photos?: string[] | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          ai_duplicate_of?: string | null
          ai_priority_score?: number | null
          category?: Database["public"]["Enums"]["report_category"]
          city_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          environmental_impact_score?: number | null
          id?: string
          is_deleted?: boolean | null
          latitude?: number
          longitude?: number
          photos?: string[] | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      sorting_centers: {
        Row: {
          address: string | null
          center_type: string
          city_id: string | null
          closing_time: string | null
          contact_name: string | null
          created_at: string | null
          created_by: string | null
          current_load_tons: number | null
          daily_capacity_tons: number | null
          email: string | null
          id: string
          latitude: number
          longitude: number
          materials_processed: string[] | null
          name: string
          notes: string | null
          opening_time: string | null
          operating_days: string[] | null
          phone: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          center_type?: string
          city_id?: string | null
          closing_time?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          current_load_tons?: number | null
          daily_capacity_tons?: number | null
          email?: string | null
          id?: string
          latitude: number
          longitude: number
          materials_processed?: string[] | null
          name: string
          notes?: string | null
          opening_time?: string | null
          operating_days?: string[] | null
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          center_type?: string
          city_id?: string | null
          closing_time?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          current_load_tons?: number | null
          daily_capacity_tons?: number | null
          email?: string | null
          id?: string
          latitude?: number
          longitude?: number
          materials_processed?: string[] | null
          name?: string
          notes?: string | null
          opening_time?: string | null
          operating_days?: string[] | null
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sorting_centers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      team_workers: {
        Row: {
          assigned_route_id: string | null
          city_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          phone: string | null
          role: string
          schedule_end: string | null
          schedule_start: string | null
          status: string
          updated_at: string | null
          working_days: string[] | null
        }
        Insert: {
          assigned_route_id?: string | null
          city_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          phone?: string | null
          role?: string
          schedule_end?: string | null
          schedule_start?: string | null
          status?: string
          updated_at?: string | null
          working_days?: string[] | null
        }
        Update: {
          assigned_route_id?: string | null
          city_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          phone?: string | null
          role?: string
          schedule_end?: string | null
          schedule_start?: string | null
          status?: string
          updated_at?: string | null
          working_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "team_workers_assigned_route_id_fkey"
            columns: ["assigned_route_id"]
            isOneToOne: false
            referencedRelation: "collection_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_workers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      discharge_sites_public: {
        Row: {
          address: string | null
          capacity_percentage: number | null
          city_id: string | null
          closing_time: string | null
          created_at: string | null
          current_capacity_tons: number | null
          id: string | null
          latitude: number | null
          longitude: number | null
          max_capacity_tons: number | null
          name: string | null
          opening_time: string | null
          operating_days: string[] | null
          site_type: string | null
          status: string | null
          waste_types_accepted: string[] | null
        }
        Insert: {
          address?: string | null
          capacity_percentage?: number | null
          city_id?: string | null
          closing_time?: string | null
          created_at?: string | null
          current_capacity_tons?: number | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          max_capacity_tons?: number | null
          name?: string | null
          opening_time?: string | null
          operating_days?: string[] | null
          site_type?: string | null
          status?: string | null
          waste_types_accepted?: string[] | null
        }
        Update: {
          address?: string | null
          capacity_percentage?: number | null
          city_id?: string | null
          closing_time?: string | null
          created_at?: string | null
          current_capacity_tons?: number | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          max_capacity_tons?: number | null
          name?: string | null
          opening_time?: string | null
          operating_days?: string[] | null
          site_type?: string | null
          status?: string | null
          waste_types_accepted?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "discharge_sites_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          city_id: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          impact_score: number | null
          reports_count: number | null
        }
        Insert: {
          avatar_url?: string | null
          city_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          impact_score?: number | null
          reports_count?: number | null
        }
        Update: {
          avatar_url?: string | null
          city_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          impact_score?: number | null
          reports_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      reports_public: {
        Row: {
          category: Database["public"]["Enums"]["report_category"] | null
          city_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_deleted: boolean | null
          latitude: number | null
          longitude: number | null
          photos: string[] | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          resolved_at: string | null
          sla_due_date: string | null
          status: Database["public"]["Enums"]["report_status"] | null
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["report_category"] | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_deleted?: boolean | null
          latitude?: never
          longitude?: never
          photos?: string[] | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          resolved_at?: string | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"] | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_deleted?: boolean | null
          latitude?: never
          longitude?: never
          photos?: string[] | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          resolved_at?: string | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      sorting_centers_public: {
        Row: {
          address: string | null
          center_type: string | null
          city_id: string | null
          closing_time: string | null
          created_at: string | null
          current_load_tons: number | null
          daily_capacity_tons: number | null
          id: string | null
          latitude: number | null
          longitude: number | null
          materials_processed: string[] | null
          name: string | null
          opening_time: string | null
          operating_days: string[] | null
          status: string | null
        }
        Insert: {
          address?: string | null
          center_type?: string | null
          city_id?: string | null
          closing_time?: string | null
          created_at?: string | null
          current_load_tons?: number | null
          daily_capacity_tons?: number | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          materials_processed?: string[] | null
          name?: string | null
          opening_time?: string | null
          operating_days?: string[] | null
          status?: string | null
        }
        Update: {
          address?: string | null
          center_type?: string | null
          city_id?: string | null
          closing_time?: string | null
          created_at?: string | null
          current_load_tons?: number | null
          daily_capacity_tons?: number | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          materials_processed?: string[] | null
          name?: string | null
          opening_time?: string | null
          operating_days?: string[] | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sorting_centers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_territory: {
        Args: { _city_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_full_profile: {
        Args: { _profile_id: string; _viewer_id: string }
        Returns: boolean
      }
      get_profile_city_id: { Args: { _user_id: string }; Returns: string }
      get_report_with_submitter: {
        Args: { report_id: string }
        Returns: {
          category: string
          city_id: string
          created_at: string
          description: string
          id: string
          latitude: number
          longitude: number
          photos: string[]
          priority: string
          status: string
          submitter_id: string
          submitter_name: string
        }[]
      }
      get_user_organizations: { Args: { _user_id: string }; Returns: string[] }
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          city_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          impact_score: number
          phone: string
          reports_count: number
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_user_impact: { Args: { user_id: string }; Returns: undefined }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "municipality"
        | "citizen"
        | "tourist"
        | "ngo"
        | "volunteer"
        | "partner"
      organization_type:
        | "municipality"
        | "ngo"
        | "government"
        | "private"
        | "international"
      priority_level: "low" | "medium" | "high" | "critical"
      report_category:
        | "waste"
        | "pollution"
        | "danger"
        | "noise"
        | "water"
        | "air"
        | "illegal_dumping"
        | "deforestation"
        | "water_pollution"
        | "sewage"
        | "chemical_waste"
        | "medical_waste"
        | "electronic_waste"
        | "construction_debris"
        | "agricultural_waste"
        | "oil_spill"
        | "wildlife_harm"
        | "other"
      report_status:
        | "pending"
        | "in_progress"
        | "resolved"
        | "assigned"
        | "rejected"
        | "verified"
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
      app_role: [
        "admin",
        "municipality",
        "citizen",
        "tourist",
        "ngo",
        "volunteer",
        "partner",
      ],
      organization_type: [
        "municipality",
        "ngo",
        "government",
        "private",
        "international",
      ],
      priority_level: ["low", "medium", "high", "critical"],
      report_category: [
        "waste",
        "pollution",
        "danger",
        "noise",
        "water",
        "air",
        "illegal_dumping",
        "deforestation",
        "water_pollution",
        "sewage",
        "chemical_waste",
        "medical_waste",
        "electronic_waste",
        "construction_debris",
        "agricultural_waste",
        "oil_spill",
        "wildlife_harm",
        "other",
      ],
      report_status: [
        "pending",
        "in_progress",
        "resolved",
        "assigned",
        "rejected",
        "verified",
      ],
    },
  },
} as const
