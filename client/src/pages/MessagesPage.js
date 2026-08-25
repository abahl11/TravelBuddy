import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import messageService from '../services/messageService';
import { getErrorMessage } from '../api/client';
import UserAvatar from '../components/UserAvatar';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { formatTime, getRelativeTime } from '../utils/formatDate';

const idOf = (value) => (typeof value === 'object' && value ? value._id : value);

/**
 * Inbox for the messages people were already sending from journey pages, which
 * previously had no screen to read them on.
 */
const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('with');

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await messageService.getConversations());
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your messages'));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadThread = async () => {
      try {
        setLoadingThread(true);
        const thread = await messageService.getMessagesByUser(activeId);
        if (cancelled) return;
        setMessages(thread);
        // Opening a thread marks it read server-side; mirror that locally.
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation._id === activeId ? { ...conversation, unreadCount: 0 } : conversation
          )
        );
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to open this conversation'));
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    };

    loadThread();

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const activeConversation = conversations.find((conversation) => conversation._id === activeId);

  const handleSend = async (event) => {
    event.preventDefault();

    if (!draft.trim() || !activeId) return;

    try {
      setSending(true);
      const message = await messageService.sendMessage({ recipient: activeId, content: draft.trim() });
      setMessages((prev) => [...prev, message]);
      setDraft('');
      loadConversations();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send the message'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-ink-50 py-8">
      <div className="container">
        <h1 className="text-3xl">Messages</h1>
        <p className="mt-2 text-ink-500">Conversations with people you are travelling with.</p>

        <ErrorMessage error={error} className="mt-6" onDismiss={() => setError(null)} />

        {loadingList ? (
          <Loader label="Loading conversations" />
        ) : conversations.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="message"
              title="No conversations yet"
              description="Message the organiser from a journey page and the thread will appear here."
              actionLabel="Find journeys"
              actionTo="/journeys"
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className={`card overflow-hidden ${activeId ? 'hidden lg:block' : ''}`}>
              <ul className="divide-y divide-ink-100">
                {conversations.map((conversation) => (
                  <li key={conversation._id}>
                    <button
                      type="button"
                      onClick={() => setSearchParams({ with: conversation._id })}
                      className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-ink-50 ${
                        conversation._id === activeId ? 'bg-primary-50' : ''
                      }`}
                    >
                      <UserAvatar user={conversation.user} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-ink-900">
                            {conversation.user.fullName || conversation.user.username}
                          </p>
                          <time className="shrink-0 text-[11px] text-ink-400">
                            {getRelativeTime(conversation.lastMessage.createdAt)}
                          </time>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-500">
                          {idOf(conversation.lastMessage.sender) === user?._id && 'You: '}
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className={`card flex min-h-[520px] flex-col ${activeId ? '' : 'hidden lg:flex'}`}>
              {!activeConversation ? (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-ink-500">
                  Pick a conversation to read it.
                </div>
              ) : (
                <>
                  <header className="flex items-center gap-3 border-b border-ink-100 p-4">
                    <button
                      type="button"
                      onClick={() => setSearchParams({})}
                      className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 lg:hidden"
                      aria-label="Back to conversations"
                    >
                      <Icon name="arrowLeft" className="h-4 w-4" />
                    </button>
                    <UserAvatar user={activeConversation.user} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {activeConversation.user.fullName || activeConversation.user.username}
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        {activeConversation.user.university}
                      </p>
                    </div>
                  </header>

                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {loadingThread ? (
                      <Loader label="Loading messages" />
                    ) : (
                      messages.map((item) => {
                        const mine = idOf(item.sender) === user?._id;

                        return (
                          <div
                            key={item._id}
                            className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'}`}>
                              <div
                                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                  mine
                                    ? 'rounded-br-md bg-primary-600 text-white'
                                    : 'rounded-bl-md bg-ink-100 text-ink-800'
                                }`}
                              >
                                {item.content}
                              </div>
                              <p
                                className={`mt-1 text-[11px] text-ink-400 ${
                                  mine ? 'text-right' : 'text-left'
                                }`}
                              >
                                {formatTime(item.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <form onSubmit={handleSend} className="flex gap-2 border-t border-ink-100 p-4">
                    <input
                      type="text"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Write a message…"
                      maxLength={2000}
                      className="input"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="btn-primary shrink-0"
                      aria-label="Send"
                    >
                      <Icon name="send" className="h-4 w-4" />
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
