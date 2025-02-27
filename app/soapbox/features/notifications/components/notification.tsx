import React, { useCallback } from 'react';
import { HotKeys } from 'react-hotkeys';
import { defineMessages, useIntl, FormattedMessage, IntlShape, MessageDescriptor, defineMessage } from 'react-intl';
import { Link, useHistory } from 'react-router-dom';

import { mentionCompose } from 'soapbox/actions/compose';
import { reblog, favourite, unreblog, unfavourite } from 'soapbox/actions/interactions';
import { openModal } from 'soapbox/actions/modals';
import { getSettings } from 'soapbox/actions/settings';
import { hideStatus, revealStatus } from 'soapbox/actions/statuses';
import Icon from 'soapbox/components/icon';
import { HStack, Text, Emoji } from 'soapbox/components/ui';
import AccountContainer from 'soapbox/containers/account-container';
import StatusContainer from 'soapbox/containers/status-container';
import { useAppDispatch, useAppSelector, useInstance } from 'soapbox/hooks';
import { makeGetNotification } from 'soapbox/selectors';
import { NotificationType, validType } from 'soapbox/utils/notification';

import type { ScrollPosition } from 'soapbox/components/status';
import type { Account as AccountEntity, Status as StatusEntity, Notification as NotificationEntity } from 'soapbox/types/entities';

const notificationForScreenReader = (intl: IntlShape, message: string, timestamp: Date) => {
  const output = [message];

  output.push(intl.formatDate(timestamp, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }));

  return output.join(', ');
};

const buildLink = (account: AccountEntity): JSX.Element => (
  <bdi>
    <Link
      className='font-bold text-gray-800 hover:underline dark:text-gray-200'
      title={account.acct}
      to={`/@${account.acct}`}
      dangerouslySetInnerHTML={{ __html: account.display_name_html }}
    />
  </bdi>
);

const icons: Record<NotificationType, string> = {
  follow: require('@tabler/icons/user-plus.svg'),
  follow_request: require('@tabler/icons/user-plus.svg'),
  mention: require('@tabler/icons/at.svg'),
  favourite: require('@tabler/icons/heart.svg'),
  group_favourite: require('@tabler/icons/heart.svg'),
  reblog: require('@tabler/icons/repeat.svg'),
  group_reblog: require('@tabler/icons/repeat.svg'),
  status: require('@tabler/icons/bell-ringing.svg'),
  poll: require('@tabler/icons/chart-bar.svg'),
  move: require('@tabler/icons/briefcase.svg'),
  'pleroma:chat_mention': require('@tabler/icons/messages.svg'),
  'pleroma:emoji_reaction': require('@tabler/icons/mood-happy.svg'),
  user_approved: require('@tabler/icons/user-plus.svg'),
  update: require('@tabler/icons/pencil.svg'),
  'pleroma:event_reminder': require('@tabler/icons/calendar-time.svg'),
  'pleroma:participation_request': require('@tabler/icons/calendar-event.svg'),
  'pleroma:participation_accepted': require('@tabler/icons/calendar-event.svg'),
};

const nameMessage = defineMessage({
  id: 'notification.name',
  defaultMessage: '{link}{others}',
});

const messages: Record<NotificationType, MessageDescriptor> = defineMessages({
  follow: {
    id: 'notification.follow',
    defaultMessage: '{name} followed you',
  },
  follow_request: {
    id: 'notification.follow_request',
    defaultMessage: '{name} has requested to follow you',
  },
  mention: {
    id: 'notification.mentioned',
    defaultMessage: '{name} mentioned you',
  },
  favourite: {
    id: 'notification.favourite',
    defaultMessage: '{name} liked your post',
  },
  group_favourite: {
    id: 'notification.group_favourite',
    defaultMessage: '{name} liked your group post',
  },
  reblog: {
    id: 'notification.reblog',
    defaultMessage: '{name} reposted your post',
  },
  group_reblog: {
    id: 'notification.group_reblog',
    defaultMessage: '{name} reposted your group post',
  },
  status: {
    id: 'notification.status',
    defaultMessage: '{name} just posted',
  },
  poll: {
    id: 'notification.poll',
    defaultMessage: 'A poll you have voted in has ended',
  },
  move: {
    id: 'notification.move',
    defaultMessage: '{name} moved to {targetName}',
  },
  'pleroma:chat_mention': {
    id: 'notification.pleroma:chat_mention',
    defaultMessage: '{name} sent you a message',
  },
  'pleroma:emoji_reaction': {
    id: 'notification.pleroma:emoji_reaction',
    defaultMessage: '{name} reacted to your post',
  },
  user_approved: {
    id: 'notification.user_approved',
    defaultMessage: 'Welcome to {instance}!',
  },
  update: {
    id: 'notification.update',
    defaultMessage: '{name} edited a post you interacted with',
  },
  'pleroma:event_reminder': {
    id: 'notification.pleroma:event_reminder',
    defaultMessage: 'An event you are participating in starts soon',
  },
  'pleroma:participation_request': {
    id: 'notification.pleroma:participation_request',
    defaultMessage: '{name} wants to join your event',
  },
  'pleroma:participation_accepted': {
    id: 'notification.pleroma:participation_accepted',
    defaultMessage: 'You were accepted to join the event',
  },
});

const buildMessage = (
  intl: IntlShape,
  type: NotificationType,
  account: AccountEntity,
  totalCount: number | null,
  targetName: string,
  instanceTitle: string,
): React.ReactNode => {
  const link = buildLink(account);
  const name = intl.formatMessage(nameMessage, {
    link,
    others: totalCount && totalCount > 0 ? (
      <FormattedMessage
        id='notification.others'
        defaultMessage=' + {count, plural, one {# other} other {# others}}'
        values={{ count: totalCount - 1 }}
      />
    ) : '',
  });

  return intl.formatMessage(messages[type], {
    name,
    targetName,
    instance: instanceTitle,
  });
};

const avatarSize = 48;

interface INotificaton {
  hidden?: boolean
  notification: NotificationEntity
  onMoveUp?: (notificationId: string) => void
  onMoveDown?: (notificationId: string) => void
  onReblog?: (status: StatusEntity, e?: KeyboardEvent) => void
  getScrollPosition?: () => ScrollPosition | undefined
  updateScrollBottom?: (bottom: number) => void
}

const Notification: React.FC<INotificaton> = (props) => {
  const { hidden = false, onMoveUp, onMoveDown } = props;

  const dispatch = useAppDispatch();

  const getNotification = useCallback(makeGetNotification(), []);

  const notification = useAppSelector((state) => getNotification(state, props.notification));

  const history = useHistory();
  const intl = useIntl();
  const instance = useInstance();

  const type = notification.type;
  const { account, status } = notification;

  const getHandlers = () => ({
    reply: handleMention,
    favourite: handleHotkeyFavourite,
    boost: handleHotkeyBoost,
    mention: handleMention,
    open: handleOpen,
    openProfile: handleOpenProfile,
    moveUp: handleMoveUp,
    moveDown: handleMoveDown,
    toggleHidden: handleHotkeyToggleHidden,
  });

  const handleOpen = () => {
    if (status && typeof status === 'object' && account && typeof account === 'object') {
      history.push(`/@${account.acct}/posts/${status.id}`);
    } else {
      handleOpenProfile();
    }
  };

  const handleOpenProfile = () => {
    if (account && typeof account === 'object') {
      history.push(`/@${account.acct}`);
    }
  };

  const handleMention = useCallback((e?: KeyboardEvent) => {
    e?.preventDefault();

    if (account && typeof account === 'object') {
      dispatch(mentionCompose(account));
    }
  }, [account]);

  const handleHotkeyFavourite = useCallback((e?: KeyboardEvent) => {
    if (status && typeof status === 'object') {
      if (status.favourited) {
        dispatch(unfavourite(status));
      } else {
        dispatch(favourite(status));
      }
    }
  }, [status]);

  const handleHotkeyBoost = useCallback((e?: KeyboardEvent) => {
    if (status && typeof status === 'object') {
      dispatch((_, getState) => {
        const boostModal = getSettings(getState()).get('boostModal');
        if (status.reblogged) {
          dispatch(unreblog(status));
        } else {
          if (e?.shiftKey || !boostModal) {
            dispatch(reblog(status));
          } else {
            dispatch(openModal('BOOST', { status, onReblog: (status: StatusEntity) => {
              dispatch(reblog(status));
            } }));
          }
        }
      });
    }
  }, [status]);

  const handleHotkeyToggleHidden = useCallback((e?: KeyboardEvent) => {
    if (status && typeof status === 'object') {
      if (status.hidden) {
        dispatch(revealStatus(status.id));
      } else {
        dispatch(hideStatus(status.id));
      }
    }
  }, [status]);

  const handleMoveUp = () => {
    if (onMoveUp) {
      onMoveUp(notification.id);
    }
  };

  const handleMoveDown = () => {
    if (onMoveDown) {
      onMoveDown(notification.id);
    }
  };

  const renderIcon = (): React.ReactNode => {
    if (type === 'pleroma:emoji_reaction' && notification.emoji) {
      return (
        <Emoji
          emoji={notification.emoji}
          src={notification.emoji_url || undefined}
          className='h-4 w-4 flex-none'
        />
      );
    } else if (validType(type)) {
      return (
        <Icon
          src={icons[type]}
          className='flex-none text-primary-600 dark:text-primary-400'
        />
      );
    } else {
      return null;
    }
  };

  const renderContent = () => {
    switch (type as NotificationType) {
      case 'follow':
      case 'user_approved':
        return account && typeof account === 'object' ? (
          <AccountContainer
            id={account.id}
            hidden={hidden}
            avatarSize={avatarSize}
          />
        ) : null;
      case 'follow_request':
        return account && typeof account === 'object' ? (
          <AccountContainer
            id={account.id}
            hidden={hidden}
            avatarSize={avatarSize}
            actionType='follow_request'
          />
        ) : null;
      case 'move':
        return account && typeof account === 'object' && notification.target && typeof notification.target === 'object' ? (
          <AccountContainer
            id={notification.target.id}
            hidden={hidden}
            avatarSize={avatarSize}
          />
        ) : null;
      case 'favourite':
      case 'group_favourite':
      case 'mention':
      case 'reblog':
      case 'group_reblog':
      case 'status':
      case 'poll':
      case 'update':
      case 'pleroma:emoji_reaction':
      case 'pleroma:event_reminder':
      case 'pleroma:participation_accepted':
      case 'pleroma:participation_request':
        return status && typeof status === 'object' ? (
          <StatusContainer
            id={status.id}
            hidden={hidden}
            onMoveDown={handleMoveDown}
            onMoveUp={handleMoveUp}
            avatarSize={avatarSize}
            contextType='notifications'
            showGroup={false}
          />
        ) : null;
      default:
        return null;
    }
  };

  const targetName = notification.target && typeof notification.target === 'object' ? notification.target.acct : '';

  const message: React.ReactNode = validType(type) && account && typeof account === 'object' ? buildMessage(intl, type, account, notification.total_count, targetName, instance.title) : null;

  const ariaLabel = validType(type) ? (
    notificationForScreenReader(
      intl,
      intl.formatMessage(messages[type], {
        name: account && typeof account === 'object' ? account.acct : '',
        targetName,
      }),
      notification.created_at,
    )
  ) : '';

  return (
    <HotKeys handlers={getHandlers()} data-testid='notification'>
      <div
        className='notification focusable'
        tabIndex={0}
        aria-label={ariaLabel}
      >
        <div className='focusable p-4'>
          <div className='mb-2'>
            <HStack alignItems='center' space={3}>
              <div
                className='flex justify-end'
                style={{ flexBasis: avatarSize }}
              >
                {renderIcon()}
              </div>

              <div className='truncate'>
                <Text
                  theme='muted'
                  size='xs'
                  truncate
                  data-testid='message'
                >
                  {message}
                </Text>
              </div>
            </HStack>
          </div>

          <div>
            {renderContent()}
          </div>
        </div>
      </div>
    </HotKeys>
  );
};

export default Notification;
