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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, Plus, Sofa } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { FurnitureCard } from "../components/FurnitureCard";
import { FurnitureFormDialog } from "../components/FurnitureFormDialog";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type FurnitureItem,
  useDeleteFurnitureItem,
  useGetAllFurnitureItems,
  useGetUniqueCategories,
  useIsCallerAdmin,
} from "../hooks/useQueries";

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"];

const SAMPLE_ITEMS = [
  {
    id: "sample-1",
    name: "Oslo Armchair",
    category: "Chairs",
    description:
      "A refined Scandinavian armchair in warm cream bouclé fabric with solid oak legs.",
    image: {
      getDirectURL: () => "/assets/generated/sample-chair.dim_600x500.jpg",
    },
  },
  {
    id: "sample-2",
    name: "Walnut Dining Table",
    category: "Tables",
    description:
      "Hand-crafted from solid American walnut with slim matte-black metal legs.",
    image: {
      getDirectURL: () => "/assets/generated/sample-table.dim_600x500.jpg",
    },
  },
  {
    id: "sample-3",
    name: "Côte Sofa",
    category: "Sofas",
    description:
      "Three-seater sofa upholstered in premium stone-grey linen, removable cushion covers.",
    image: {
      getDirectURL: () => "/assets/generated/sample-sofa.dim_600x500.jpg",
    },
  },
  {
    id: "sample-4",
    name: "Arc Bookshelf",
    category: "Storage",
    description:
      "Open modular bookshelf in oiled oak, five shelves, wall-anchor included.",
    image: {
      getDirectURL: () => "/assets/generated/sample-shelf.dim_600x500.jpg",
    },
  },
  {
    id: "sample-5",
    name: "Marble Bedside Table",
    category: "Bedroom",
    description:
      "Brushed brass frame with a genuine Calacatta marble top, single drawer.",
    image: {
      getDirectURL: () => "/assets/generated/sample-bedside.dim_600x500.jpg",
    },
  },
  {
    id: "sample-6",
    name: "Luxury King Bed",
    category: "Bedroom",
    description:
      "Luxurious king-size bed with an upholstered beige fabric headboard, solid wood frame, and crisp white bedding.",
    image: {
      getDirectURL: () => "/assets/generated/bed-furniture.dim_800x600.jpg",
    },
  },
];

export function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<FurnitureItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FurnitureItem | null>(null);

  const { data: items, isLoading: itemsLoading } = useGetAllFurnitureItems();
  const { data: categories } = useGetUniqueCategories();
  const { data: isAdmin } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const deleteMutation = useDeleteFurnitureItem();
  const isAuthenticated = !!identity;

  const displayItems = items && items.length > 0 ? items : SAMPLE_ITEMS;
  const displayCategories =
    categories && categories.length > 0
      ? categories
      : ["Chairs", "Tables", "Sofas", "Storage", "Bedroom"];
  const usingSample = !items || items.length === 0;

  const filtered =
    activeCategory === "All"
      ? displayItems
      : displayItems.filter((i) => i.category === activeCategory);

  const canManage = isAuthenticated && isAdmin === true && !usingSample;

  const handleEdit = (item: FurnitureItem) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section
        className="relative overflow-hidden grain-overlay"
        style={{
          backgroundImage: `url('/assets/generated/hero-texture.dim_1600x600.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative container max-w-7xl mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-medium tracking-widest uppercase text-primary mb-3">
              Thoughtful living
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-semibold text-foreground leading-none mb-4">
              Crafted for <br />
              <em className="not-italic text-primary">every space.</em>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Explore our curated collection of furniture — where form meets
              function in every piece.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Attendance Quick Access */}
      <section className="container max-w-7xl mx-auto px-4 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-xl border border-border bg-card px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                Employee Attendance
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track employee check-ins and daily attendance
              </p>
            </div>
          </div>
          <Link to="/attendance" data-ocid="gallery.attendance.link">
            <Button variant="outline" size="sm" className="shrink-0">
              Mark Attendance
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Collection */}
      <section className="container max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Our Collection
            </h2>
            {usingSample && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing sample pieces — add your own in the Admin panel
              </p>
            )}
          </div>
          {isAuthenticated && isAdmin === true && (
            <Button
              size="sm"
              onClick={() => {
                setEditItem(null);
                setFormOpen(true);
              }}
              data-ocid="gallery.add_item.button"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          )}
        </div>

        {/* Category tabs */}
        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="mb-8"
          data-ocid="gallery.filter.tab"
        >
          <TabsList className="h-auto flex flex-wrap gap-1 bg-secondary/60 p-1">
            <TabsTrigger value="All" data-ocid="gallery.all.tab">
              All
            </TabsTrigger>
            {displayCategories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                data-ocid="gallery.category.tab"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Loading state */}
        {itemsLoading && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            data-ocid="gallery.loading_state"
          >
            {SKELETON_KEYS.map((k) => (
              <div key={k} className="rounded-lg overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!itemsLoading && filtered.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-24 text-center"
            data-ocid="gallery.empty_state"
          >
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Sofa className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              No pieces found
            </h3>
            <p className="text-muted-foreground text-sm">
              {activeCategory !== "All"
                ? `No items in the "${activeCategory}" category yet.`
                : "No furniture items have been added yet."}
            </p>
          </div>
        )}

        {/* Grid */}
        {!itemsLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((item, index) => (
              <FurnitureCard
                key={item.id}
                item={item as any}
                index={index}
                onEdit={
                  canManage && !item.id.startsWith("sample-")
                    ? () => handleEdit(item as FurnitureItem)
                    : undefined
                }
                onDelete={
                  canManage && !item.id.startsWith("sample-")
                    ? () => setDeleteTarget(item as FurnitureItem)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit Item Dialog (admin only) */}
      {isAuthenticated && isAdmin === true && (
        <FurnitureFormDialog
          open={formOpen}
          onOpenChange={(v) => {
            setFormOpen(v);
            if (!v) setEditItem(null);
          }}
          editItem={editItem}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent data-ocid="gallery.item.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}
              &rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="gallery.item.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="gallery.item.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
