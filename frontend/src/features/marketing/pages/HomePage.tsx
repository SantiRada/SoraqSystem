import { paths } from '@/config/paths';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { FeatureShowcase } from '../components/FeatureShowcase';
import { FinalCta } from '../components/FinalCta';
import { HeroSection } from '../components/HeroSection';
import { ProcessGrid } from '../components/ProcessGrid';
import { ToolsMarquee } from '../components/ToolsMarquee';

/**
 * Public home. Visual references: framer.com (dark canvas, glowing product window),
 * dash.dropbox.com (centered hero, tool marquee, large feature panels),
 * antigravity.google (display type, pill buttons, dot field). docs/BRAND.md §15.
 */
export function HomePage() {
  usePageMeta({ path: paths.home });

  return (
    <>
      <HeroSection />
      <ToolsMarquee />
      <FeatureShowcase />
      <ProcessGrid />
      <FinalCta />
    </>
  );
}
