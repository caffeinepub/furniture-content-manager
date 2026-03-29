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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CheckCircle2, ImageIcon, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  type FurnitureItem,
  useCreateFurnitureItem,
  useGetAllFurnitureItems,
  useUpdateFurnitureItem,
} from "../hooks/useQueries";

interface FurnitureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: FurnitureItem | null;
}

export function FurnitureFormDialog({
  open,
  onOpenChange,
  editItem,
}: FurnitureFormDialogProps) {
  const isEdit = !!editItem;
  const [name, setName] = useState(editItem?.name ?? "");
  const [category, setCategory] = useState(editItem?.category ?? "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    editItem ? editItem.image.getDirectURL() : null,
  );
  const [selectedGalleryUrl, setSelectedGalleryUrl] = useState<string | null>(
    isEdit ? (editItem?.image.getDirectURL() ?? null) : null,
  );
  const [imageTab, setImageTab] = useState<"upload" | "gallery">("upload");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateFurnitureItem();
  const updateMutation = useUpdateFurnitureItem();
  const { data: galleryItems } = useGetAllFurnitureItems();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setName("");
    setCategory("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setSelectedGalleryUrl(null);
    setImageTab("upload");
    setUploadProgress(0);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleGallerySelect = (item: FurnitureItem) => {
    const url = item.image.getDirectURL();
    setSelectedGalleryUrl(url);
    setImagePreview(url);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) {
      toast.error("Name and category are required");
      return;
    }

    let blob: ExternalBlob;

    if (imageTab === "gallery" && selectedGalleryUrl) {
      blob = ExternalBlob.fromURL(selectedGalleryUrl);
    } else if (imageFile) {
      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct),
      );
    } else if (isEdit && editItem) {
      blob = editItem.image;
    } else {
      toast.error("Please select an image");
      return;
    }

    try {
      if (isEdit && editItem) {
        await updateMutation.mutateAsync({
          id: editItem.id,
          name: name.trim(),
          category: category.trim(),
          description: description.trim(),
          image: blob,
        });
        toast.success("Item updated successfully");
      } else {
        await createMutation.mutateAsync({
          id: crypto.randomUUID(),
          name: name.trim(),
          category: category.trim(),
          description: description.trim(),
          image: blob,
        });
        toast.success("Item added successfully");
      }
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  // Combined preview: upload tab uses imagePreview from file, gallery tab uses selectedGalleryUrl
  const activePreview =
    imageTab === "gallery" ? selectedGalleryUrl : imagePreview;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" data-ocid="furniture.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? "Edit Item" : "Add New Item"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Oslo Armchair"
              required
              data-ocid="furniture.name.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Chairs, Tables, Sofas"
              required
              data-ocid="furniture.category.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this piece..."
              rows={3}
              data-ocid="furniture.description.textarea"
            />
          </div>

          {/* Image selection */}
          <div className="space-y-2">
            <Label>Image</Label>
            <Tabs
              value={imageTab}
              onValueChange={(v) => setImageTab(v as "upload" | "gallery")}
              data-ocid="furniture.image.tab"
            >
              <TabsList className="h-8 text-xs">
                <TabsTrigger
                  value="upload"
                  className="text-xs px-3"
                  data-ocid="furniture.upload.tab"
                >
                  Upload New
                </TabsTrigger>
                <TabsTrigger
                  value="gallery"
                  className="text-xs px-3"
                  data-ocid="furniture.gallery.tab"
                >
                  From Gallery
                </TabsTrigger>
              </TabsList>

              {/* Upload tab */}
              <TabsContent value="upload" className="mt-2">
                <button
                  type="button"
                  className="w-full relative border-2 border-dashed border-border rounded-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={triggerFileInput}
                  data-ocid="furniture.dropzone"
                >
                  {imagePreview && imageTab === "upload" ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-36 object-cover"
                      />
                      <div className="absolute inset-0 bg-foreground/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-sm text-white font-medium">
                          Change image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-sm">Click to upload image</span>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  data-ocid="furniture.upload_button"
                />
                {isPending && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-1 mt-2">
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
              </TabsContent>

              {/* Gallery tab */}
              <TabsContent value="gallery" className="mt-2">
                {galleryItems && galleryItems.length > 0 ? (
                  <ScrollArea className="h-52 rounded-lg border border-border bg-secondary/20 p-2">
                    <div className="grid grid-cols-4 gap-2">
                      {galleryItems.map((gItem) => {
                        const url = gItem.image.getDirectURL();
                        const isSelected = selectedGalleryUrl === url;
                        return (
                          <button
                            key={gItem.id}
                            type="button"
                            onClick={() => handleGallerySelect(gItem)}
                            className={cn(
                              "relative rounded-md overflow-hidden border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              isSelected
                                ? "border-primary ring-1 ring-primary"
                                : "border-transparent hover:border-primary/40",
                            )}
                            title={gItem.name}
                            data-ocid={"furniture.gallery.item"}
                          >
                            <img
                              src={url}
                              alt={gItem.name}
                              className="w-full h-16 object-cover"
                              loading="lazy"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-primary drop-shadow" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-52 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground">
                    <ImageIcon className="w-7 h-7" />
                    <span className="text-sm">No gallery images yet</span>
                    <span className="text-xs">
                      Upload items first to use them here
                    </span>
                  </div>
                )}
                {selectedGalleryUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <img
                      src={selectedGalleryUrl}
                      alt="Selected"
                      className="h-8 w-12 object-cover rounded"
                    />
                    <span className="text-foreground font-medium">
                      Selected from gallery
                    </span>
                    <button
                      type="button"
                      className="ml-auto text-destructive hover:underline"
                      onClick={() => {
                        setSelectedGalleryUrl(null);
                        setImagePreview(null);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview when gallery mode has selection */}
          {imageTab === "gallery" && activePreview && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={activePreview}
                alt="Preview"
                className="w-full h-36 object-cover"
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              data-ocid="furniture.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="furniture.save_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {isEdit ? "Save Changes" : "Add Item"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
