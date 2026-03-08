import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uiehyifgzjffmuwzotfq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZWh5aWZnempmZm11d3pvdGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NjgxOTEsImV4cCI6MjA4ODQ0NDE5MX0.UuuMcuyfd8Hl_oCYtpOYuixAgyPd-l2WK1PHowIOgug";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Fetching student...");
    const { data: student, error: stuError } = await supabase
        .from("students")
        .select("id")
        .limit(1)
        .single();

    if (stuError || !student) {
        console.error("No student found:", stuError);
        return;
    }

    console.log("Found student:", student.id);

    console.log("Attempting insert into internal_marks...");
    const m1 = 20, m2 = null, m3 = null;
    const bestTwo = [20];
    const average = 20;

    const { error } = await supabase.from("internal_marks").insert({
        student_id: student.id,
        subject: "Test Subject",
        mid1: m1,
        mid2: m2,
        mid3: m3,
        average
    });

    if (error) {
        console.error("INSERTION ERROR:", error);
    } else {
        console.log("Insert success!");
    }
}

testInsert();
