export interface Organization {
  id: number;
  name: string;
  slug: string;
  timezone: string;
  role?: "owner" | "member";
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  notification_preferences: { email: boolean; sms: boolean };
  organizations?: Organization[];
}

export type DeadlineStatus = "upcoming" | "overdue" | "done";
export type Recurrence = "none" | "monthly" | "quarterly" | "yearly" | "custom_days";

export interface DeadlineItem {
  id: number;
  organization_id: number;
  name: string;
  category: string | null;
  notes: string | null;
  due_date: string;
  days_until_due: number;
  recurrence: Recurrence;
  recurrence_interval_days: number | null;
  owner: User;
  status: DeadlineStatus;
  last_completed_at: string | null;
  is_active: boolean;
  reminder_rule?: ReminderRule | null;
  created_at: string;
}

export interface ReminderRule {
  offsets_days: number[];
  overdue_repeat_days: number;
}

export interface ReminderLog {
  id: number;
  channel: "sms" | "email";
  content: string;
  sent_at: string;
  success: boolean;
  error: string | null;
  user: User;
}

export const CATEGORY_PRESETS = ["Domain", "Hosting", "API/Payment Subscription", "Government Levy"];
