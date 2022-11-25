import React from 'react';
import { HStack } from 'soapbox/components/ui';

import PlaceholderAvatar from './placeholder-avatar';
import PlaceholderDisplayName from './placeholder-display-name';
import PlaceholderStatusContent from './placeholder-status-content';

/** Fake notification to display while data is loading. */
const PlaceholderNotification = () => (
  <div className='bg-white dark:bg-primary-900 px-4 py-6 sm:p-6'>
    <div className='w-full animate-pulse'>
      <div className='mb-2'>
        <PlaceholderStatusContent minLength={20} maxLength={20} />
      </div>

      <div>
        <HStack space={3} alignItems='center'>
          <div className='flex-shrink-0'>
            <PlaceholderAvatar size={48} />
          </div>

          <div className='min-w-0 flex-1'>
            <PlaceholderDisplayName minLength={3} maxLength={25} />
          </div>
        </HStack>
      </div>

      <div className='mt-4'>
        <PlaceholderStatusContent minLength={5} maxLength={120} />
      </div>
    </div>
  </div>
);

export default React.memo(PlaceholderNotification);
