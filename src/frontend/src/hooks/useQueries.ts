import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type { FurnitureItem } from "../backend";
import { useActor } from "./useActor";

export type { FurnitureItem };

export function useGetAllFurnitureItems() {
  const { actor, isFetching } = useActor();
  return useQuery<FurnitureItem[]>({
    queryKey: ["furnitureItems"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFurnitureItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUniqueCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUniqueCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateFurnitureItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      category: string;
      description: string;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.createFurnitureItem(
        data.id,
        data.name,
        data.category,
        data.description,
        data.image,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["furnitureItems"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateFurnitureItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      category: string;
      description: string;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.updateFurnitureItem(
        data.id,
        data.name,
        data.category,
        data.description,
        data.image,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["furnitureItems"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteFurnitureItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      await actor.deleteFurnitureItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["furnitureItems"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
