import { useEffect, useState } from 'react';
import { listUserTemplatePackages, USER_TEMPLATE_LIBRARY_EVENT, type UserTemplateSummary } from './userLibrary';

export function useUserTemplateLibrary(): { templates: UserTemplateSummary[]; loading: boolean; error?: string } {
  const [templates, setTemplates] = useState<UserTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const packages = await listUserTemplatePackages();
        if (active) {
          setTemplates(packages.map(({ id, manifest, files, installedAt }) => ({ id, manifest, preview: files['preview.webp'], installedAt })));
          setError(undefined);
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    window.addEventListener(USER_TEMPLATE_LIBRARY_EVENT, refresh);
    return () => { active = false; window.removeEventListener(USER_TEMPLATE_LIBRARY_EVENT, refresh); };
  }, []);

  return { templates, loading, error };
}
