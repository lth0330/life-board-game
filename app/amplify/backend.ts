import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'

// AWS에 만드는 것: 로그인(Cognito) + 방·행동 데이터(AppSync + DynamoDB)
defineBackend({ auth, data })
