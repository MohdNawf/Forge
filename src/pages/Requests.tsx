import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";

type RequestStatus = "pending" | "accepted" | "declined";
type RequestType = "received" | "sent";

type CollaborationRequest = {
  id: Id<"collabRequests">;
  type: RequestType;
  status: RequestStatus;
  project: string;
  message: string;
  from: string;
  to: string;
  timeAgo: string;
};

const statusOptions: Array<{ key: "all" | RequestStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
];

const statusClassName: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  accepted: "bg-lime-100 text-lime-900 border-lime-200",
  declined: "bg-rose-100 text-rose-900 border-rose-200",
};

export default function Requests() {
  const [activeTab, setActiveTab] = useState<RequestType>("received");
  const [activeStatus, setActiveStatus] = useState<"all" | RequestStatus>("all");
  const requestData = useQuery(api.collabRequests.listMyRequests);
  const updateRequestStatus = useMutation(api.collabRequests.updateRequestStatus);

  const requests = useMemo<CollaborationRequest[]>(() => {
    if (!requestData) return [];

    const normalizeStatus = (status: "pending" | "accepted" | "rejected"): RequestStatus => {
      if (status === "rejected") return "declined";
      return status;
    };

    const toTimeAgo = (timestamp: number) => {
      const diffMs = Date.now() - timestamp;
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    };

    const prettyUser = (name: string | null, id: string) => {
      if (name && name.trim().length > 0) return name;
      return `User ${id.slice(-6)}`;
    };

    const received = requestData.received.map((request) => ({
      id: request._id,
      type: "received" as const,
      status: normalizeStatus(request.status),
      project: request.projectTitle,
      message: "This collaborator requested to join your project.",
      from: prettyUser(request.requesterName, request.requesterId),
      to: "You",
      timeAgo: toTimeAgo(request._creationTime),
    }));

    const sent = requestData.sent.map((request) => ({
      id: request._id,
      type: "sent" as const,
      status: normalizeStatus(request.status),
      project: request.projectTitle,
      message: "You requested to collaborate on this project.",
      from: "You",
      to: request.ownerId ? `Owner ${request.ownerId.slice(-6)}` : "Project owner",
      timeAgo: toTimeAgo(request._creationTime),
    }));

    return [...received, ...sent];
  }, [requestData]);

  const receivedCount = useMemo(
    () => requests.filter((request) => request.type === "received").length,
    []
  );
  const sentCount = useMemo(
    () => requests.filter((request) => request.type === "sent").length,
    []
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        if (request.type !== activeTab) return false;
        if (activeStatus === "all") return true;
        return request.status === activeStatus;
      }),
    [activeTab, activeStatus]
  );

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pb-20 pt-10 md:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/70">§ Requests</p>
      <h1 className="mt-4 text-6xl leading-none md:text-8xl">
        Who wants in<span className="text-acid">.</span>
      </h1>

      <div className="mt-12 flex gap-8 border-b border-rule text-sm">
        <button
          onClick={() => setActiveTab("received")}
          className={`pb-3 ${
            activeTab === "received" ? "border-b-2 border-ink font-semibold" : "text-ink/70"
          }`}
        >
          Received <span className="ml-1 text-ink/60">{receivedCount}</span>
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`pb-3 ${
            activeTab === "sent" ? "border-b-2 border-ink font-semibold" : "text-ink/70"
          }`}
        >
          Sent <span className="ml-1 text-ink/60">{sentCount}</span>
        </button>
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button
            key={status.key}
            onClick={() => setActiveStatus(status.key)}
            className={`border px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition ${
              activeStatus === status.key
                ? "border-ink bg-ink text-paper"
                : "border-rule bg-paper text-ink/70 hover:text-ink"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      <section className="mt-8 border border-rule bg-paper">
        {!requestData ? (
          <div className="py-20 text-center">
            <h2 className="text-4xl">Loading requests...</h2>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 text-center">
            <h2 className="text-4xl">Nothing here yet.</h2>
            <p className="mt-2 text-ink/60">
              No {activeStatus === "all" ? "" : `${activeStatus} `}requests in this view.
            </p>
            <a href="/discover" className="mt-1 inline-block underline text-ink/80 hover:text-ink">
              Browse projects.
            </a>
          </div>
        ) : (
          <ul>
            {filteredRequests.map((request) => (
              <li key={request.id} className="border-b border-rule p-6 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/65">
                      {request.timeAgo}
                    </p>
                    <h3 className="mt-2 text-3xl">{request.project}</h3>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusClassName[request.status]}`}
                  >
                    {request.status}
                  </span>
                </div>

                <p className="mt-4 max-w-[800px] text-lg text-ink/85">{request.message}</p>

                <p className="mt-4 text-sm text-ink/70">
                  {request.type === "received" ? (
                    <>
                      <span className="font-medium text-ink">{request.from}</span> sent you this
                      request.
                    </>
                  ) : (
                    <>
                      You sent this request to{" "}
                      <span className="font-medium text-ink">{request.to}</span>.
                    </>
                  )}
                </p>
                {request.type === "received" && request.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() =>
                        void updateRequestStatus({ requestId: request.id, status: "accepted" })
                      }
                      className="border border-ink bg-ink px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-paper hover:bg-acid hover:text-ink"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        void updateRequestStatus({ requestId: request.id, status: "rejected" })
                      }
                      className="border border-ink px-3 py-1.5 text-xs uppercase tracking-[0.16em] hover:bg-ink hover:text-paper"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
