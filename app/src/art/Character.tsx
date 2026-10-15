// 캐릭터 그림 (SVG). 기본 버전 — 아트 단계에서 다시 그린다 (docs/12-art.md)
import type { Outfit } from '../engine/outfit'

interface Props { outfit: Outfit; view?: 'front' | 'back'; size?: number; title?: string; age?: number }

const darken = (hex: string, amt = 0.18) => {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.max(0, Math.round(v * (1 - amt)))
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`
}

// 나이에 따라 모습이 바뀜: 아기(배냇저고리·기저귀) → 유치원생(노란 모자·가방) → 학생(교복·책가방) → 청년·중년(내 옷, 중년은 흰머리 섞임) → 노인(흰머리·지팡이)
type Extra = 'baby' | 'kinder' | 'student' | null
function aged(o: Outfit, age?: number): { o: Outfit; scale: number; cane: boolean; extra: Extra } {
  if (age === undefined) return { o, scale: 1, cane: false, extra: null }
  if (age < 4) return { o: { ...o, hair: 'buzz', hat: 'none', top: 'tee', topColor: '#CFE7F5', outer: 'none', bottom: 'shorts', bottomColor: '#FFFFFF', acc: 'none' }, scale: 0.55, cane: false, extra: 'baby' }
  if (age < 8) return { o: { ...o, hat: 'cap', hatColor: '#F2C230', top: 'tee', outer: 'none', bottom: 'shorts', acc: 'none' }, scale: 0.68, cane: false, extra: 'kinder' }
  if (age < 20) {
    const skirt = o.bottom === 'skirt' || o.top === 'dress'
    return { o: { ...o, hat: 'none', top: 'shirt', topColor: '#F4EBD6', outer: 'jacket', outerColor: '#1E2A44', bottom: skirt ? 'skirt' : 'pants', bottomColor: '#2C3A5C', acc: 'none' }, scale: age < 14 ? 0.8 : 0.9, cane: false, extra: 'student' }
  }
  const hairColor = age >= 60 ? '#DCDCDC' : age >= 45 ? mix(o.hairColor, '#C8C8C8', 0.4) : o.hairColor
  return { o: { ...o, hairColor }, scale: 1, cane: age >= 65, extra: null }
}
const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const c = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t)
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`
}

export function Character({ outfit, view = 'front', size = 100, title, age }: Props) {
  const { o, scale, cane, extra } = aged(outfit, age)
  const back = view === 'back'
  const dress = o.top === 'dress'
  const longSleeve = o.top === 'hoodie' || o.top === 'shirt'
  const skirtLike = o.bottom === 'skirt' || dress
  const ink = '#2A2118'
  return (
    <svg viewBox="0 0 100 200" width={size} height={size * 2} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <g transform={`translate(${50 - 50 * scale} ${200 - 200 * scale}) scale(${scale})`}>
      {/* 다리와 하의 */}
      {(skirtLike || o.bottom === 'shorts') && (
        <g fill={o.skin}>
          <rect x="35" y="130" width="12" height="54" rx="5" />
          <rect x="53" y="130" width="12" height="54" rx="5" />
        </g>
      )}
      {!dress && (o.bottom === 'pants' || o.bottom === 'jeans') && (
        <g fill={o.bottomColor}>
          <rect x="33" y="112" width="16" height="74" rx="6" />
          <rect x="51" y="112" width="16" height="74" rx="6" />
          {o.bottom === 'jeans' && <path d="M41 118v62M59 118v62" stroke="#F4EBD6" strokeWidth="1.5" strokeDasharray="3 3" />}
        </g>
      )}
      {!dress && o.bottom === 'shorts' && (
        <g fill={o.bottomColor}><rect x="33" y="112" width="16" height="28" rx="6" /><rect x="51" y="112" width="16" height="28" rx="6" /></g>
      )}
      {!dress && o.bottom === 'skirt' && <path d="M34 110h32l8 40H26z" fill={o.bottomColor} />}

      {/* 신발 */}
      <g fill={o.shoesColor} stroke={darken(o.shoesColor, 0.35)} strokeWidth="1.5">
        {o.shoes === 'boots' ? (
          <><rect x="32" y="166" width="17" height="24" rx="4" /><rect x="51" y="166" width="17" height="24" rx="4" /></>
        ) : o.shoes === 'sandals' ? (
          <><rect x="31" y="186" width="19" height="6" rx="3" /><rect x="50" y="186" width="19" height="6" rx="3" /></>
        ) : (
          <><rect x="30" y="181" width="20" height="11" rx={o.shoes === 'loafers' ? 3 : 5} /><rect x="50" y="181" width="20" height="11" rx={o.shoes === 'loafers' ? 3 : 5} /></>
        )}
        {o.shoes === 'sneakers' && <path d="M32 186h16M52 186h16" stroke="#fff" strokeWidth="2" />}
      </g>

      {/* 팔 */}
      <g fill={longSleeve ? o.topColor : o.skin}>
        <rect x="18" y="72" width="12" height="46" rx="6" />
        <rect x="70" y="72" width="12" height="46" rx="6" />
      </g>
      {!longSleeve && <g fill={o.topColor}><rect x="18" y="70" width="12" height="16" rx="6" /><rect x="70" y="70" width="12" height="16" rx="6" /></g>}
      <g fill={o.skin}><circle cx="24" cy="118" r="6" /><circle cx="76" cy="118" r="6" /></g>

      {/* 상의 */}
      {dress ? (
        <path d="M30 70q20-8 40 0l4 44 10 42H16l10-42z" fill={o.topColor} />
      ) : (
        <rect x="28" y="66" width="44" height="52" rx="12" fill={o.topColor} />
      )}
      {o.top === 'stripe' && <g stroke="#F4EBD6" strokeWidth="4" opacity="0.85"><path d="M29 80h42M29 92h42M29 104h42" /></g>}
      {o.top === 'shirt' && !back && <path d="M50 68v48M44 68l6 8 6-8" stroke={darken(o.topColor)} strokeWidth="2" fill="none" />}
      {o.top === 'hoodie' && (back
        ? <path d="M34 66q16 14 32 0v-4q-16 10-32 0z" fill={darken(o.topColor)} />
        : <path d="M44 72l-2 14M56 72l2 14" stroke="#F4EBD6" strokeWidth="2" />)}

      {/* 겉옷 */}
      {o.outer !== 'none' && (
        <g fill={o.outerColor}>
          {o.outer !== 'vest' && <><rect x="16" y="70" width="14" height="46" rx="6" /><rect x="70" y="70" width="14" height="46" rx="6" /></>}
          {back ? (
            <rect x="27" y="64" width="46" height={o.outer === 'coat' ? 86 : 56} rx="12" />
          ) : (
            <>
              <path d={`M28 66h14v${o.outer === 'coat' ? 84 : 52}H28z`} />
              <path d={`M58 66h14v${o.outer === 'coat' ? 84 : 52}H58z`} />
            </>
          )}
          {o.outer === 'cardigan' && !back && <g fill="#F4EBD6"><circle cx="40" cy="84" r="1.8" /><circle cx="40" cy="96" r="1.8" /><circle cx="40" cy="108" r="1.8" /></g>}
        </g>
      )}

      {/* 목·머리 */}
      <rect x="44" y="58" width="12" height="12" fill={o.skin} />
      <circle cx="50" cy="40" r="25" fill={o.skin} />
      {!back && (
        <g>
          <circle cx="41" cy="42" r="3" fill={ink} />
          <circle cx="59" cy="42" r="3" fill={ink} />
          <path d="M44 52q6 5 12 0" stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="35" cy="50" r="4" fill="#F09A8A" opacity="0.5" />
          <circle cx="65" cy="50" r="4" fill="#F09A8A" opacity="0.5" />
        </g>
      )}

      {/* 머리카락 */}
      <Hair o={o} back={back} />

      {/* 액세서리 */}
      {o.acc === 'glasses' && !back && <g stroke={ink} strokeWidth="2" fill="none"><circle cx="41" cy="42" r="7" /><circle cx="59" cy="42" r="7" /><path d="M48 42h4" /></g>}
      {o.acc === 'sunglasses' && !back && <g fill={ink}><rect x="32" y="37" width="16" height="10" rx="4" /><rect x="52" y="37" width="16" height="10" rx="4" /><rect x="47" y="40" width="6" height="2" /></g>}
      {o.acc === 'scarf' && <g fill={o.accColor}><rect x="34" y="60" width="32" height="10" rx="5" /><rect x={back ? 56 : 54} y="64" width="9" height="26" rx="4" /></g>}
      {o.acc === 'necklace' && !back && <path d="M40 68q10 12 20 0" stroke="#E2B85C" strokeWidth="2.5" fill="none" />}
      {o.acc === 'bag' && (back
        ? <rect x="30" y="72" width="40" height="40" rx="9" fill={o.accColor} stroke={darken(o.accColor, 0.3)} strokeWidth="2" />
        : <g><path d="M30 68l40 44" stroke={darken(o.accColor, 0.3)} strokeWidth="3" /><rect x="64" y="106" width="16" height="14" rx="3" fill={o.accColor} /></g>)}
      {o.acc === 'headphones' && <g fill="none" stroke={o.accColor} strokeWidth="4"><path d="M25 42a25 25 0 0 1 50 0" /><rect x="20" y="38" width="8" height="14" rx="3" fill={o.accColor} /><rect x="72" y="38" width="8" height="14" rx="3" fill={o.accColor} /></g>}

      {/* 모자 */}
      <Hat o={o} back={back} />
      {/* 가방: 뒤에서는 가방 전체, 앞에서는 멜빵만 */}
      {(extra === 'kinder' || extra === 'student') && (back
        ? <g><rect x="31" y="74" width="38" height={extra === 'kinder' ? 34 : 44} rx="9" fill={extra === 'kinder' ? '#F2C230' : outfit.topColor} stroke={darken(extra === 'kinder' ? '#F2C230' : outfit.topColor, 0.3)} strokeWidth="2" /><rect x="38" y="90" width="24" height="10" rx="3" fill="rgba(255,255,255,0.35)" /></g>
        : <path d="M36 68v40M64 68v40" stroke={extra === 'kinder' ? '#F2C230' : outfit.topColor} strokeWidth="4" />)}
      {extra === 'student' && !back && <path d="M44 68l6 10 6-10z" fill="#C2452D" />}
      {extra === 'baby' && !back && <g><circle cx="50" cy="56" r="5" fill="#F3A3C0" /><circle cx="50" cy="56" r="2" fill="#fff" /></g>}
      {extra === 'baby' && back && <path d="M30 128q20 10 40 0v10q-20 8-40 0z" fill="#E8E8E8" />}
      {cane && <path d="M86 112v80M86 112q0-8 8-8" stroke="#7A5232" strokeWidth="5" fill="none" strokeLinecap="round" />}
      </g>
    </svg>
  )
}

function Hair({ o, back }: { o: Outfit; back: boolean }) {
  const c = o.hairColor
  if (o.hair === 'buzz') return <path d="M26 36a24 24 0 0 1 48 0q-24-8-48 0z" fill={c} opacity="0.85" />
  if (back) {
    return (
      <g fill={c}>
        <circle cx="50" cy="40" r="26" />
        {o.hair === 'long' && <rect x="26" y="40" width="48" height="36" rx="12" />}
        {o.hair === 'pony' && <path d="M46 58q4 26 8 0z" />}
        {o.hair === 'bun' && <circle cx="50" cy="12" r="10" />}
        {o.hair === 'curly' && <><circle cx="28" cy="40" r="8" /><circle cx="72" cy="40" r="8" /><circle cx="36" cy="58" r="7" /><circle cx="64" cy="58" r="7" /></>}
      </g>
    )
  }
  return (
    <g fill={c}>
      {o.hair === 'long' && <><rect x="22" y="34" width="12" height="40" rx="6" /><rect x="66" y="34" width="12" height="40" rx="6" /></>}
      {o.hair === 'curly' && <><circle cx="27" cy="32" r="9" /><circle cx="73" cy="32" r="9" /><circle cx="38" cy="18" r="10" /><circle cx="62" cy="18" r="10" /><circle cx="50" cy="15" r="10" /></>}
      {o.hair === 'bun' && <circle cx="50" cy="12" r="10" />}
      {o.hair === 'pony' && <path d="M72 30q14 10 6 34q-4-14-10-20z" />}
      <path d="M25 40a25 25 0 0 1 50 0q-8-14-25-12q-17-2-25 12z" />
    </g>
  )
}

function Hat({ o, back }: { o: Outfit; back: boolean }) {
  const c = o.hatColor
  switch (o.hat) {
    case 'cap': return <g fill={c}><path d="M24 30a26 22 0 0 1 52 0z" />{!back && <rect x="44" y="26" width="38" height="7" rx="3" />}</g>
    case 'beanie': return <g fill={c}><path d="M24 32a26 26 0 0 1 52 0z" /><rect x="23" y="28" width="54" height="9" rx="4" fill={darken(c)} /><circle cx="50" cy="6" r="5" /></g>
    case 'bucket': return <g fill={c}><path d="M30 28q20-20 40 0z" /><rect x="18" y="26" width="64" height="8" rx="4" /></g>
    case 'ribbon': return <g fill={c}><path d="M58 18l14-8v18zM58 18l-2 12 12 2z" /><circle cx="60" cy="18" r="4" /></g>
    case 'crown': return <path d="M30 26l6-16 8 10 6-14 6 14 8-10 6 16z" fill="#E2B85C" stroke="#A8692E" strokeWidth="1.5" />
    default: return null
  }
}
