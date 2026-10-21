import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { preSignUp } from './auth/pre-sign-up/resource'
import { data } from './data/resource'

// AWS에 만드는 것: 로그인(Cognito) + 가입 확인 함수(Lambda) + 방·행동 데이터(AppSync + DynamoDB)
const backend = defineBackend({ auth, data, preSignUp })

// 방·행동 기록은 expiresAt 시각이 지나면 DynamoDB가 알아서 지움 (보통 하루 이틀 안에)
const { amplifyDynamoDbTables } = backend.data.resources.cfnResources
for (const t of ['Room', 'Action']) amplifyDynamoDbTables[t].timeToLiveAttribute = { attributeName: 'expiresAt', enabled: true }

// 이메일 대신 게임 아이디로 로그인 (대소문자 구별 안 함), 이메일은 받지 않음
const { cfnUserPool } = backend.auth.resources.cfnResources
cfnUserPool.usernameAttributes = []
cfnUserPool.autoVerifiedAttributes = []
cfnUserPool.userAttributeUpdateSettings = { attributesRequireVerificationBeforeUpdate: [] } // 이메일 인증을 안 하므로 같이 꺼야 함
cfnUserPool.usernameConfiguration = { caseSensitive: false }
cfnUserPool.schema = [{ name: 'email', attributeDataType: 'String', required: false, mutable: true }]
// 비밀번호: 6자 이상, 글자 종류 강제 없음 (한글·대문자 막기는 화면에서)
cfnUserPool.policies = {
  passwordPolicy: { minimumLength: 6, requireLowercase: false, requireUppercase: false, requireNumbers: false, requireSymbols: false },
}
