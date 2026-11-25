"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Briefcase } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  getAdminTeacherApplicationSummary,
  getAdminTeacherApplications,
} from "@/services/teacherOnboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { APPLICATION_STATUS } from "@/constants/teacherOnboarding";
import Loader from "@/components/ui/Loader";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import TeacherOnboardingDetailModal from "@/components/features/admin/TeacherOnboardingDetailModal";
import PortalCard from "@/components/features/portal/shell/PortalCard";
import {
  PortalButton,
  PortalEmpty,
  PortalPageHead,
  PortalTabs,
  PortalToolbar,
  PortalToolbarCount,
} from "@/components/features/portal/shell/PortalUI";

const PAGE_SIZE = 10;

/**
 * The design's four tabs, and the statuses each one covers.
 *
 * Two of them span more than one status — an application waiting on an admin
 * is SUBMITTED or UNDER_REVIEW, and one waiting on the teacher is DRAFT or
 * CHANGES_REQUESTED — which is why the list endpoint takes a comma-separated
 * `status`. Doing it client-side would mean merging two paginated responses.
 *
 * `countKey` reads the summary endpoint, which returns a count per status
 * plus its own `AWAITING_REVIEW` total; the two-status tabs that it does not
 * pre-total are summed from the individual statuses here.
 */
const QUEUE_TABS = [
  {
    value: "awaiting",
    label: "Awaiting review",
    statuses: [APPLICATION_STATUS.SUBMITTED, APPLICATION_STATUS.UNDER_REVIEW],
    countKeys: ["AWAITING_REVIEW"],
  },
  {
    value: "approved",
    label: "Approved",
    statuses: [APPLICATION_STATUS.APPROVED],
    countKeys: [APPLICATION_STATUS.APPROVED],
  },
  {
    value: "drafting",
    label: "Still drafting",
    statuses: [APPLICATION_STATUS.DRAFT, APPLICATION_STATUS.CHANGES_REQUESTED],
    countKeys: [APPLICATION_STATUS.DRAFT, APPLICATION_STATUS.CHANGES_REQUESTED],
  },
  {
    value: "rejected",
    label: "Rejected",
    statuses: [APPLICATION_STATUS.REJECTED],
    countKeys: [APPLICATION_STATUS.REJECTED],
  },
];

function initialsOf(name) {
  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "?";
}

/**
 * The applicant's one-line summary, in the design's order: what they teach,
 * how long they have done it, and when they applied.
 *
 * Every part is omitted when the application does not carry it rather than
 * printed as a dash, because this line is prose — "Sports psychology · applied
 * Nov 10" reads correctly, "— · — · applied Nov 10" does not.
 */
function summaryLine(row) {
  const parts = [];
  if (row.headline) parts.push(row.headline);
  if (row.years_of_experience || row.years_of_experience === 0) {
    parts.push(
      `${row.years_of_experience} year${row.years_of_experience === 1 ? "" : "s"}`,
    );
  }
  const applied = row.submitted_at || row.created_at;
  if (applied) parts.push(`applied ${formatDate(applied)}`);
  return parts.join(" · ");
}

/**
 * Admin → Teacher applications: the review queue for teachers who signed
 * themselves up.
 *
 * The design makes this a list rather than a table — four tabs carrying their
 * own counts, then one row per applicant with a Review button. A table's
 * columns (headline, experience, evidence, status, submitted) were repeating
 * what the tab already said and what the row's own sentence says better.
 */
export default function TeacherOnboardingTab() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(QUEUE_TABS[0].value);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  // A notification about a submitted application deep-links straight to it.
  const requestedId = searchParams.get("application");
  useEffect(() => {
    if (requestedId) setSelectedId(Number(requestedId));
  }, [requestedId]);

  const tab = QUEUE_TABS.find((entry) => entry.value === activeTab) ?? QUEUE_TABS[0];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["teacher-onboarding", "admin", activeTab, page, debouncedSearch],
    queryFn: async () => {
      const response = await getAdminTeacherApplications({
        page,
        pageSize: PAGE_SIZE,
        status: tab.statuses.join(","),
        search: debouncedSearch || undefined,
      });
      return response?.data || { count: 0, results: [] };
    },
  });

  const summaryQuery = useQuery({
    queryKey: ["teacher-onboarding", "admin", "summary"],
    queryFn: async () => (await getAdminTeacherApplicationSummary())?.data || {},
  });

  const countFor = (entry) =>
    entry.countKeys.reduce(
      (total, key) => total + (summaryQuery.data?.[key] ?? 0),
      0,
    );

  const applications = data?.results || [];
  const total = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Teacher applications"
        subtitle="People who applied to teach on Cool Nerdz."
      />

      <PortalCard className="overflow-hidden">
        <div className="px-4">
          <PortalTabs
            ariaLabel="Application status"
            value={activeTab}
            onChange={(value) => {
              setActiveTab(value);
              setPage(1);
            }}
            options={QUEUE_TABS.map((entry) => ({
              value: entry.value,
              label: entry.label,
              // Only once the summary has landed, so a tab never reads "0"
              // while its own list is still loading.
              count: summaryQuery.data ? countFor(entry) : undefined,
            }))}
          />
        </div>

        <PortalToolbar>
          <SearchBar
            tone="cobalt"
            size="lg"
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              setPage(1);
            }}
            placeholder="Search by name or headline"
            className="w-full sm:w-[280px]"
          />
          <PortalToolbarCount>
            {total} application{total === 1 ? "" : "s"}
          </PortalToolbarCount>
        </PortalToolbar>

        {isLoading ? (
          <div className="p-10">
            <Loader tone="cobalt" fullScreen={false} label="Loading applications..." />
          </div>
        ) : isError ? (
          <PortalEmpty
            icon={Briefcase}
            title="We couldn't load the applications"
            text={getApiErrorMessage(error, "Unable to load teacher applications.")}
          >
            <PortalButton size="sm" onClick={() => refetch()} className="mt-2">
              Retry
            </PortalButton>
          </PortalEmpty>
        ) : applications.length === 0 ? (
          <PortalEmpty
            icon={Briefcase}
            title="No applications here"
            text={
              debouncedSearch
                ? "No application matches that search."
                : "Applications appear here as teachers submit them."
            }
          />
        ) : (
          <>
            <ul className="m-0 list-none px-5 py-0">
              {applications.map((row) => {
                const name = row.teacher_name || row.teacher_email || "Applicant";
                const summary = summaryLine(row);
                return (
                  <li
                    key={row.id}
                    className="flex items-center gap-4 border-t border-cn-p-line py-4 first:border-t-0"
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 flex-none place-items-center rounded-full bg-cn-p-soft text-[13px] font-bold text-cn-p-soft-ink"
                    >
                      {initialsOf(name)}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <b className="truncate font-semibold text-cn-p-ink">{name}</b>
                      {summary && (
                        <span className="truncate text-sm text-cn-p-muted">
                          {summary}
                        </span>
                      )}
                    </span>
                    <PortalButton
                      variant="sec"
                      size="sm"
                      onClick={() => setSelectedId(row.id)}
                      className="flex-none"
                      aria-label={`Review ${name}'s application`}
                    >
                      Review
                    </PortalButton>
                  </li>
                );
              })}
            </ul>

            <div className="px-4 pb-4">
              <Pagination
                tone="cobalt"
                size="lg"
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalLabel={`${total} application${total === 1 ? "" : "s"}`}
              />
            </div>
          </>
        )}
      </PortalCard>

      <TeacherOnboardingDetailModal
        isOpen={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        applicationId={selectedId}
      />
    </div>
  );
}
