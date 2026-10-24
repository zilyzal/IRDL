// Re-renders a screen when the catalog gained or changed a game while the app runs (state/catalog.js
// addImportedGame): the version it returns goes into the dependency lists of what the screen computes from the catalog.

import { useEffect, useState } from 'react';
import { currentCatalogVersion, onCatalogChange } from './catalog.js';

  function useCatalogVersion() {
    const [version, setVersion] = useState(currentCatalogVersion);
    useEffect(() => {
      setVersion(currentCatalogVersion());
      return onCatalogChange(setVersion);
    }, []);
    return version;
  }

export { useCatalogVersion };
