import { QueryClient } from '@tanstack/react-query';

/**
 * Default stale time for queries (5 minutes)
 * This determines how long data remains "fresh" before it's considered stale
 * and needs to be refetched in the background
 */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Default cache time for queries (30 minutes)
 * This determines how long inactive data remains in the cache before being garbage collected
 */
export const DEFAULT_CACHE_TIME = 30 * 60 * 1000;

/**
 * Creates a configured QueryClient instance with optimal settings
 * @returns A configured QueryClient instance
 */
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Global defaults for all queries
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_CACHE_TIME,
        refetchOnWindowFocus: true, // Refetch when the window regains focus
        refetchOnMount: true, // Refetch when a component mounts
        refetchOnReconnect: true, // Refetch when the network reconnects
        retry: 3, // Retry failed queries 3 times
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      },
      mutations: {
        // Global defaults for all mutations
        retry: 2, // Retry failed mutations 2 times
        retryDelay: 1000, // 1 second delay between retries
      },
    },
  });
};

/**
 * Query key factory to ensure consistent query keys across the application
 */
export const queryKeys = {
  // User related queries
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    roles: (id: string) => [...queryKeys.users.all, 'roles', id] as const,
  },
  
  // Member related queries
  members: {
    all: ['members'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.members.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.members.all, 'detail', id] as const,
    byPastor: (pastorId: string) => 
      [...queryKeys.members.all, 'byPastor', pastorId] as const,
    byUnit: (unitId: string) => 
      [...queryKeys.members.all, 'byUnit', unitId] as const,
  },
  
  // Pastor related queries
  pastors: {
    all: ['pastors'] as const,
    list: () => [...queryKeys.pastors.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.pastors.all, 'detail', id] as const,
  },
  
  // Church unit related queries
  units: {
    all: ['units'] as const,
    list: () => [...queryKeys.units.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.units.all, 'detail', id] as const,
    members: (unitId: string) => [...queryKeys.units.all, 'members', unitId] as const,
  },
  
  // Profile related queries
  profile: {
    all: ['profile'] as const,
    current: () => [...queryKeys.profile.all, 'current'] as const,
    detail: (id: string) => [...queryKeys.profile.all, 'detail', id] as const,
  },
};

/**
 * Helper function to invalidate related queries after a mutation
 * @param queryClient The QueryClient instance
 * @param entity The entity type that was modified
 * @param id Optional ID of the specific entity that was modified
 */
export const invalidateRelatedQueries = (
  queryClient: QueryClient,
  entity: 'users' | 'members' | 'pastors' | 'units' | 'profile',
  id?: string
) => {
  // Always invalidate the list queries for the entity
  queryClient.invalidateQueries({ queryKey: queryKeys[entity].list() });
  
  // If an ID is provided, invalidate the detail query for that entity
  if (id) {
    queryClient.invalidateQueries({ queryKey: queryKeys[entity].detail(id) });
  }
  
  // Handle special cases where modifying one entity affects others
  switch (entity) {
    case 'pastors':
      // When a pastor is modified, invalidate related member queries
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.members.byPastor(id) });
      }
      break;
    case 'units':
      // When a unit is modified, invalidate related member queries
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.members.byUnit(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.units.members(id) });
      }
      break;
    case 'members':
      // When a member is modified, it might affect pastor or unit queries
      queryClient.invalidateQueries({ queryKey: queryKeys.pastors.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.units.list() });
      break;
    case 'users':
      // When a user is modified, it might affect profile queries
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(id) });
      }
      break;
  }
};
