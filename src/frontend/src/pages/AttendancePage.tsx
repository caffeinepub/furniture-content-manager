import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ImageIcon,
  Loader2,
  LogIn,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

interface Employee {
  id: string;
  name: string;
  department: string;
  phone: string;
  image: ExternalBlob | null;
}

type AttendanceStatus =
  | { __kind__: "present" }
  | { __kind__: "absent" }
  | { __kind__: "late" };

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function statusLabel(status: AttendanceStatus) {
  return status.__kind__.charAt(0).toUpperCase() + status.__kind__.slice(1);
}

function statusVariant(
  status: AttendanceStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status.__kind__ === "present") return "default";
  if (status.__kind__ === "late") return "secondary";
  return "destructive";
}

/** Generate EMP001, EMP002... based on sorted index */
function generateEmpId(index: number) {
  return `EMP${String(index + 1).padStart(3, "0")}`;
}

// Sort employees: by department then name
function sortEmployees(employees: Employee[]) {
  return [...employees].sort((a, b) => {
    const deptCmp = a.department.localeCompare(b.department);
    if (deptCmp !== 0) return deptCmp;
    return a.name.localeCompare(b.name);
  });
}

// ── Employee hooks ────────────────────────────────────────────────────────────

function useGetAllEmployees() {
  const { actor, isFetching } = useActor();
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllEmployees();
    },
    enabled: !!actor && !isFetching,
  });
}

function useAddEmployee() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Employee, "id">) => {
      if (!actor) throw new Error("No actor");
      const id = crypto.randomUUID();
      await (actor as any).addEmployee(
        id,
        data.name,
        data.department,
        data.phone,
        data.image,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

function useUpdateEmployee() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Employee) => {
      if (!actor) throw new Error("No actor");
      await (actor as any).updateEmployee(
        data.id,
        data.name,
        data.department,
        data.phone,
        data.image,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

function useDeleteEmployee() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      await (actor as any).deleteEmployee(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

// ── Attendance hooks ──────────────────────────────────────────────────────────

function useGetAttendanceByDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", date],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAttendanceByDate(date);
    },
    enabled: !!actor && !isFetching,
  });
}

function useMarkAttendance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      employeeId: string;
      date: string;
      checkIn: string;
      checkOut: string;
      status: AttendanceStatus;
      isUpdate: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      if (data.isUpdate) {
        await (actor as any).updateAttendance(
          data.employeeId,
          data.date,
          data.checkIn,
          data.checkOut,
          data.status,
        );
      } else {
        await (actor as any).markAttendance(
          data.employeeId,
          data.date,
          data.checkIn,
          data.checkOut,
          data.status,
        );
      }
    },
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: ["attendance", vars.date] }),
  });
}

function useDeleteAttendance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      date,
    }: { employeeId: string; date: string }) => {
      if (!actor) throw new Error("No actor");
      await (actor as any).deleteAttendance(employeeId, date);
    },
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: ["attendance", vars.date] }),
  });
}

// ── Employee Form Dialog ──────────────────────────────────────────────────────

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editEmployee: Employee | null;
}

function EmployeeDialog({
  open,
  onOpenChange,
  editEmployee,
}: EmployeeDialogProps) {
  const [name, setName] = useState(editEmployee?.name ?? "");
  const [department, setDepartment] = useState(editEmployee?.department ?? "");
  const [phone, setPhone] = useState(editEmployee?.phone ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    editEmployee?.image ? editEmployee.image.getDirectURL() : null,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMutation = useAddEmployee();
  const updateMutation = useUpdateEmployee();
  const isPending = addMutation.isPending || updateMutation.isPending;

  const handleOpen = (v: boolean) => {
    if (v) {
      setName(editEmployee?.name ?? "");
      setDepartment(editEmployee?.department ?? "");
      setPhone(editEmployee?.phone ?? "");
      setImageFile(null);
      setImagePreview(
        editEmployee?.image ? editEmployee.image.getDirectURL() : null,
      );
      setUploadProgress(0);
    }
    onOpenChange(v);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageBlob: ExternalBlob | null = null;

      if (imageFile) {
        const bytes = new Uint8Array(await imageFile.arrayBuffer());
        imageBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
          setUploadProgress(pct),
        );
      } else if (editEmployee?.image) {
        imageBlob = editEmployee.image;
      }

      if (editEmployee) {
        await updateMutation.mutateAsync({
          id: editEmployee.id,
          name,
          department,
          phone,
          image: imageBlob,
        });
        toast.success("Employee updated");
      } else {
        await addMutation.mutateAsync({
          name,
          department,
          phone,
          image: imageBlob,
        });
        toast.success("Employee added");
      }
      onOpenChange(false);
    } catch {
      toast.error("Failed to save employee");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent data-ocid="employee.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editEmployee ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="emp-name">Full Name</Label>
            <Input
              id="emp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Rahul Sharma"
              data-ocid="employee.name.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emp-dept">Department</Label>
            <Input
              id="emp-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              placeholder="Sales"
              data-ocid="employee.department.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emp-phone">Phone</Label>
            <Input
              id="emp-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              data-ocid="employee.phone.input"
            />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Photo (optional)</Label>
            <div className="relative">
              <button
                type="button"
                className="w-full relative border-2 border-dashed border-border rounded-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => fileInputRef.current?.click()}
                data-ocid="employee.dropzone"
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-28 object-cover"
                    />
                    <div className="absolute inset-0 bg-foreground/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-sm text-white font-medium">
                        Change photo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-7 h-7" />
                    <span className="text-sm">Click to upload photo</span>
                  </div>
                )}
              </button>
              {imagePreview && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background transition-colors"
                  aria-label="Remove image"
                  data-ocid="employee.image.delete_button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              data-ocid="employee.upload_button"
            />
            {isPending && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="employee.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="employee.save_button"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editEmployee ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Attendance Form Dialog ────────────────────────────────────────────────────

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee: Employee | null;
  date: string;
  existing: AttendanceRecord | null;
}

function AttendanceDialog({
  open,
  onOpenChange,
  employee,
  date,
  existing,
}: AttendanceDialogProps) {
  const [status, setStatus] = useState<string>(
    existing?.status.__kind__ ?? "present",
  );
  const [checkIn, setCheckIn] = useState(existing?.checkIn ?? "09:00");
  const [checkOut, setCheckOut] = useState(existing?.checkOut ?? "18:00");

  const markMutation = useMarkAttendance();

  const handleOpen = (v: boolean) => {
    if (v) {
      setStatus(existing?.status.__kind__ ?? "present");
      setCheckIn(existing?.checkIn ?? "09:00");
      setCheckOut(existing?.checkOut ?? "18:00");
    }
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    try {
      await markMutation.mutateAsync({
        employeeId: employee.id,
        date,
        checkIn,
        checkOut,
        status: { __kind__: status as "present" | "absent" | "late" },
        isUpdate: !!existing,
      });
      toast.success(existing ? "Attendance updated" : "Attendance marked");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save attendance");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent data-ocid="attendance.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            {existing ? "Update Attendance" : "Mark Attendance"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {employee?.name}
            </span>{" "}
            — {date}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-ocid="attendance.status.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check-in">Check In</Label>
              <Input
                id="check-in"
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                data-ocid="attendance.checkin.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check-out">Check Out</Label>
              <Input
                id="check-out"
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                data-ocid="attendance.checkout.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="attendance.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={markMutation.isPending}
              data-ocid="attendance.save_button"
            >
              {markMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {existing ? "Update" : "Mark"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Employees Tab ─────────────────────────────────────────────────────────────

function EmployeesTab() {
  const { data: employees, isLoading } = useGetAllEmployees();
  const deleteMutation = useDeleteEmployee();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const sortedEmployees = employees ? sortEmployees(employees) : [];

  const handleEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditEmployee(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" removed`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete employee");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {employees?.length ?? 0} employee{employees?.length !== 1 ? "s" : ""}{" "}
          registered
        </p>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={handleAdd}
          data-ocid="employees.add_button"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2" data-ocid="employees.loading_state">
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-12 w-full rounded-md" />
          ))}
        </div>
      )}

      {!isLoading && (!employees || employees.length === 0) && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg"
          data-ocid="employees.empty_state"
        >
          <Users className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="font-medium mb-1">No employees yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first employee to get started.
          </p>
          <Button
            size="sm"
            onClick={handleAdd}
            data-ocid="employees.empty.add_button"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Employee
          </Button>
        </div>
      )}

      {!isLoading && employees && employees.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">EMP ID</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEmployees.map((emp, i) => (
                <TableRow key={emp.id} data-ocid={`employees.item.${i + 1}`}>
                  <TableCell className="font-mono text-sm font-medium text-primary">
                    {generateEmpId(i)}
                  </TableCell>
                  <TableCell>
                    {emp.image ? (
                      <img
                        src={emp.image.getDirectURL()}
                        alt={emp.name}
                        className="w-9 h-9 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.phone || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(emp)}
                        data-ocid={`employees.edit_button.${i + 1}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(emp)}
                        data-ocid={`employees.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditEmployee(null);
        }}
        editEmployee={editEmployee}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="employees.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Employee?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>{" "}
              and all their attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="employees.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="employees.delete.confirm_button"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Attendance Tab ────────────────────────────────────────────────────────────

function AttendanceTab() {
  const [date, setDate] = useState(todayString());
  const { data: employees, isLoading: empLoading } = useGetAllEmployees();
  const { data: records, isLoading: recLoading } = useGetAttendanceByDate(date);
  const deleteMutation = useDeleteAttendance();

  const [attDialogOpen, setAttDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    emp: Employee;
    record: AttendanceRecord;
  } | null>(null);

  const isLoading = empLoading || recLoading;

  const recordMap = new Map<string, AttendanceRecord>();
  for (const r of records ?? []) {
    recordMap.set(r.employeeId, r);
  }

  const handleMark = (emp: Employee) => {
    setSelectedEmployee(emp);
    setExistingRecord(recordMap.get(emp.id) ?? null);
    setAttDialogOpen(true);
  };

  const handleDeleteAttendance = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({
        employeeId: deleteTarget.emp.id,
        date,
      });
      toast.success(`Attendance record for ${deleteTarget.emp.name} deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete attendance record");
    }
  };

  // Group employees by department
  const sortedEmployees = employees ? sortEmployees(employees) : [];
  const empIdMap = new Map<string, string>();
  sortedEmployees.forEach((emp, i) => empIdMap.set(emp.id, generateEmpId(i)));

  const departments = Array.from(
    new Set(sortedEmployees.map((e) => e.department)),
  ).sort();

  const employeesByDept = new Map<string, Employee[]>();
  for (const dept of departments) {
    employeesByDept.set(
      dept,
      sortedEmployees.filter((e) => e.department === dept),
    );
  }

  // Flat sorted list with row indices for data-ocid
  let globalIdx = 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label htmlFor="att-date" className="shrink-0">
          Date
        </Label>
        <Input
          id="att-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-48"
          data-ocid="attendance.date.input"
        />
        <span className="text-sm text-muted-foreground">
          {records
            ? `${records.length} record${records.length !== 1 ? "s" : ""}`
            : ""}
        </span>
      </div>

      {isLoading && (
        <div className="space-y-2" data-ocid="attendance.loading_state">
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-12 w-full rounded-md" />
          ))}
        </div>
      )}

      {!isLoading && (!employees || employees.length === 0) && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg"
          data-ocid="attendance.empty_state"
        >
          <Users className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="font-medium mb-1">No employees found</p>
          <p className="text-sm text-muted-foreground">
            Add employees in the Employees tab first.
          </p>
        </div>
      )}

      {!isLoading && employees && employees.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">EMP ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => {
                const deptEmployees = employeesByDept.get(dept) ?? [];
                return [
                  // Department header row
                  <TableRow
                    key={`dept-${dept}`}
                    className="bg-muted/50 hover:bg-muted/50"
                  >
                    <TableCell
                      colSpan={7}
                      className="py-2 px-4 font-semibold text-sm text-foreground/80"
                    >
                      {dept}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({deptEmployees.length} employee
                        {deptEmployees.length !== 1 ? "s" : ""})
                      </span>
                    </TableCell>
                  </TableRow>,
                  // Employee rows
                  ...deptEmployees.map((emp) => {
                    const rowIdx = ++globalIdx;
                    const rec = recordMap.get(emp.id);
                    const empId = empIdMap.get(emp.id) ?? "";
                    return (
                      <TableRow
                        key={emp.id}
                        data-ocid={`attendance.item.${rowIdx}`}
                      >
                        <TableCell className="font-mono text-sm font-medium text-primary">
                          {empId}
                        </TableCell>
                        <TableCell className="font-medium">
                          {emp.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {emp.department}
                        </TableCell>
                        <TableCell>
                          {rec ? (
                            <Badge variant={statusVariant(rec.status)}>
                              {statusLabel(rec.status)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {rec?.checkIn || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {rec?.checkOut || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMark(emp)}
                              data-ocid={`attendance.edit_button.${rowIdx}`}
                            >
                              {rec ? (
                                <>
                                  <Pencil className="w-3.5 h-3.5 mr-1" />
                                  Edit
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  Mark
                                </>
                              )}
                            </Button>
                            {rec && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  setDeleteTarget({ emp, record: rec })
                                }
                                data-ocid={`attendance.delete_button.${rowIdx}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }),
                ];
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AttendanceDialog
        open={attDialogOpen}
        onOpenChange={(v) => {
          setAttDialogOpen(v);
          if (!v) {
            setSelectedEmployee(null);
            setExistingRecord(null);
          }
        }}
        employee={selectedEmployee}
        date={date}
        existing={existingRecord}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="attendance.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Attendance Record?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the attendance record for{" "}
              <strong>{deleteTarget?.emp.name}</strong> on {date}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="attendance.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttendance}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="attendance.delete.confirm_button"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AttendancePage() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      if (error.message !== "User is already authenticated") throw error;
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-3">
            Attendance System
          </h1>
          <p className="text-muted-foreground mb-8">
            Please sign in as admin to manage attendance records.
          </p>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            size="lg"
            className="gap-2"
            data-ocid="attendance.login.button"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {isLoggingIn ? "Signing in..." : "Sign in to continue"}
          </Button>
        </motion.div>
      </main>
    );
  }

  if (!adminLoading && isAdmin === false) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-3">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            Your account does not have admin privileges.
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container max-w-5xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-semibold">
            Attendance System
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage employees and track daily attendance
          </p>
        </motion.div>

        <Tabs defaultValue="employees" data-ocid="attendance.tab">
          <TabsList className="mb-6">
            <TabsTrigger value="employees" data-ocid="attendance.employees.tab">
              Employees
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              data-ocid="attendance.attendance.tab"
            >
              Attendance
            </TabsTrigger>
          </TabsList>
          <TabsContent value="employees">
            <EmployeesTab />
          </TabsContent>
          <TabsContent value="attendance">
            <AttendanceTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
