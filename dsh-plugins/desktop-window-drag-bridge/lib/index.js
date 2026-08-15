// Wait for DSH's client-module registry before activating this dual-face plugin.
export const inject = ["clientModules"];

export function apply(ctx) {
  ctx.logger.info("desktop window drag bridge host plugin activated");
}
