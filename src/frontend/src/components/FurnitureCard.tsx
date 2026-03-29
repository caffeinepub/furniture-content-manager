import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { FurnitureItem } from "../hooks/useQueries";

interface FurnitureCardProps {
  item: FurnitureItem;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FurnitureCard({
  item,
  index,
  onEdit,
  onDelete,
}: FurnitureCardProps) {
  const imgSrc = item.image.getDirectURL();
  const hasActions = onEdit || onDelete;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group bg-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300"
      data-ocid={`gallery.item.${index + 1}`}
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary relative">
        <img
          src={imgSrc}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {hasActions && (
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {onEdit && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full shadow-md bg-background/90 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                data-ocid={`gallery.item.edit_button.${index + 1}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-full shadow-md opacity-90 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                data-ocid={`gallery.item.delete_button.${index + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-base font-semibold text-card-foreground leading-snug">
            {item.name}
          </h3>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {item.category}
          </Badge>
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
    </motion.article>
  );
}
