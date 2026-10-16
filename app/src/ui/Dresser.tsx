import { useState } from 'react'
import { Character } from '../art/Character'
import { CLOTH_COLORS, HAIR_COLORS, ITEMS, SKINS, SLOT_NAMES, withGender, type Outfit, type Slot } from '../engine/outfit'

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
            const on = value[slot] === it.id
            return (
              <button key={it.id} className={on ? 'on' : ''} aria-pressed={on} onClick={() => set({ [slot]: it.id } as Partial<Outfit>)}>
                {HEAD_SLOTS.includes(slot)
                  ? <Character outfit={{ ...value, [slot]: it.id }} size={48} crop="head" />
                  : <Character outfit={{ ...value, [slot]: it.id }} size={34} />}
                <span>{it.name}</span>
              </button>
            )
          })}
        </div>
        {!(value[slot] === 'none') && (
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
