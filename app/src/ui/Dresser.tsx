import { useState } from 'react'
import { Character } from '../art/Character'
import { accList, CLOTH_COLORS, HAIR_COLORS, ITEMS, MAX_ACC, SKINS, SLOT_NAMES, toggleAcc, withAccs, withGender, type Outfit, type Slot } from '../engine/outfit'

// 캐릭터 꾸미기: 모자·상의·겉옷·하의·신발·액세서리·머리
const COLOR_KEY: Record<Slot, keyof Outfit> = {
  hair: 'hairColor', hat: 'hatColor', top: 'topColor', outer: 'outerColor', bottom: 'bottomColor', shoes: 'shoesColor', acc: 'accColor',
}
const SLOTS: Slot[] = ['hat', 'top', 'outer', 'bottom', 'shoes', 'acc', 'hair']
// 얼굴 쪽 아이템은 고르는 칸에 얼굴만 크게
const HEAD_SLOTS: Slot[] = ['hat', 'hair']

export function Dresser({ value, onChange, onDone }: { value: Outfit; onChange: (o: Outfit) => void; onDone: () => void }) {
  const [slot, setSlot] = useState<Slot>('hat')
  const [view, setView] = useState<'front' | 'back'>('front')
  const set = (patch: Partial<Outfit>) => onChange({ ...value, ...patch })
  const colors = slot === 'hair' ? HAIR_COLORS : CLOTH_COLORS
  // 액세서리: 최대 3개 (같은 자리끼리는 바뀜). 색은 마지막에 고른 것에 칠함
  const accs = accList(value)
  const [accActive, setAccActive] = useState<string | null>(accs[accs.length - 1]?.id ?? null)
  const [accMsg, setAccMsg] = useState('')
  const pickAcc = (id: string) => {
    const next = toggleAcc(value, id, value.accColor)
    if (!next) { setAccMsg(`액세서리는 ${MAX_ACC}개까지예요. 하나를 빼고 골라 주세요`); return }
    setAccMsg('')
    onChange(next)
    const after = accList(next)
    setAccActive(after.some((x) => x.id === id) ? id : after[after.length - 1]?.id ?? null)
  }
  const paintAcc = (c: string) => onChange(withAccs(value, accs.map((x) => (x.id === accActive ? { ...x, color: c } : x))))
  return (
    <div className="sheet-backdrop">
      <div className="sheet dresser">
        <div className="sheet-head">
          <h2 className="jua">캐릭터 꾸미기</h2>
          <button className="x" onClick={onDone}>완료</button>
        </div>
        <div className="dresser-top">
          <div className="dresser-preview">
            <Character outfit={value} view={view} size={110} title="내 캐릭터" />
            <button className="mini-btn" onClick={() => setView(view === 'front' ? 'back' : 'front')}>{view === 'front' ? '뒷모습' : '앞모습'}</button>
          </div>
          <div className="dresser-skin">
            <span className="muted">성별</span>
            <div className="gender-pick" role="radiogroup" aria-label="성별">
              {([['m', '남자'], ['f', '여자']] as const).map(([g, l]) => (
                <button key={g} role="radio" aria-checked={(value.gender ?? 'm') === g} className={(value.gender ?? 'm') === g ? 'on' : ''} onClick={() => onChange(withGender(value, g))}>{l}</button>
              ))}
            </div>
          </div>
          <div className="dresser-skin">
            <span className="muted">피부</span>
            <div className="swatches">
              {SKINS.map((c) => <button key={c} aria-label={`피부색 ${c}`} aria-pressed={value.skin === c} className={value.skin === c ? 'on' : ''} style={{ background: c }} onClick={() => set({ skin: c })} />)}
            </div>
            <button className="mini-btn" onClick={() => onChange(randomize(value.gender ?? 'm'))}>아무거나 입기</button>
          </div>
        </div>
        <div className="tabs scroll-tabs" role="tablist">
          {SLOTS.map((k) => <button key={k} role="tab" aria-selected={slot === k} className={slot === k ? 'on' : ''} onClick={() => setSlot(k)}>{SLOT_NAMES[k]}</button>)}
        </div>
        <div className="dresser-items">
          {ITEMS[slot].map((it) => {
            const on = slot === 'acc' ? (it.id === 'none' ? !accs.length : accs.some((x) => x.id === it.id)) : value[slot] === it.id
            const preview = slot === 'acc' ? (it.id === 'none' ? withAccs(value, []) : withAccs(value, [{ id: it.id, color: value.accColor }])) : { ...value, [slot]: it.id }
            return (
              <button key={it.id} className={on ? 'on' : ''} aria-pressed={on} onClick={() => (slot === 'acc' ? pickAcc(it.id) : set({ [slot]: it.id } as Partial<Outfit>))}>
                {HEAD_SLOTS.includes(slot)
                  ? <Character outfit={preview} size={48} crop="head" />
                  : <Character outfit={preview} size={34} />}
                <span>{it.name}</span>
              </button>
            )
          })}
        </div>
        {slot === 'acc' && (
          <p className="muted">액세서리는 {MAX_ACC}개까지 같이 할 수 있어요 (안경·마스크처럼 같은 자리는 하나만). {accs.length > 1 && '색을 칠할 것: '}
            {accs.length > 1 && accs.map((x) => <button key={x.id} className={`mini-btn${accActive === x.id ? ' on' : ''}`} onClick={() => setAccActive(x.id)}>{ITEMS.acc.find((it) => it.id === x.id)?.name}</button>)}
          </p>
        )}
        {accMsg && slot === 'acc' && <p className="bad">{accMsg}</p>}
        {slot === 'acc' && accActive && accs.some((x) => x.id === accActive) && (
          <div className="swatches">
            {colors.map((c) => {
              const on = accs.find((x) => x.id === accActive)?.color === c
              return <button key={c} aria-label={`색 ${c}`} aria-pressed={on} className={on ? 'on' : ''} style={{ background: c }} onClick={() => paintAcc(c)} />
            })}
          </div>
        )}
        {slot !== 'acc' && !(value[slot] === 'none') && (
          <div className="swatches">
            {colors.map((c) => (
              <button key={c} aria-label={`색 ${c}`} aria-pressed={value[COLOR_KEY[slot]] === c} className={value[COLOR_KEY[slot]] === c ? 'on' : ''} style={{ background: c }} onClick={() => set({ [COLOR_KEY[slot]]: c } as Partial<Outfit>)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function randomize(gender: 'm' | 'f' = 'm'): Outfit {
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
  const item = (s: Slot) => pick(ITEMS[s]).id
  return withGender({
    gender, skin: pick(SKINS), hair: item('hair'), hairColor: pick(HAIR_COLORS),
    hat: item('hat'), hatColor: pick(CLOTH_COLORS), top: item('top'), topColor: pick(CLOTH_COLORS),
    outer: item('outer'), outerColor: pick(CLOTH_COLORS), bottom: item('bottom'), bottomColor: pick(CLOTH_COLORS),
    shoes: item('shoes'), shoesColor: pick(CLOTH_COLORS), acc: item('acc'), accColor: pick(CLOTH_COLORS),
  }, gender)
}
