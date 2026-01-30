import { expect, test } from '@playwright/experimental-ct-vue';
import PropertyAddValueTest from './PropertyAddValue.story.vue';

test.describe('PropertyAddValue', { tag: '@component' }, () => {
  test('a single type inline', async ({ mount }) => {
    const c = await mount(PropertyAddValueTest, {
      props: { types: ['Text'] },
    });
    for (let i = 0; i < 5; ++i) {
      await expect(c.getByTestId('values')).toHaveCount(i);
      await c.getByRole('button', { name: 'Text' }).click();
    }
  });

  test('a single type entity', async ({ mount }) => {
    const c = await mount(PropertyAddValueTest, {
      props: { types: ['Entity'] },
    });
    for (let i = 0; i < 3; ++i) {
      await expect(c.getByTestId('values')).toHaveCount(i);
      await c.getByRole('button', { name: 'Entity' }).click();
      await c.getByRole('combobox').pressSequentially('local');
      await c.page().getByRole('option', { name: 'Local Option 1' }).click();
    }
  });

  test('multiple types', async ({ mount }) => {
    const c = await mount(PropertyAddValueTest, {
      props: { types: ['Text', 'Number'] },
    });
    for (let i = 0; i < 3; ++i) {
      await expect(c.getByTestId('values')).toHaveCount(i);
      await c.getByRole('combobox').click();
      //console.log(await (c.getByRole('option', { name: 'Number' })).all());
      await c.page().getByRole('option', { name: 'Number' }).click();
    }
  });

  test('create new inline entity', async ({ mount }) => {
    const c = await mount(PropertyAddValueTest, {
      props: { types: ['Geometry'] },
    });
    await c.getByRole('button', { name: 'Geometry' }).click();
    await expect(c.getByTestId('values')).toHaveCount(1);
  });

  test('create new entity, create button', async ({ mount }) => {
    const c = await mount(PropertyAddValueTest, {
      props: { types: ['Organization'] },
    });
    await c.getByRole('button', { name: 'Organization' }).click();
    await c.getByRole('combobox').fill('test org');
    await c.getByRole('button', { name: 'Create' }).click();
    await expect(c.getByTestId('values')).toContainText('test org');
  });

  test('create new entity, enter key', async ({ mount }) => {
    const c = await mount(PropertyAddValueTest, {
      props: { types: ['Organization'] },
    });
    await c.getByRole('button', { name: 'Organization' }).click();
    await c.getByRole('combobox').fill('test org');
    await c.getByRole('combobox').press('Enter');
    await expect(c.getByTestId('values')).toContainText('test org');
  });

  test('lookups', async ({ mount }) => {
    // const c = await mount(Component, {
    //   props: {
    //     component: PropertyAddValue,
    //     componentProps: { definition },
    //   },
    // });
    const c = await mount(PropertyAddValueTest, {
      props: { types: ['Organization'] },
    });
    //await expect(getInput(c)).toHaveValue(modelValue);
    //await expect(c).not.toContainClass('is-error');
  });
});
