import { RoleDistribution } from "@/types/game";

export const DEFAULT_DISTRIBUTIONS: Record<number, RoleDistribution> = {
  4: { undercovers: 1, mrWhites: 0 },
  5: { undercovers: 1, mrWhites: 1 },
  6: { undercovers: 1, mrWhites: 1 },
  7: { undercovers: 2, mrWhites: 1 },
  8: { undercovers: 2, mrWhites: 1 },
  9: { undercovers: 3, mrWhites: 1 },
  10: { undercovers: 3, mrWhites: 1 },
  11: { undercovers: 3, mrWhites: 2 },
  12: { undercovers: 4, mrWhites: 2 },
  13: { undercovers: 4, mrWhites: 2 },
  14: { undercovers: 5, mrWhites: 2 },
  15: { undercovers: 5, mrWhites: 2 },
  16: { undercovers: 5, mrWhites: 3 },
  17: { undercovers: 6, mrWhites: 3 },
  18: { undercovers: 6, mrWhites: 3 },
  19: { undercovers: 7, mrWhites: 3 },
  20: { undercovers: 7, mrWhites: 3 },
};

export const calculateDefaultDistribution = (playerCount: number): RoleDistribution => {
  return DEFAULT_DISTRIBUTIONS[playerCount] || DEFAULT_DISTRIBUTIONS[4];
};

export const distributionMeetsLimits = (distribution: RoleDistribution, playerCount: number): boolean => {
  const { undercovers, mrWhites } = distribution;
  const totalSpecialRoles = undercovers + mrWhites;
  const civilians = playerCount - totalSpecialRoles;

  return totalSpecialRoles <= civilians 
         && undercovers < civilians
         && undercovers >= 0
         && mrWhites >= 0
         && totalSpecialRoles > 0;
};