/**
 * Villager assignment. Pure functions, no rendering.
 * Assign: villager.state = 'assigned', villager.assignedTo = bushId.
 * Unassign: back to 'idle', assignedTo = null.
 */

/**
 * Assign a villager to a bush. Returns a new villager object.
 */
export function assignVillager(villager, bushId) {
  if (villager.assignedTo === bushId && villager.state === 'assigned') {
    return villager; // already assigned here, no-op
  }
  return { ...villager, state: 'assigned', assignedTo: bushId };
}

/**
 * Unassign a villager. Returns a new villager object.
 */
export function unassignVillager(villager) {
  if (villager.state === 'idle') {
    return villager; // already idle, no-op
  }
  return { ...villager, state: 'idle', assignedTo: null };
}
