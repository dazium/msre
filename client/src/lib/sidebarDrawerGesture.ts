export const MOBILE_DRAWER_EDGE_PX = 32;
export const MOBILE_DRAWER_OPEN_SWIPE_PX = 72;

export function shouldOpenMobileDrawerFromSwipe(
  start: { x: number; y: number },
  end: { x: number; y: number },
): boolean {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;

  return (
    start.x <= MOBILE_DRAWER_EDGE_PX &&
    deltaX >= MOBILE_DRAWER_OPEN_SWIPE_PX &&
    deltaX > Math.abs(deltaY)
  );
}
