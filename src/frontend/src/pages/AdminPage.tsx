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
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  LogIn,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { FurnitureFormDialog } from "../components/FurnitureFormDialog";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type FurnitureItem,
  useDeleteFurnitureItem,
  useGetAllFurnitureItems,
  useIsCallerAdmin,
} from "../hooks/useQueries";

const ADMIN_SKELETON_KEYS = ["as1", "as2", "as3", "as4", "as5"];

export function AdminPage() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: items, isLoading: itemsLoading } = useGetAllFurnitureItems();
  const deleteMutation = useDeleteFurnitureItem();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<FurnitureItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FurnitureItem | null>(null);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      if (error.message === "User is already authenticated") {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleEdit = (item: FurnitureItem) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" removed`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  // Not logged in
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
            Admin Access
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in to manage your furniture collection — add, edit, and remove
            items.
          </p>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            size="lg"
            className="gap-2"
            data-ocid="admin.login.button"
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

  // Logged in but not admin
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
          <p className="text-muted-foreground mb-8">
            Your account does not have admin privileges.
          </p>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-ocid="admin.logout.button"
          >
            Sign out
          </Button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold">
              Content Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your furniture collection
            </p>
          </div>
          <Button
            onClick={handleAddNew}
            className="gap-2"
            data-ocid="admin.add.button"
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </Button>
        </div>

        {/* Loading */}
        {(adminLoading || itemsLoading) && (
          <div className="space-y-3" data-ocid="admin.loading_state">
            {ADMIN_SKELETON_KEYS.map((k) => (
              <div
                key={k}
                className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border"
              >
                <Skeleton className="w-16 h-12 rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/5" />
                </div>
                <Skeleton className="w-20 h-8 rounded" />
                <Skeleton className="w-20 h-8 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!adminLoading && !itemsLoading && (!items || items.length === 0) && (
          <div
            className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-xl border border-dashed border-border"
            data-ocid="admin.empty_state"
          >
            <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              No items yet
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Start building your collection by adding your first furniture
              item.
            </p>
            <Button onClick={handleAddNew} data-ocid="admin.empty.add.button">
              <Plus className="w-4 h-4 mr-2" /> Add First Item
            </Button>
          </div>
        )}

        {/* Item list */}
        {!adminLoading && !itemsLoading && items && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors"
                data-ocid={`admin.item.${index + 1}`}
              >
                <div className="w-16 h-12 rounded-md overflow-hidden bg-secondary shrink-0">
                  <img
                    src={item.image.getDirectURL()}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {item.name}
                  </p>
                  <Badge variant="outline" className="text-xs mt-0.5">
                    {item.category}
                  </Badge>
                </div>
                {item.description && (
                  <p className="hidden md:block text-sm text-muted-foreground line-clamp-1 flex-1 min-w-0 max-w-xs">
                    {item.description}
                  </p>
                )}
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="gap-1.5"
                    data-ocid={`admin.item.edit_button.${index + 1}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(item)}
                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    data-ocid={`admin.item.delete_button.${index + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      <FurnitureFormDialog
        open={formOpen}
        onOpenChange={(val) => {
          setFormOpen(val);
          if (!val) setEditItem(null);
        }}
        editItem={editItem}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="admin.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete this item?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>{" "}
              from your collection. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="admin.delete.confirm_button"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
