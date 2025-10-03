import { test, expect } from '@playwright/experimental-ct-vue';
import InputDateTime from './InputDateTime.vue';

/**
 * @param {import('@playwright/experimental-ct-vue').MountResult} c 
 */
function getInput(c) {
  return c.locator('.el-input__inner');
}

test.describe('component', { tag: '@component' }, () => {
  //import software from 'ro-crate-editor-profiles/profiles/software-profile.json'
  //import language_collection from 'ro-crate-editor-profiles/profiles/language-data-commons-collection-profile.json'

  test.describe('InputDateTime', () => {

    test('handles ISO dates', async ({mount}) => {
      const modelValue = '2001-01-19T13:00:00.000Z';
      const c = await mount(InputDateTime, {
        props: { modelValue, type: 'datetime' }
      });
      await expect(getInput(c)).toHaveValue(modelValue);
      await expect(c.locator('.el-input')).not.toContainClass('is-error');
    });

    test('handles year only', async ({mount}) => {
      const modelValue = '2025';
      const c = await mount(InputDateTime, { props: { modelValue, type: 'date' } });
      await expect(getInput(c)).toHaveValue(modelValue);
      await expect(c.locator('.el-input')).not.toContainClass('is-error');
    });

    test('handles year month day', async ({ mount }) => {
      const modelValue = '2023-12-16';
      const c = await mount(InputDateTime, { props: { modelValue, type: 'date' } });
      await expect(getInput(c)).toHaveValue(modelValue);
      await expect(c.locator('.el-input')).not.toContainClass('is-error');
    });

    test('handles time', async ({ mount }) => {
      const modelValue = '13:10:05';
      const c = await mount(InputDateTime, { props: { modelValue, type: 'time' } });
      await expect(getInput(c)).toHaveValue(modelValue);
      await expect(c.locator('.el-input')).not.toContainClass('is-error');
    });

    test('handles date range', async ({ mount }) => {
      const modelValue = '2023/2024';
      const c = await mount(InputDateTime, { props: { modelValue, type: 'time' } });
      await expect(getInput(c)).toHaveValue(modelValue);
      await expect(c.locator('.el-input')).not.toContainClass('is-error');
    });

    test('should error with wrong format', async ({ mount }) => {
      const modelValue = '2023/02/30'; // 30 Feb!
      const c = await mount(InputDateTime, { props: { modelValue, type: 'datetime' } });
      await expect(getInput(c)).toHaveValue(modelValue);
      await expect(c.locator('.el-input')).toContainClass('is-error');
      await expect(c.locator('.text-xs.text-red-700')).toContainText('ISO');
    });


  });
});
