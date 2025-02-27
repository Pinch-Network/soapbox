import { __stub } from 'soapbox/api';
import { buildGroup } from 'soapbox/jest/factory';
import { renderHook, waitFor } from 'soapbox/jest/test-helpers';

import { useGroupLookup } from '../useGroupLookup';

const group = buildGroup({ id: '1', slug: 'soapbox' });

describe('useGroupLookup hook', () => {
  describe('with a successful request', () => {
    beforeEach(() => {
      __stub((mock) => {
        mock.onGet(`/api/v1/groups/lookup?name=${group.slug}`).reply(200, group);
      });
    });

    it('is successful', async () => {
      const { result } = renderHook(() => useGroupLookup(group.slug));

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      expect(result.current.entity?.id).toBe(group.id);
    });
  });

  describe('with an unsuccessful query', () => {
    beforeEach(() => {
      __stub((mock) => {
        mock.onGet(`/api/v1/groups/lookup?name=${group.slug}`).networkError();
      });
    });

    it('is has error state', async() => {
      const { result } = renderHook(() => useGroupLookup(group.slug));

      await waitFor(() => expect(result.current.isFetching).toBe(false));

      expect(result.current.entity).toBeUndefined();
    });
  });
});