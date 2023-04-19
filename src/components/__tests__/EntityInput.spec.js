import { describe, it, expect } from 'vitest';

import { mount } from '@vue/test-utils';
import EntityInput from '../EntityInput.vue';


describe('EntityInput', () => {
  it('renders properly', () => {
    const wrapper = mount(EntityInput, { props: { name: 'Property', value: 'Some Value', index: 0 } });
    expect(wrapper.text()).toContain('Some Value');
  })
})
