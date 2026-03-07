import { DashboardLayout } from "@/components/DashboardLayout";
import { Search, Plus, Download, Eye, Pencil, ChevronLeft, ChevronRight, Users, Upload } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useStudents } from "@/hooks/useSupabaseData";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const Students = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canAddStudent = user?.role === "admin" || user?.role === "management" || user?.role === "faculty";
  const { data: students = [], isLoading } = useStudents();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<typeof students[0] | null>(null);

  // -- NEW FUNCTIONALITY --
  const [showForm, setShowForm] = useState<false | 'manual' | 'csv'>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    roll_number: "",
    academic_year: "1st Year",
    branch: "Computer Science",
    phone: "",
  });

  const handleExport = () => {
    const csvContent = [
      ["Name", "Roll Number", "Year", "Branch", "Phone", "Status"],
      ...students.map(s => [s.name, s.roll_number, s.academic_year, s.branch, s.phone || "", s.is_active ? "Active" : "Inactive"])
    ].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "kiet_students_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Students exported as CSV");
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return toast.error("Please choose a valid CSV file.");
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setFormLoading(true);
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error("File empty or missing data rows");

        const toInsert = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim());
          return {
            name: values[0] || "",
            roll_number: values[1] || "",
            academic_year: values[2] || "1st Year",
            branch: values[3] || "Computer Science",
            phone: values[4] || "",
            is_active: true
          };
        }).filter(s => s.name && s.roll_number);

        const { error } = await supabase.from("students").insert(toInsert);
        setFormLoading(false);

        if (error) {
          console.error("CSV IMPORT ERROR:", error);
          toast.error(error.message || "Failed to import students. Roll numbers might already exist.");
        } else {
          toast.success(`${toInsert.length} students imported successfully!`);
          setShowForm(false);
          setCsvFile(null);
          qc.invalidateQueries({ queryKey: ["students"] });
        }
      } catch (err) {
        setFormLoading(false);
        toast.error("Error parsing CSV. Ensure correct format: Name, Roll Number, Year, Branch, Phone");
      }
    };
    reader.readAsText(csvFile);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddStudent) {
      toast.error("You do not have permission to add students.");
      return;
    }
    setFormLoading(true);
    const { error } = await supabase.from("students").insert({
      name: newStudent.name,
      roll_number: newStudent.roll_number,
      academic_year: newStudent.academic_year,
      branch: newStudent.branch,
      phone: newStudent.phone,
      is_active: true
    });
    setFormLoading(false);
    if (error) {
      console.error("ADD STUDENT ERROR:", error);
      toast.error(error.message || "Failed to add student. Roll number might already exist.");
    } else {
      toast.success("Student added successfully!");
      setShowForm(false);
      setNewStudent({ name: "", roll_number: "", academic_year: "1st Year", branch: "Computer Science", phone: "" });
      qc.invalidateQueries({ queryKey: ["students"] });
    }
  };
  // -------------------------

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.roll_number.toLowerCase().includes(search.toLowerCase());
    const matchYear = yearFilter === "All" || s.academic_year === yearFilter;
    return matchSearch && matchYear;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Get unique years from data
  const years = ["All", ...Array.from(new Set(students.map(s => s.academic_year))).sort()];
  const yearCounts: Record<string, number> = { "All": students.length };
  students.forEach(s => { yearCounts[s.academic_year] = (yearCounts[s.academic_year] || 0) + 1; });

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage student records across all years</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={handleExport} className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors shadow-sm">
              <Download className="h-4 w-4" /> Export
            </button>
            {canAddStudent && (
              <>
                <button
                  onClick={() => setShowForm(showForm === 'manual' ? false : 'manual')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity shadow-sm ${showForm === 'manual' ? 'bg-secondary text-foreground border' : 'bg-primary text-primary-foreground hover:opacity-90 shadow-red-500/20'}`}
                >
                  <Plus className="h-4 w-4" /> {showForm === 'manual' ? "Cancel Manual" : "Add Manually"}
                </button>
                <button
                  onClick={() => setShowForm(showForm === 'csv' ? false : 'csv')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity shadow-sm ${showForm === 'csv' ? 'bg-secondary text-foreground border' : 'bg-emerald-600 text-white hover:opacity-90 shadow-emerald-500/20'}`}
                >
                  <Upload className="h-4 w-4" /> {showForm === 'csv' ? "Cancel Import" : "Import CSV"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Add Student Form */}
        {showForm === 'csv' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border p-6 shadow-card">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-emerald-600"><Upload className="h-4 w-4" /> Bulk Import Students</h3>
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed rounded-xl border-emerald-500/30 bg-emerald-500/5 text-center space-y-3">
                <Upload className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-medium">Upload a CSV file with student data</p>
                <p className="text-xs text-muted-foreground mt-1">First row should be headers. Order: Name, Roll Number, Year, Branch, Phone</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => setCsvFile(e.target.files?.[0] || null)}
                  className="mt-4 text-xs mx-auto block w-fit file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 transition-colors"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={handleCsvUpload} disabled={formLoading || !csvFile} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                  {formLoading ? "Importing..." : <><Upload className="h-4 w-4" /> Start Import</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showForm === 'manual' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border p-6 shadow-card">
            <h3 className="text-sm font-semibold mb-4">Register New Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Full Name</label>
                  <input type="text" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} placeholder="Student Name" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Roll Number</label>
                  <input type="text" value={newStudent.roll_number} onChange={e => setNewStudent({ ...newStudent, roll_number: e.target.value })} placeholder="e.g. 25371-CM-067" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Phone Number</label>
                  <input type="text" value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} placeholder="Phone (Optional)" className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Academic Year</label>
                  <select value={newStudent.academic_year} onChange={e => setNewStudent({ ...newStudent, academic_year: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Branch</label>
                  <select value={newStudent.branch} onChange={e => setNewStudent({ ...newStudent, branch: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" required>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={formLoading} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                  {formLoading ? "Saving..." : "Save Student"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students added yet"
            description="Students will appear here once they are added to the system by faculty or admin."
          />
        ) : (
          <>
            {/* Year Filter Tabs */}
            <div className="flex items-center gap-1.5 rounded-xl bg-secondary/50 p-1.5 w-fit border flex-wrap">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => { setYearFilter(year); setCurrentPage(1); }}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${yearFilter === year
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {year}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${yearFilter === year ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                    {yearCounts[year] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border bg-card px-4 py-2.5 flex-1 max-w-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all shadow-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
                  className="bg-transparent text-sm outline-none w-full"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{filtered.length} students found</span>
            </div>

            {/* Selected Student Profile */}
            {selectedStudent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-2xl border bg-card shadow-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-red-500/20">
                      {getInitials(selectedStudent.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{selectedStudent.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{selectedStudent.roll_number}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{selectedStudent.academic_year}</span>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{selectedStudent.branch}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t">
                  {[
                    { label: "Phone", value: selectedStudent.phone || "—" },
                    { label: "Branch", value: selectedStudent.branch },
                    { label: "Year", value: selectedStudent.academic_year },
                    { label: "Status", value: selectedStudent.is_active ? "Active" : "Inactive" },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                      <p className="text-sm font-semibold mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Table */}
            <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Student</th>
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Roll Number</th>
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Year</th>
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Branch</th>
                      <th className="text-left px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Phone</th>
                      <th className="text-right px-5 py-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((s, i) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b last:border-0 hover:bg-secondary/20 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600">
                              {getInitials(s.name)}
                            </div>
                            <span className="font-semibold">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{s.roll_number}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${s.academic_year === "1st Year" ? "bg-red-500/10 text-red-600" :
                            s.academic_year === "2nd Year" ? "bg-blue-500/10 text-blue-600" :
                              "bg-amber-500/10 text-amber-600"
                            }`}>{s.academic_year}</span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{s.branch}</td>
                        <td className="px-5 py-4 text-muted-foreground">{s.phone || "—"}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="rounded-lg p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="rounded-lg p-2 text-muted-foreground hover:text-amber-500 hover:bg-amber-50 transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-4 border-t bg-secondary/20">
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                    <span className="font-semibold text-foreground">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span>{" "}
                    of <span className="font-semibold text-foreground">{filtered.length}</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg p-2 border bg-card hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${currentPage === i + 1
                          ? "bg-primary text-white shadow-sm"
                          : "border bg-card hover:bg-secondary"
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg p-2 border bg-card hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Students;
