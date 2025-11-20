import { useContext } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthUserDetails } from "@/models/Auth/authUserDetails";

export function useResources() {
  const authContext = useContext(useAuth());
  const userDetails = authContext?.userDetails as AuthUserDetails | undefined;

  const hasResource = (resource: string): boolean => {
    if (!userDetails) return false;
    
    // Super admin has access to everything
    if (userDetails.role === "super_admin") {
      return true;
    }

    // Check if user has the specific resource
    return userDetails.resources?.some(r => r.resource === resource) ?? false;
  };

  const hasAnyResource = (resources: string[]): boolean => {
    if (!userDetails) return false;
    
    // Super admin has access to everything
    if (userDetails.role === "super_admin") {
      return true;
    }

    // Check if user has any of the specified resources
    return resources.some(resource => hasResource(resource));
  };

  const hasAllResources = (resources: string[]): boolean => {
    if (!userDetails) return false;
    
    // Super admin has access to everything
    if (userDetails.role === "super_admin") {
      return true;
    }

    // Check if user has all of the specified resources
    return resources.every(resource => hasResource(resource));
  };

  return {
    hasResource,
    hasAnyResource,
    hasAllResources,
    userRole: userDetails?.role,
    isSuperAdmin: userDetails?.role === "super_admin",
  };
}

