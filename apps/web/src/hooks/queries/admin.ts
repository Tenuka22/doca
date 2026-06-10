import { useMutation, useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export function useAdminStats() {
  return useQuery(orpc.stats.queryOptions());
}

export function usePendingDoctors(input: { page: number; query: string }) {
  return useQuery(orpc.pendingDoctors.queryOptions({ input }));
}

export function useApproveDoctor() {
  return useMutation(orpc.approveDoctor.mutationOptions());
}

export function useApprovedDoctors(input: { page: number; query: string }) {
  return useQuery(orpc.approvedDoctors.queryOptions({ input }));
}

export function useGetDoctor(input: { doctorId: string }) {
  return useQuery(orpc.getDoctor.queryOptions({ input }));
}

export function useGuardians(input: { page: number }) {
  return useQuery(orpc.guardians.queryOptions({ input }));
}

export function usePatients(input: { page: number }) {
  return useQuery(orpc.patients.queryOptions({ input }));
}

export function usePlans(input: { page: number }) {
  return useQuery(orpc.plans.queryOptions({ input }));
}

export function useSessions(input: { page: number }) {
  return useQuery(orpc.sessions.queryOptions({ input }));
}

export function useCreditTransactions(input: { page: number }) {
  return useQuery(orpc.creditTransactions.queryOptions({ input }));
}
