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
import { handleFetchAdvertisements, Advertisement } from "@/services/advertisements/advertisementsRequest";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationDialog } from "@/components/data/DeleteConfirmationDialog";

export default function AdvertisementsPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());

  const isRouterReady = router.isReady;

  const pageNumber = isRouterReady && router.query.page ? parseInt(router.query.page as string, 10) : DEFAULT_PAGE_NUMBER;
  const pageSize = isRouterReady && router.query.pageSize ? parseInt(router.query.pageSize as string, 10) : 10;

  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);

  const fetchAdvertisements = useCallback(async () => {
    if (!authContext?.token) return;

    setIsLoading(true);
    try {
      const response = await handleFetchAdvertisements(
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
        setAdvertisements([]);
        setTotalAmount(0);
      } else {
        setAdvertisements(response.data ?? []);
        setTotalAmount(response.amount ?? 0);
      }
    } catch (error) {
      toast({
        title: "Error fetching advertisements",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setAdvertisements([]);
      setTotalAmount(0);
    } finally {
      setIsLoading(false);
    }
  }, [authContext?.token, pageNumber, pageSize]);

  useEffect(() => {
    if (router.isReady && authContext?.token) {
      fetchAdvertisements();
    }
  }, [router.isReady, authContext?.token, pageNumber, pageSize, fetchAdvertisements]);

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

  const columns = [
    {
      id: "title",
      header: "Title",
      cell: (ad: Advertisement) => (
        <div className="max-w-md">
          <p className="text-sm font-medium truncate">{ad.title}</p>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (ad: Advertisement) => (
        <Badge variant="outline">{ad.type}</Badge>
      ),
    },
    {
      id: "placements",
      header: "Placements",
      cell: (ad: Advertisement) => (
        <div className="flex flex-wrap gap-1">
          {ad.placements.slice(0, 2).map((placement, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {placement.replace("_", " ")}
            </Badge>
          ))}
          {ad.placements.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{ad.placements.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "active",
      header: "Status",
      cell: (ad: Advertisement) => (
        <Badge variant={ad.active ? "default" : "outline"}>
          {ad.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "stats",
      header: "Stats",
      cell: (ad: Advertisement) => (
        <div className="text-sm text-muted-foreground">
          <div>Clicks: {ad.clickCount}</div>
          <div>Impressions: {ad.impressionCount}</div>
        </div>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (ad: Advertisement) => (
        <div className="text-sm text-muted-foreground">
          {ad.createdAt ? formatDate(ad.createdAt) : "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (ad: Advertisement) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/advertisements/edit/${ad.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setAdToDelete(ad.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleCreateClick = useCallback(() => {
    router.push("/admin/advertisements/create");
  }, [router]);

  return (
    <AdminLayout>
      <DataManagementLayout
        title="Advertisements"
        description="Manage advertisements and campaigns"
        isLoading={isLoading}
        onRefresh={fetchAdvertisements}
        onAddNew={handleCreateClick}
        addNewLabel="Create Advertisement"
      >
        <div className="space-y-4">
          <DataTable
            data={advertisements}
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
                <p className="text-muted-foreground mb-4">No advertisements found</p>
              </div>
            }
          />
        </div>

        <DeleteConfirmationDialog
          open={adToDelete !== null}
          onOpenChange={(open) => !open && setAdToDelete(null)}
          onConfirm={async () => {
            // TODO: Implement delete functionality
            toast({
              title: "Delete functionality not yet implemented",
              style: { background: "orange", color: "white" },
              duration: 3500,
            });
            setAdToDelete(null);
          }}
          title="Delete Advertisement"
          description="Are you sure you want to delete this advertisement? This action cannot be undone."
        />
      </DataManagementLayout>
    </AdminLayout>
  );
}

