import React, { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import DisplayName from 'soapbox/components/display-name';
import Icon from 'soapbox/components/icon';
import { Avatar, Counter, HStack, Stack, Text } from 'soapbox/components/ui';
import emojify from 'soapbox/features/emoji/emoji';
import { useAppSelector } from 'soapbox/hooks';
import { makeGetChat } from 'soapbox/selectors';

import type { Account as AccountEntity, Chat as ChatEntity } from 'soapbox/types/entities';

interface IChat {
  chatId: string,
  onClick: (chat: any) => void,
}

const Chat: React.FC<IChat> = ({ chatId, onClick }) => {
  const getChat = useCallback(makeGetChat(), []);
  const chat = useAppSelector((state) => {
    const chat = state.chats.items.get(chatId);
    return chat ? getChat(state, (chat as any).toJS()) : undefined;
  }) as ChatEntity;

  const account = chat.account as AccountEntity;
  if (!chat || !account) return null;
  const unreadCount = chat.unread;
  const content = chat.getIn(['last_message', 'content']);
  const attachment = chat.getIn(['last_message', 'attachment']);
  const image = attachment && (attachment as any).getIn(['pleroma', 'mime_type'], '').startsWith('image/');
  const parsedContent = content ? emojify(content) : '';

  return (
    <div className='account'>
      <button className='floating-link' onClick={() => onClick(chat)} />
      <HStack key={account.id} space={3} className='relative'>
        <Avatar src={account.avatar} size={36} />
        <Stack>
          <DisplayName account={account} withSuffix={false} />
          {attachment && (
            <Icon
              className='chat__attachment-icon'
              src={image ? require('@tabler/icons/photo.svg') : require('@tabler/icons/paperclip.svg')}
            />
          )}
          {content ? (
            <Text
              theme='muted'
              size='sm'
              className='chat__last-message'
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          ) : attachment && (
            <span
              className='chat__last-message attachment'
            >
              {image ? <FormattedMessage id='chats.attachment_image' defaultMessage='Image' /> : <FormattedMessage id='chats.attachment' defaultMessage='Attachment' />}
            </span>
          )}
          {unreadCount > 0 && (
            <div className='absolute top-1 right-0'>
              <Counter count={unreadCount} />
            </div>
          )}
        </Stack>
      </HStack>
    </div>
  );
};

export default Chat;
