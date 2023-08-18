import {describe, it, expect, vi} from 'vitest';
import {useRouter, useRoute, createWebHistory} from 'vue-router'
import {mount} from '@vue/test-utils';
import { ROCrate } from 'ro-crate';
import language from '../profiles/text-commons-collection-profile.json'

import CrateEditor from '@/components/CrateEditor.vue';

createWebHistory();

vi.mock('vue-router');

describe('CrateEditor', () => {
    useRouter.mockReturnValue({
        push: vi.fn()
    })
    useRoute.mockReturnValue({
        query: {
            id: '',
        },
    })

    beforeEach(() => {
        useRouter().push.mockReset()
    })

    it('renders properly a blank crate with a profile', () => {
        const wrapper = mount(CrateEditor, {
            props: {
                crate: {},
                profile: language
            }
        });
        expect(wrapper.text()).toContain('Dataset')
    });
});
