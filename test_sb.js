import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uiehyifgzjffmuwzotfq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZWh5aWZnempmZm11d3pvdGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NjgxOTEsImV4cCI6MjA4ODQ0NDE5MX0.UuuMcuyfd8Hl_oCYtpOYuixAgyPd-l2WK1PHowIOgug";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase.from("system_users").select("*");
  console.log("Users:", data);
}
checkUsers();
