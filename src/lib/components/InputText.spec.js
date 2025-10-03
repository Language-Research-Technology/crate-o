import { expect, test } from '@playwright/experimental-ct-vue';
import Component from '../playwright/component.vue';
import InputText from '../src/lib/components/InputText.vue';

/**
 * @param {import('@playwright/experimental-ct-vue').MountResult} c 
 */
function getInput(c) {
  return c.locator('.el-input__inner');
}

test.describe('component', { tag: '@component' }, () => {
  test.describe('InputText', () => {
    test('handles text input correctly', async ({ mount }) => {
      const modelValue = 'Test Input Value';
      const c = await mount(InputText, {
        props: { modelValue, type: 'text' }
      });
      await expect(getInput(c)).toHaveValue(modelValue);
      await expect(c).not.toContainClass('is-error');
    });

    test('handles number input correctly', async ({ mount }) => {
      const modelValue = '42';
      const c = await mount(InputText, {
        props: { modelValue, type: 'number' }
      });
      await expect(getInput(c)).toHaveValue(modelValue);
      await expect(c).not.toContainClass('is-error');
    });

    test('handles textarea input correctly', async ({ mount }) => {
      const multilineText = 'First line\nSecond line\nThird line';
      const c = await mount(InputText, {
        props: { modelValue: multilineText, type: 'textarea' }
      });
      await expect(c.locator('textarea')).toHaveValue(multilineText);
      await expect(c).not.toContainClass('is-error');
    });

    test('handles URL input correctly', async ({ mount }) => {
      const validUrl = 'https://example.com';
      const c = await mount(InputText, {
        props: { modelValue: validUrl, type: 'url' }
      });
      await expect(getInput(c)).toHaveValue(validUrl);
      await expect(c).not.toContainClass('is-error');
    });

    test('should update value on input change', async ({ mount }) => {
      const c = await mount(Component, {
        props: {
          component: InputText,
          componentProps: { type: 'text' }
        }
      });
      const input = c.locator('input');
      await input.fill('new value');
      await input.blur(); // Trigger the change event
      
      // Verify the input value was updated
      await expect(input).toHaveValue('new value');
    });

  //   test('should show required attribute', async ({ mount }) => {
  //     const c = await mount(InputText, {
  //       props: { 
  //         modelValue: '', 
  //         type: 'text',
  //         required: true 
  //       }
  //     });
  //     await expect(getInput(c)).toHaveAttribute('required', '');
  //   });
  });
});