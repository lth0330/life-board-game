// 계정 저장 (AWS): 옷차림 + 혼자 하던 게임. AWS 코드가 커서 로그인할 때만 내려받음 (App.tsx에서 import())
import { DEFAULT_OUTFIT, cleanOutfit, type Outfit } from '../engine/outfit'
import { client, currentMe, finishGoogle, getNotice, googleLogin, googleReady, logoutOnline, parse, setNick, type Me } from '../online/client'
import { loadLocalGame, newerSave, type Profile, type SaveSlot } from '../storage'

export { finishGoogle, getNotice, googleLogin, googleReady, logoutOnline, setNick }

// 로그인한 사람의 계정 저장 칸을 불러옴 (없으면 만듦). 하던 게임은 이 기기 저장과 비교해 더 나중 것
export async function openAccount(me: Me): Promise<{ profile: Profile; slot: SaveSlot | null }> {
  const r = await client.models.Profile.list()
  let row = r.data[0]
  if (!row) {
    const c = await client.models.Profile.create({ outfit: JSON.stringify(DEFAULT_OUTFIT) })
    if (!c.data) throw new Error('계정 저장 칸을 만들지 못했어요')
    row = c.data
  }
  const outfit = cleanOutfit(parse<Outfit | null>(row.outfit, null))
  const slot = newerSave(loadLocalGame(me.loginId), parse<SaveSlot | null>(row.save, null))
  void client.models.Profile.update({ id: row.id, lastSeen: new Date().toISOString() }).catch(() => {}) // 최근 접속 (관리자 화면)
  return { profile: { ...me, outfit, cloudId: row.id }, slot }
}

// 시작할 때: 예전에 로그인했으면 그대로 이어서 (로그인이 풀렸으면 null)
export async function restoreAccount() {
  const me = await currentMe()
  return me ? openAccount(me) : null
}

export async function saveCloud(cloudId: string, patch: { outfit?: Outfit; save?: SaveSlot | null }) {
  await client.models.Profile.update({
    id: cloudId,
    ...(patch.outfit ? { outfit: JSON.stringify(patch.outfit) } : {}),
    ...(patch.save !== undefined ? { save: patch.save ? JSON.stringify(patch.save) : null } : {}),
  })
}
