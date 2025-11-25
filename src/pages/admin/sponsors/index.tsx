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
import { handleFetchSponsors, handleDeleteSponsor } from "@/services/sponsors/sponsorsRequest";
import { Sponsor } from "@/models/sponsors/sponsor";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationDialog } from "@/components/data/DeleteConfirmationDialog";

export default function SponsorsPage() {
  const router = useRouter();
  const authContext = useContext(useAuth());

  const isRouterReady = router.isReady;

  const pageNumber = isRouterReady && router.query.page ? parseInt(router.query.page as string, 10) : DEFAULT_PAGE_NUMBER;
  const pageSize = isRouterReady && router.query.pageSize ? parseInt(router.query.pageSize as string, 10) : 10;

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<string | null>(null);

  const fetchSponsors = useCallback(async () => {
    if (!authContext?.token) return;

    setIsLoading(true);
    try {
      const response = await handleFetchSponsors(
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
        setSponsors([]);
        setTotalAmount(0);
      } else {
        setSponsors(response.data ?? []);
        setTotalAmount(response.amount ?? 0);
      }
    } catch (error) {
      toast({
        title: "Error fetching sponsors",
        style: { background: "red", color: "white" },
        duration: 3500,
      });
      setSponsors([]);
      setTotalAmount(0);
    } finally {
      setIsLoading(false);
    }
  }, [authContext?.token, pageNumber, pageSize]);

  useEffect(() => {
    if (router.isReady && authContext?.token) {
      fetchSponsors();
    }
  }, [router.isReady, authContext?.token, pageNumber, pageSize, fetchSponsors]);

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
      cell: (sponsor: Sponsor) => (
        <div className="max-w-md">
          <p className="text-sm font-medium truncate">{sponsor.title}</p>
        </div>
      ),
    },
    {
      id: "website",
      header: "Website",
      cell: (sponsor: Sponsor) => (
        <div className="max-w-md">
          <a
            href={sponsor.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline truncate"
          >
            {sponsor.websiteUrl}
          </a>
        </div>
      ),
    },
    {
      id: "active",
      header: "Status",
      cell: (sponsor: Sponsor) => (
        <Badge variant={sponsor.active ? "default" : "outline"}>
          {sponsor.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "timePeriod",
      header: "Time Period",
      cell: (sponsor: Sponsor) => (
        <div className="text-sm text-muted-foreground">
          {sponsor.timePeriod ? (
            <>
              <div>Start: {formatDate(sponsor.timePeriod.start)}</div>
              <div>End: {formatDate(sponsor.timePeriod.end)}</div>
            </>
          ) : (
            "-"
          )}
        </div>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (sponsor: Sponsor) => (
        <div className="text-sm text-muted-foreground">
          {sponsor.createdAt ? formatDate(sponsor.createdAt) : "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (sponsor: Sponsor) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/sponsors/edit/${sponsor.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setSponsorToDelete(sponsor.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleCreateClick = useCallback(() => {
    router.push("/admin/sponsors/create");
  }, [router]);

  return (
    <AdminLayout>
      <DataManagementLayout
        title="Sponsors"
        description="Manage sponsors and partnerships"
        isLoading={isLoading}
        onRefresh={fetchSponsors}
        onAddNew={handleCreateClick}
        addNewLabel="Create Sponsor"
      >
        <div className="space-y-4">
          <DataTable
            data={sponsors}
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
                <p className="text-muted-foreground mb-4">No sponsors found</p>
              </div>
            }
          />
        </div>

        <DeleteConfirmationDialog
          open={sponsorToDelete !== null}
          onOpenChange={(open) => !open && setSponsorToDelete(null)}
          onConfirm={async () => {
            if (!sponsorToDelete || !authContext?.token) {
              setSponsorToDelete(null);
              return;
            }

            try {
              const result = await handleDeleteSponsor(authContext.token, sponsorToDelete);
              
              if (result.deleted) {
                toast({
                  title: "Sponsor deleted successfully",
                  style: { background: "green", color: "white" },
                  duration: 3500,
                });
                await fetchSponsors();
              } else {
                toast({
                  title: result.error || "Failed to delete sponsor",
                  style: { background: "red", color: "white" },
                  duration: 3500,
                });
              }
            } catch (error) {
              console.error("Error deleting sponsor:", error);
              toast({
                title: "Error deleting sponsor",
                style: { background: "red", color: "white" },
                duration: 3500,
              });
            } finally {
              setSponsorToDelete(null);
            }
          }}
          title="Delete Sponsor"
          description="Are you sure you want to delete this sponsor? This action cannot be undone."
        />
      </DataManagementLayout>
    </AdminLayout>
  );
}

