import { apiGetAuthed, ApiError } from "@/lib/api";
import type {
  AdminListingDetail,
  AdminListingDto,
  AdminReportDto,
  AdminUserDto,
  PageResponse,
  VerificationDto,
} from "@/lib/api-types";
export { publicSummaryFrom, VERIFICATION_DIMENSIONS, VERIFICATION_STATES } from "@/lib/admin-contracts";

/**
 * Server-side reads for the admin surface. These run inside the RSC render with
 * the signed-in admin's access token; every write goes through a BFF route so
 * the origin and role checks live in one place.
 */

export type AdminListingQueueParams = {
  state?: string;
  staleDays?: number;
  page?: number;
  size?: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: string, label: string): void {
  if (!UUID.test(value)) throw new TypeError(`Invalid admin ${label}.`);
}

export async function getAdminListingQueue(
  params: AdminListingQueueParams = {}
): Promise<PageResponse<AdminListingDto>> {
  return apiGetAuthed<PageResponse<AdminListingDto>>("/admin/listings", {
    state: params.state,
    staleDays: params.staleDays,
    page: params.page ?? 1,
    size: params.size ?? 25,
  });
}

export async function getAdminListingDetail(id: string): Promise<AdminListingDetail | null> {
  assertUuid(id, "listing id");
  try {
    return await apiGetAuthed<AdminListingDetail>(`/admin/listings/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getAdminReports(status?: string, page = 1, size = 25): Promise<PageResponse<AdminReportDto>> {
  return apiGetAuthed<PageResponse<AdminReportDto>>("/admin/reports", { status, page, size });
}

export async function getAdminUsers(q?: string, status?: string, page = 1, size = 25): Promise<PageResponse<AdminUserDto>> {
  return apiGetAuthed<PageResponse<AdminUserDto>>("/admin/users", { q, status, page, size });
}

/** The nine dimensions, zero-filled by the API when no row exists yet. */
export async function getVerifications(
  subjectType: "LISTING" | "ADVERTISER",
  subjectId: string
): Promise<VerificationDto[]> {
  assertUuid(subjectId, "verification subject id");
  return apiGetAuthed<VerificationDto[]>("/admin/verifications", { subjectType, subjectId });
}
