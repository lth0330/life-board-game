import { Character, type Pose } from '../art/Character'
import { MiniIcon } from '../art/MiniArt'
import type { Outfit } from '../engine/outfit'
import type { MiniView } from './miniView'

// 대회 중 다른 사람 칸에 그리는 작은 장면 (2026-10-29). 내 화면 게임과 같은 모양을 작게
export function MiniScene({ game, view, outfit, age }: { game: string; view: MiniView; outfit: Outfit; age?: number }) {
  const v = view
  switch (game) {
    case 'leaves':
      return (
        <>
          <div className="w-leaves">{(v.xs ?? []).map((x, i) => <span key={i} className={`w-leaf c${i % 3}`} style={{ left: `${x}%`, top: `${(v.ys?.[i] ?? 0) * 0.85}%` }} />)}</div>
          <div className="w-text">{v.n ?? 0}/{v.m}개 · {v.left ?? 8}초</div>
        </>
      )
    case 'snowball':
      return (
        <>
          <div className="w-snow">{Array.from({ length: 6 }, (_, k) => <span key={k} className={k === v.pos ? 'up' : ''} />)}</div>
          <div className="w-text">맞힘 {v.right ?? 0} · {Math.min((v.n ?? 0) + 1, v.m ?? 10)}/{v.m ?? 10}</div>
        </>
      )
    case 'timing':
      return (
        <>
          <div className="w-gauge">
            <span className="w-zone" style={{ left: `${50 - (v.zone ?? 17) / 2}%`, width: `${v.zone ?? 17}%` }} />
            <span className={`w-needle${v.right !== undefined ? ' stop' : ''}`} style={{ left: `${v.pos ?? 50}%` }} />
          </div>
          <div className="w-text">{v.right !== undefined ? `${v.right}점` : '멈출 때를 노리는 중'}</div>
        </>
      )
    case 'tug':
      return (
        <>
          <div className="w-track"><span className="w-flag" style={{ left: `${50 + (v.pos ?? 0) / 2}%` }}><MiniIcon name="flag" size={18} /></span></div>
          <div className="w-text">{v.left ?? 6}초</div>
        </>
      )
    case 'race': {
      const k = Math.min(1, (v.n ?? 0) / (v.m || 1))
      return (
        <>
          <div className="w-track race"><span className="w-finish" /><span className="w-runner" style={{ left: `${4 + k * 78}%` }}><Character outfit={outfit} age={age} pose="idle" size={18} /></span></div>
          <div className="w-text">{v.n ?? 0}/{v.m}번 · {v.left ?? 5}초</div>
        </>
      )
    }
    case 'throw':
      return (
        <>
          <div className="w-gauge">
            <span className="w-zone" style={{ left: `${v.target ?? 60}%`, width: `${v.zone ?? 13}%` }} />
            <span className="w-fill" style={{ width: `${v.pos ?? 0}%` }} />
          </div>
          <div className="w-text">{v.n === 2 ? '던졌다!' : v.n === 1 ? '힘 모으는 중' : '준비'}</div>
        </>
      )
    case 'memory':
    case 'photo':
      return (
        <>
          <div className="w-row">{(v.seq ?? []).map((x, i) => <MiniIcon key={i} name={x} size={16} />)}</div>
          <div className="w-text">{v.show ? '외우는 중' : `${v.seq?.length ?? 0}/${v.m}개 고름`}</div>
        </>
      )
    case 'dance':
      return v.show
        ? <><div className="w-row tall"><Character outfit={outfit} age={age} pose={(v.seq?.[0] ?? 'idle') as Pose} expr="happy" size={34} /></div><div className="w-text">{(v.n ?? 0) + 1}/{v.m} 보는 중</div></>
        : <><div className="w-row">{(v.seq ?? []).map((x, i) => <Character key={i} outfit={outfit} pose={x as Pose} size={12} />)}</div><div className="w-text">{v.seq?.length ?? 0}/{v.m} 따라 하는 중</div></>
    case 'pairs':
      return (
        <>
          <div className="w-cards">
            {(v.seq ?? []).map((x, i) => {
              const up = v.found?.includes(i) || v.open?.includes(i)
              return <span key={i} className={v.found?.includes(i) ? 'found' : up ? 'open' : ''}>{up ? <MiniIcon name={x} size={11} /> : ''}</span>
            })}
          </div>
          <div className="w-text">{v.left ?? 0}초</div>
        </>
      )
    case 'quickmath':
      return (
        <>
          <div className="w-big">{v.item ?? ''} = ?</div>
          <div className="w-text">{Math.min((v.n ?? 0) + 1, v.m ?? 5)}/{v.m ?? 5} · 맞힘 {v.right ?? 0} · {v.left ?? 0}초</div>
        </>
      )
    case 'rhythm':
      return (
        <>
          <div className="w-stage">
            <span className="w-line" />
            {(v.ys ?? []).map((y, i) => (y < 0 ? null : <span key={i} className="w-note" style={{ top: `${y}%` }}><MiniIcon name="note" size={13} /></span>))}
          </div>
          <div className="w-text">{(v.marks ?? []).map((x) => (x === null ? '·' : ['✗', '○', '◎'][x])).join(' ')}</div>
        </>
      )
    case 'snap':
      return (
        <>
          <div className="w-snap">
            <span className="w-frame" style={{ left: `${50 - (v.zone ?? 17) / 2}%`, width: `${v.zone ?? 17}%` }} />
            <span className="w-spot" style={{ left: `${v.pos ?? 50}%` }}><MiniIcon name={v.item ?? 'eiffel'} size={20} /></span>
          </div>
          <div className="w-text">{(v.marks ?? []).map((x) => (x ? '○' : '✗')).join(' ') || '찍는 중'}</div>
        </>
      )
    case 'pack':
      return (
        <>
          <div className={`w-row tall${v.ok === true ? ' ok' : v.ok === false ? ' no' : ''}`}><MiniIcon name={v.item ?? 'passport'} size={30} /></div>
          <div className="w-text">{(v.n ?? 0) + 1}/{v.m} · 맞힘 {v.right ?? 0}</div>
        </>
      )
  }
  return null
}
