import { describe, expect, it } from 'vitest';
import { ConfigImporter } from './importer.js';
import { defaultConfig } from './formatter.js';
import { dirname, join } from 'path';
import { promises } from 'fs';

describe('ConfigImporter', () => {
  describe('import', () => {
    it('should handle an empty config', () => {
      expect(ConfigImporter.import({})).toMatchObject({});
    });

    it('should handle the default config', async () => {
      const configJsonPath = join(dirname(import.meta.dirname), 'themes', 'default.json');
      const configJsonData = await promises.readFile(configJsonPath);
      const configJson = JSON.parse(configJsonData.toString());
      expect(ConfigImporter.import(configJson)).toMatchObject(defaultConfig);
    });
  });
});
