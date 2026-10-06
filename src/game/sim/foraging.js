/**
 * Foraging production. Pure function.
 * Each assigned villager produces 1 berry per 10s of actual work.
 * A villager must have been assigned for a full tick interval before
 * producing; dropping them on just before the tick doesn't count.
 */
export function forageTick(villagers, now, tickMs) {
  return villagers.filter(
    (v) => v.state === 'assigned' && now - v.assignedAt >= tickMs
  );
}
