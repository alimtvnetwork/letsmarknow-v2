/**
 * Extension point for extra app context attached to bug reports.
 *
 * In cat-my-v12 this pulled the active project, rules and validation runs
 * from the editor stores. LetsMarkNow has no vision-editor stores, so this
 * returns an empty object. Wire app-specific context here later if needed,
 * e.g. `{ activeWorkspaceId, activeSpaceId }`.
 */
export function getExtraReportContext(): Record<string, unknown> {
  return {};
}
