import { useEffect, useState, useCallback, useContext } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataManagementLayout } from "@/components/layout/DataManagementLayout";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_PAGE_NUMBER } from "@/constants/tablePageSizes";
import { toast } from "@/hooks/use-toast";
import { handleFetchFeatureFlags, handleDeleteFeatureFlag } from "@/services/featureFlags/featureFlagsRequest";
import { FeatureFlag } from "@/models/featureFlags/featureFlag";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationDialog } from "@/components/data/DeleteConfirmationDialog";

export default function FeatureFlagsPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());

  const isRouterReady = router.isReady;

  const pageNumber = isRouterReady && router.query.page ? parseInt(router.query.page as string, 10) : DEFAULT_PAGE_NUMBER;
  const pageSize = isRouterReady && router.query.pageSize ? parseInt(router.query.pageSize as string, 10) : 10;

  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [flagToDelete, setFlagToDelete] = useState<string | null>(null);

  const fetchFeatureFlags = useCallback(async () => {
    if (!authContext?.token) return;

    setIsLoading(true);
    try {
      const response = await handleFetchFeatureFlags(
        authContext.token,
        pageNumber,
        pageSize
      );

      if (response.error) {
        toast({
          title: response.error,
          style: { background: "red", color: "white" },
          duration: 3500,
        });
        setFeatureFlags([]);
        setTotalAmount(0);
      } else {
        setFeatureFlags(response.data ?? []);
        setTotalAmount(response.amount ?? 0);
      }
    } catch (error) {
      toast({
        title: "Error fetching feature flags",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setFeatureFlags([]);
      setTotalAmount(0);
    } finally {
      setIsLoading(false);
    }
  }, [authContext?.token, pageNumber, pageSize]);

  useEffect(() => {
    if (router.isReady && authContext?.token) {
      fetchFeatureFlags();
    }
  }, [router.isReady, authContext?.token, pageNumber, pageSize, fetchFeatureFlags]);

  const handlePageChange = useCallback((page: number) => {
    const query = { ...router.query, page: page.toString() };
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  }, [router]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    const query = { ...router.query, pageSize: newPageSize.toString(), page: "1" };
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = useCallback(async () => {
    if (!flagToDelete || !authContext?.token) return;

    const response = await handleDeleteFeatureFlag(authContext.token, flagToDelete);
    
    if (response.error) {
      toast({
        title: response.error,
        style: { background: "red", color: "white" },
        duration: 3500,
      });
    } else {
      toast({
        title: "Feature flag deleted successfully",
        style: { background: "green", color: "white" },
        duration: 3500,
      });
      fetchFeatureFlags();
    }
    setFlagToDelete(null);
  }, [flagToDelete, authContext?.token, fetchFeatureFlags]);

  const handleCreateClick = useCallback(() => {
    router.push("/admin/feature-flags/create");
  }, [router]);

  const columns = [
    {
      id: "key",
      header: "Key",
      cell: (flag: FeatureFlag) => (
        <div className="max-w-md">
          <p className="text-sm font-medium">{flag.key}</p>
        </div>
      ),
    },
    {
      id: "enabled",
      header: "Status",
      cell: (flag: FeatureFlag) => (
        <Badge variant={flag.enabled ? "default" : "outline"}>
          {flag.enabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: (flag: FeatureFlag) => (
        <div className="max-w-md">
          <p className="text-sm text-muted-foreground truncate">
            {flag.description || "-"}
          </p>
        </div>
      ),
    },
    {
      id: "rules",
      header: "Rules",
      cell: (flag: FeatureFlag) => (
        <div className="flex flex-wrap gap-1">
          {flag.rules && flag.rules.length > 0 ? (
            <>
              {flag.rules.slice(0, 2).map((rule, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {rule.type}
                </Badge>
              ))}
              {flag.rules.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{flag.rules.length - 2}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No rules</span>
          )}
        </div>
      ),
    },
    {
      id: "updatedAt",
      header: "Updated",
      cell: (flag: FeatureFlag) => (
        <div className="text-sm text-muted-foreground">
          {flag.updatedAt ? formatDate(flag.updatedAt) : "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (flag: FeatureFlag) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/feature-flags/edit/${flag.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setFlagToDelete(flag.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <DataManagementLayout
        title="Feature Flags"
        description="Manage feature flags and their targeting rules"
        isLoading={isLoading}
        onRefresh={fetchFeatureFlags}
        onAddNew={handleCreateClick}
        addNewLabel="Create Feature Flag"
      >
        <div className="space-y-4">
          <DataTable
            data={featureFlags}
            columns={columns}
            keyExtractor={(item) => item.id}
            pagination={{
              currentPage: pageNumber,
              totalPages: Math.max(1, Math.ceil(totalAmount / pageSize)),
              totalItems: totalAmount,
              itemsPerPage: pageSize,
              onPageChange: handlePageChange,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [5, 10, 20, 50, 100],
              showPageSizeSelector: true,
              showPageInput: true,
              showFirstLastButtons: true,
            }}
            emptyState={
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No feature flags found</p>
              </div>
            }
          />
        </div>

        <DeleteConfirmationDialog
          open={flagToDelete !== null}
          onOpenChange={(open) => !open && setFlagToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Feature Flag"
          description="Are you sure you want to delete this feature flag? This action cannot be undone."
        />
      </DataManagementLayout>
    </AdminLayout>
  );
}

