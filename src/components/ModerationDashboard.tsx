import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Image,
  Spinner,
} from "@heroui/react";
import { ShieldOff, Eye } from "lucide-react";

export function ModerationDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "reviewed" | "resolved" | "dismissed" | undefined>("pending");
  const [selectedReport, setSelectedReport] = useState<{
    _id: Id<"reports">;
    _creationTime: number;
    status: string;
    reason: string;
    description?: string;
    meme?: { _id: Id<"memes">; title: string; imageUrl: string; likes: number; shares: number };
    reporter?: { email?: string };
    moderator?: { email?: string };
    moderatorNotes?: string;
  } | null>(null);

  const isModerator = useQuery(api.roles.checkIsModerator);
  const reports = useQuery(api.reports.getReports, { 
    status: selectedStatus,
    limit: 100 
  });
  const updateReportStatus = useMutation(api.reports.updateReportStatus);

  if (isModerator === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" color="secondary" />
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 animate-fade-in">
        <div className="text-center py-16 backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-3xl border border-white/20 shadow-xl">
          <ShieldOff className="w-20 h-20 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 px-6">
            You don't have permission to access the moderation dashboard.
          </p>
          <p className="text-sm text-gray-500 px-6">
            Only moderators and administrators can view this section.
          </p>
        </div>
      </div>
    );
  }

  const handleUpdateReport = async (
    reportId: Id<"reports">, 
    status: "pending" | "reviewed" | "resolved" | "dismissed",
    actionTaken?: "none" | "warning" | "content_removed" | "user_suspended",
    moderatorNotes?: string
  ) => {
    try {
      await updateReportStatus({
        reportId,
        status,
        actionTaken,
        moderatorNotes,
      });
      toast.success("Report updated successfully");
      setSelectedReport(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update report";
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "warning";
      case "reviewed": return "primary";
      case "resolved": return "success";
      case "dismissed": return "default";
      default: return "default";
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "spam": return "warning";
      case "inappropriate": return "danger";
      case "harassment": return "secondary";
      case "copyright": return "primary";
      case "misinformation": return "warning";
      default: return "default";
    }
  };

  if (!reports) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" color="secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6 animate-fade-in">
      <h2 className="text-3xl font-black mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
        Moderation
      </h2>

      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { value: undefined, label: "All" },
            { value: "pending", label: "Pending" },
            { value: "reviewed", label: "Reviewed" },
            { value: "resolved", label: "Resolved" },
            { value: "dismissed", label: "Dismissed" },
          ].map((status) => (
            <Chip
              key={status.label}
              onClick={() => setSelectedStatus(status.value as typeof selectedStatus)}
              className={`cursor-pointer transition-all ${
                selectedStatus === status.value
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                  : "backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border border-white/20"
              }`}
              radius="full"
            >
              {status.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map((report, index) => (
            <Card 
              key={report._id}
              className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border border-white/20 shadow-lg animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="flex-col items-start gap-2">
                <div className="flex items-center gap-2 w-full">
                  <Chip size="sm" color={getStatusColor(report.status)} variant="flat">
                    {report.status}
                  </Chip>
                  <Chip size="sm" color={getReasonColor(report.reason)} variant="flat">
                    {report.reason}
                  </Chip>
                  <span className="text-xs text-default-500 ml-auto">
                    {new Date(report._creationTime).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="font-medium">
                  Reported Meme: "{report.meme?.title || 'Deleted'}"
                </h3>
                
                <p className="text-sm text-default-600">
                  Reporter: {report.reporter?.email || 'Unknown'}
                </p>
                
                {report.description && (
                  <p className="text-sm bg-default-100 p-2 rounded w-full">
                    "{report.description}"
                  </p>
                )}
              </CardHeader>
              <CardBody>
                <div className="flex justify-between items-center">
                  {report.moderatorNotes && (
                    <div className="flex-1 p-2 bg-primary-50 rounded">
                      <p className="text-xs font-medium text-primary-900">Moderator Notes:</p>
                      <p className="text-sm text-primary-800">{report.moderatorNotes}</p>
                      {report.moderator && (
                        <p className="text-xs text-primary-600 mt-1">
                          By: {report.moderator.email}
                        </p>
                      )}
                    </div>
                  )}
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => setSelectedReport(report)}
                    startContent={<Eye className="w-4 h-4" />}
                    className="ml-auto"
                  >
                    Review
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-default-500 mb-2">No reports found</p>
            <p className="text-sm text-default-400">
              {selectedStatus ? `No ${selectedStatus} reports` : "No reports to review"}
            </p>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Review Report</ModalHeader>
          <ModalBody className="gap-4">
            {selectedReport && (
              <>
                <Card>
                  <CardBody className="gap-2">
                    <h4 className="font-medium">Report Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Reason:</span> {selectedReport.reason}</p>
                      <p><span className="font-medium">Reporter:</span> {selectedReport.reporter?.email}</p>
                      <p><span className="font-medium">Date:</span> {new Date(selectedReport._creationTime).toLocaleString()}</p>
                      {selectedReport.description && (
                        <p><span className="font-medium">Description:</span> {selectedReport.description}</p>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {selectedReport.meme && (
                  <Card>
                    <CardBody className="gap-2">
                      <h4 className="font-medium">Reported Content</h4>
                      <div className="flex gap-4">
                        <Image
                          src={selectedReport.meme.imageUrl}
                          alt={selectedReport.meme.title}
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{selectedReport.meme.title}</p>
                          <p className="text-sm text-default-600">
                            {selectedReport.meme.likes} likes • {selectedReport.meme.shares} shares
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}

                <div className="space-y-3">
                  <h4 className="font-medium">Take Action</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="flat"
                      onPress={() => handleUpdateReport(selectedReport._id, "dismissed", "none", "No violation found")}
                    >
                      Dismiss Report
                    </Button>
                    
                    <Button
                      color="warning"
                      variant="flat"
                      onPress={() => handleUpdateReport(selectedReport._id, "resolved", "warning", "Warning issued to user")}
                    >
                      Issue Warning
                    </Button>
                    
                    <Button
                      color="danger"
                      variant="flat"
                      onPress={() => handleUpdateReport(selectedReport._id, "resolved", "content_removed", "Content removed for policy violation")}
                    >
                      Remove Content
                    </Button>
                    
                    <Button
                      color="danger"
                      onPress={() => handleUpdateReport(selectedReport._id, "resolved", "user_suspended", "User suspended for repeated violations")}
                    >
                      Suspend User
                    </Button>
                  </div>
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setSelectedReport(null)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
