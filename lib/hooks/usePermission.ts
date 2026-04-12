import { useCurrentUser } from "./useCurrentUser";
import { hasPermission, EntityType, ActionType } from "@/lib/services/permission-service";

export function usePermission() {
  const { user } = useCurrentUser();

  const can = (entity: EntityType, action: ActionType): boolean => {
    if (!user) return false; // Default to deny if user not loaded
    return hasPermission(user.role, entity, action);
  };

  return { can, user };
}
