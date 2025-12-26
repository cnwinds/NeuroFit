import type { GuideData } from './types';

const guideCache = new Map<string, GuideData | null>();

export async function loadGuideData(actionName: string): Promise<GuideData | null> {
  const cacheKey = actionName.toLowerCase();
  
  if (guideCache.has(cacheKey)) {
    return guideCache.get(cacheKey) || null;
  }

  try {
    const module = await import(`../${actionName.toLowerCase()}/guide.ts`);
    const guideData: GuideData = module.default || module.guide;
    guideCache.set(cacheKey, guideData);
    return guideData;
  } catch (error) {
    guideCache.set(cacheKey, null);
    return null;
  }
}

export function hasGuideData(actionName: string): boolean {
  return guideCache.has(actionName.toLowerCase());
}

export function clearGuideCache(): void {
  guideCache.clear();
}
