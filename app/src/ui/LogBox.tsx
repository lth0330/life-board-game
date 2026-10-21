// 아래쪽 기록 창 (2026-10-21 사용자, 게임 채팅창처럼 탭): 진행(게임 기록) · 채팅(온라인 사람끼리)
// 늘 보이고, 줄 부분을 누르면 1줄 ↔ 5줄. 채팅은 온라인에서만. 전체 탭은 없앰 (2026-10-21 사용자)
import { useEffect, useState } from 'react'
import type { GameState, LogEntry } from '../engine/types'
import type { ChatMsg } from '../online/Online'

const CHAT_MAX = 60
type Tab = 'log' | 'chat'
type Line = { key: string; kind: 'log'; l: LogEntry } | { key: string; kind: 'chat'; c: ChatMsg }

export function LogBox({ game, chat, onSend }: { game: GameState; chat?: ChatMsg[]; onSend?: (text: string) => boolean }) {
  const online = !!onSend
  const [open, setOpen] = useState(() => { try { return localStorage.getItem('dgl:logOpen') === '1' } catch { return false } })
  const [tab, setTab] = useState<Tab>('log')
  const [text, setText] = useState('')
  const [unread, setUnread] = useState(0)
  const toggle = () => { const v = !open; setOpen(v); try { localStorage.setItem('dgl:logOpen', v ? '1' : '0') } catch { /* 무시 */ } }

  // 채팅 탭이 아닐 때 새 채팅이 오면 탭에 숫자
  const chatLen = chat?.length ?? 0
  useEffect(() => { if (tab !== 'chat' && chatLen) setUnread((u) => u + 1) }, [chatLen]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'chat') setUnread(0) }, [tab])

  const lines: Line[] = tab === 'log' ? game.log.slice(-5).map((l, i) => ({ key: `t${game.logCount}-${i}`, kind: 'log', l }))
    : (chat ?? []).slice(-5).map((c) => ({ key: `c${c.id}`, kind: 'chat', c }))
  const shown = open ? lines : lines.slice(-1)
  const send = () => { if (onSend?.(text)) setText('') }
  const name = (id: number | null) => (id === null ? null : game.players[id])
  return (
    <div className={`logbox${open ? ' open' : ''}`}>
      {open && online && (
        <div className="logbox-tabs" role="tablist">
          {([['log', '진행'], ['chat', '채팅']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{k === 'chat' && unread > 0 && tab !== 'chat' ? <em>{unread}</em> : null}</button>
          ))}
        </div>
      )}
      <button className="logbox-lines" onClick={toggle} aria-label={open ? '기록 줄이기' : '기록 크게 보기'}>
        {shown.length === 0 && <div className="muted">{tab === 'chat' ? '아직 채팅이 없어요' : ''}</div>}
        {shown.map((x) => x.kind === 'log' ? (
          <div key={x.key} className={`log-${x.l.tone}`}>
            {name(x.l.playerId) && <b style={{ color: name(x.l.playerId)!.color }}>{name(x.l.playerId)!.name} </b>}{x.l.text}
          </div>
        ) : (
          <div key={x.key} className="chat-line">
            <b style={{ color: x.c.player !== null ? game.players[x.c.player]?.color : undefined }}>[{x.c.name}]</b> {x.c.text}
          </div>
        ))}
        <span className="ticker-toggle" aria-hidden="true">{open ? '▼' : '▲'}</span>
      </button>
      {open && online && tab === 'chat' && (
        <form className="logbox-input" onSubmit={(e) => { e.preventDefault(); send() }}>
          <input value={text} maxLength={CHAT_MAX} placeholder="채팅 (60자까지)" aria-label="채팅 쓰기" onChange={(e) => setText(e.target.value)} />
          <button type="submit" disabled={!text.trim()}>보내기</button>
        </form>
      )}
    </div>
  )
}
