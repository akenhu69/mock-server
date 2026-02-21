import type { MCDBridgeChannel } from '~/types/mcd-bridge.d.ts'
import { getMockManager } from '~/utils/mock-manager'
import mockGmalError from './data/gmalError.json'
/**
 * 模擬使用者資訊
 */
interface MockUser {
  recaptchaScore: number
  mcdonaldsId: string
  firstname: string
  lastname: string
  email: string
  deviceId: string
  deviceToken: string
}

/**
 * 控制標誌
 */
interface ControlFlag {
  isLogin?: boolean
  // User API
  getUserError?: any
  getUserCustom?: any
  promptLoginError?: any
  promptLoginCustom?: any
  addTagsError?: any
  addTagsCustom?: any
  removeTagsError?: any
  removeTagsCustom?: any
  getTagsError?: any
  getTagsCustom?: any
  getAuthCodeError?: any
  getAuthCodeCustom?: any
  // Deals API
  getPointsError?: any
  getPointsCustom?: any
  burnPointsError?: any
  burnPointsCustom?: any
  // Location API
  locationError?: any
  locationCustom?: any
  // Scanner API
  scannerError?: any
  scannerCustom?: any
  // Offer Activation API
  addPointError?: any
  addPointCustom?: any
  activateRewardError?: any
  activateRewardCustom?: any
  // Other
  androidError?: any
  otherError?: any
}

/**
 * 基礎指令介面
 */
interface BaseCommand {
  [key: string]: any
}

/**
 * 使用者指令
 */
interface UserCommand extends BaseCommand {
  getuser?: boolean
  promptlogin?: boolean
  getTags?: boolean
  addTags?: string[]
  removeTags?: string[]
  getAuthCode?: boolean
  clientId?: string
}

/**
 * 點數指令
 */
interface DealCommand extends BaseCommand {
  getPoints?: boolean
  burnPoints?: boolean
  points?: number
}

/**
 * 系統指令
 */
interface SystemCommand extends BaseCommand {
  getMarketId?: boolean
  getSelectedLanguage?: boolean
  getDeviceId?: boolean
  getVersion?: boolean
  getKochavaId?: boolean
  appOrientation?: string
  fullscreen?: boolean
  hideCloseButton?: boolean
  hideNavigationbar?: boolean
  hideStatusbar?: boolean
  hideTabbar?: boolean
}

/**
 * 掃描器指令
 */
interface ScannerCommand extends BaseCommand {
  scanner?: boolean
  mode?: 'qr' | 'barcode' | 'OCR'
  tooltip?: string
  checksumAlgorithm?: string
  regex?: string
  substitute?: Array<{ target: string; replacement: string }>
  manualButtonText?: string
}

/**
 * AppBar 指令
 */
interface AppBarCommand extends BaseCommand {
  appBarTitle?: string
  appBarBackButtonName?: string
  getAppBarTitle?: boolean
  getBackButtonName?: boolean
}

/**
 * 位置指令
 */
interface LocationCommand extends BaseCommand {
  continuous?: boolean
}

/**
 * 優惠券啟用指令
 */
interface OfferActivationCommand extends BaseCommand {
  loyaltyId?: number
  rewardId?: number
  autoActivate?: boolean
}

/**
 * 回呼函式型別
 */
type Callback<T = any> = (data: T) => void

/**
 * 事件型別
 */
type EventType = 'data' | 'error' | 'done'

/**
 * 橋接器名稱型別
 */
type BridgeName = 'user' | 'deals' | 'offerActivation' | 'system' | 'scanner' | 'appBar' | 'location' | string

const mockUser: MockUser = {
  recaptchaScore: 0,
  mcdonaldsId: 'bearer aaa63c1593716072916a5d7ad3acf7cd21109425ab4c3863fef5262f89a306edf4',
  firstname: 'yuma',
  lastname: 'shimizu',
  email: 'yuma.shimizu_0310@apegroup.com',
  deviceId: '1a88a79d581a8d4f',
  deviceToken: 'bearer a63c1593716072916a5d7ad3acf7cd21109425ab4c3863fef5262f89a306edf4'
}

// 模擬點數資料
const mockDeal = {
  points: 1500 // 預設給用戶 1500 點
}

// 模擬用戶標籤
let mockUserTags: string[] = ['profiling', 'mobile-user']

// 模擬 AppBar 狀態
const mockAppBarState = {
  appBarTitle: '麥粉市集',
  appBarBackButtonName: '返回'
}

class UserBridge implements MCDBridgeChannel {
  command: UserCommand = {}

  send(command: UserCommand): this {
    this.command = command
    return this
  }

  on(event: EventType, callback: Callback): void {
    const controlFlags = getControlFlag()
    const { isLogin } = controlFlags

    switch (event) {
      case 'data':
        if (this.command.getuser) {
          if (controlFlags.getUserError) {
            return
          }
          if (controlFlags.getUserCustom) {
            callback(controlFlags.getUserCustom)
            return
          }
          if (isLogin) {
            callback(mockUser)
          }
        } else if (this.command.promptlogin) {
          if (controlFlags.promptLoginError) {
            return
          }
          if (controlFlags.promptLoginCustom) {
            setTimeout(() => callback(controlFlags.promptLoginCustom), 1000)
            return
          }
          // 模擬登入流程
          setTimeout(() => {
            callback(mockUser)
          }, 1000)
        } else if (this.command.getTags) {
          if (controlFlags.getTagsError) {
            return
          }
          if (controlFlags.getTagsCustom) {
            callback(controlFlags.getTagsCustom)
            return
          }
          if (isLogin) {
            callback({ tags: mockUserTags })
          }
        } else if (this.command.addTags) {
          if (controlFlags.addTagsError) {
            return
          }
          if (controlFlags.addTagsCustom) {
            callback(controlFlags.addTagsCustom)
            return
          }
          // 模擬添加標籤
          if (this.command.addTags) {
            mockUserTags = [...new Set([...mockUserTags, ...this.command.addTags])]
            callback({ success: true })
          }
        } else if (this.command.removeTags) {
          if (controlFlags.removeTagsError) {
            return
          }
          if (controlFlags.removeTagsCustom) {
            callback(controlFlags.removeTagsCustom)
            return
          }
          // 模擬移除標籤
          if (this.command.removeTags) {
            mockUserTags = mockUserTags.filter(tag => !this.command.removeTags!.includes(tag))
            callback({ success: true })
          }
        } else if (this.command.getAuthCode) {
          if (controlFlags.getAuthCodeError) {
            return
          }
          if (controlFlags.getAuthCodeCustom) {
            callback(controlFlags.getAuthCodeCustom)
            return
          }
          if (this.command.clientId) {
            callback({ authCode: 'mock_auth_code_12345' })
          }
        }
        break
      case 'error':
        if (this.command.getuser && controlFlags.getUserError) {
          callback(controlFlags.getUserError)
        } else if (this.command.getuser && !isLogin) {
          callback({ code: 404, message: 'User not logged in' })
        } else if (this.command.promptlogin && controlFlags.promptLoginError) {
          callback(controlFlags.promptLoginError)
        } else if (this.command.getTags && controlFlags.getTagsError) {
          callback(controlFlags.getTagsError)
        } else if (this.command.addTags && controlFlags.addTagsError) {
          callback(controlFlags.addTagsError)
        } else if (this.command.removeTags && controlFlags.removeTagsError) {
          callback(controlFlags.removeTagsError)
        } else if (this.command.getAuthCode && controlFlags.getAuthCodeError) {
          callback(controlFlags.getAuthCodeError)
        } else if (this.command.getAuthCode && !this.command.clientId) {
          callback({ code: 402, message: 'Client ID not provided' })
        }
        break
      case 'done':
        break
    }
  }

  off(event: EventType, callback: Callback): void {
    // 模擬實作
  }
}

class DealBridge implements MCDBridgeChannel {
  command: DealCommand = {}

  send(command: DealCommand): this {
    this.command = command
    return this
  }

  on(event: EventType, callback: Callback): void {
    const controlFlags = getControlFlag()

    switch (event) {
      case 'data':
        if (this.command.getPoints) {
          if (controlFlags.getPointsError) {
            return
          }
          if (controlFlags.getPointsCustom) {
            callback(controlFlags.getPointsCustom)
            return
          }
          return callback(mockDeal)
        } else if (this.command.burnPoints) {
          if (controlFlags.burnPointsError) {
            return
          }
          if (controlFlags.burnPointsCustom) {
            callback(controlFlags.burnPointsCustom)
            return
          }
          const delta = typeof this.command.points === 'number' ? this.command.points : 0
          mockDeal.points = Math.max(0, mockDeal.points + delta)
          return callback({ success: true })
        }
        break
      case 'error':
        if (this.command.getPoints && controlFlags.getPointsError) {
          callback(controlFlags.getPointsError)
        } else if (this.command.burnPoints && controlFlags.burnPointsError) {
          callback(controlFlags.burnPointsError)
        }
        return
      case 'done':
        return
    }
  }

  off(event: EventType, callback: Callback): void {
    // 模擬實作
  }
}

class SystemBridge implements MCDBridgeChannel {
  command: SystemCommand = {}

  send(command: SystemCommand): this {
    this.command = command
    return this
  }

  on(event: EventType, callback: Callback): void {
    switch (event) {
      case 'data':
        if (this.command.getMarketId) {
          callback({ marketId: 'TW' })
        } else if (this.command.getSelectedLanguage) {
          callback({ language: 'zh-TW' })
        } else if (this.command.getDeviceId) {
          callback({ deviceId: mockUser.deviceId })
        } else if (this.command.getVersion) {
          callback({
            version: '2.1.0',
            build: '240115',
            platform: 'ios'
          })
        } else if (this.command.getKochavaId) {
          callback({ kochavaId: 'mock_kochava_id_12345' })
        } else if (this.command.appOrientation) {
          // 模擬設定方向
          callback({ success: true })
        } else if (this.command.fullscreen !== undefined) {
          // 模擬全螢幕設定
          callback({ success: true })
        } else if (this.command.hideCloseButton !== undefined) {
          callback({ success: true })
        } else if (this.command.hideNavigationbar !== undefined) {
          callback({ success: true })
        } else if (this.command.hideStatusbar !== undefined) {
          callback({ success: true })
        } else if (this.command.hideTabbar !== undefined) {
          callback({ success: true })
        }
        break
      case 'error':
        break
      case 'done':
        break
    }
  }

  off(event: EventType, callback: Callback): void {
    // 模擬實作
  }
}

class ScannerBridge implements MCDBridgeChannel {
  command: ScannerCommand = {}

  send(command: ScannerCommand): this {
    this.command = command
    return this
  }

  on(event: EventType, callback: Callback): void {
    const controlFlags = getControlFlag()

    switch (event) {
      case 'data':
        if (this.command.scanner) {
          if (controlFlags.scannerError) {
            return
          }
          // 模擬掃描結果
          setTimeout(() => {
            const mode = this.command.mode || 'qr'
            let scannedData = ''

            switch (mode) {
              case 'qr':
                scannedData = 'https://www.mcdonalds.com.tw/mock-qr-code'
                break
              case 'barcode':
                scannedData = '1234567890123'
                break
              case 'OCR':
                scannedData = 'MOCK TEXT 12345'
                break
            }

            callback({ scannedData })
          }, 2000) // 模擬掃描時間
        }
        break
      case 'error':
        if (controlFlags.scannerError) {
          callback(controlFlags.scannerError)
        } else if (Math.random() > 0.8) {
          // 模擬用戶取消掃描
          callback({ code: 100, message: 'User cancelled scanning' })
        }
        break
      case 'done':
        break
    }
  }

  off(event: EventType, callback: Callback): void {
    // 模擬實作
  }
}

class AppBarBridge implements MCDBridgeChannel {
  command: AppBarCommand = {}

  send(command: AppBarCommand): this {
    this.command = command
    return this
  }

  on(event: EventType, callback: Callback): void {
    switch (event) {
      case 'data':
        if (this.command.appBarTitle !== undefined) {
          // 設定標題
          mockAppBarState.appBarTitle = this.command.appBarTitle
          callback({ success: true })
        } else if (this.command.appBarBackButtonName !== undefined) {
          // 設定返回按鈕名稱
          mockAppBarState.appBarBackButtonName = this.command.appBarBackButtonName
          callback({ success: true })
        } else if (this.command.getAppBarTitle) {
          // 取得標題
          callback({ appBarTitle: mockAppBarState.appBarTitle })
        } else if (this.command.getBackButtonName) {
          // 取得返回按鈕名稱
          callback({ appBarBackButtonName: mockAppBarState.appBarBackButtonName })
        }
        break
      case 'error':
        break
      case 'done':
        break
    }
  }

  off(event: EventType, callback: Callback): void {
    // 模擬實作
  }
}

class LocationBridge implements MCDBridgeChannel {
  command: LocationCommand = {}

  send(command: LocationCommand): this {
    this.command = command
    return this
  }

  on(event: EventType, callback: Callback): void {
    const controlFlags = getControlFlag()

    switch (event) {
      case 'data':
        if (this.command.continuous !== undefined) {
          if (controlFlags.locationError) {
            return
          }
          // 模擬地理位置
          const mockLocation = {
            latitude: 25.033,
            longitude: 121.5654,
            speed: 0,
            time: Date.now()
          }
          callback(mockLocation)
        }
        break
      case 'error':
        if (controlFlags.locationError) {
          callback(controlFlags.locationError)
        } else if (Math.random() > 0.9) {
          // 模擬位置權限錯誤
          callback({ code: 100, message: 'Location service not available' })
        }
        break
      case 'done':
        break
    }
  }

  off(event: EventType, callback: Callback): void {
    // 模擬實作
  }
}

class OfferActivationBridge implements MCDBridgeChannel {
  command: OfferActivationCommand = {}

  send(command: OfferActivationCommand): this {
    this.command = command
    return this
  }

  on(event: EventType, callback: Callback): void {
    const controlFlags = getControlFlag()

    switch (event) {
      case 'data':
        if (this.command.loyaltyId && this.command.rewardId) {
          if (controlFlags.activateRewardError) {
            return
          }
          return callback({ success: true })
        }
        break
      case 'error':
        if (controlFlags.activateRewardError) {
          callback(controlFlags.activateRewardError)
        } else if (controlFlags.addPointError) {
          callback(controlFlags.addPointError)
        }
        return
      case 'done':
        return
    }
  }

  off(event: EventType, callback: Callback): void {
    // 模擬實作
  }
}

/**
 * 檢查 Bridge 是否應該被禁用
 */
function isBridgeDisabled(): boolean {
  if (typeof window === 'undefined') return false

  const mockManager = getMockManager()
  const bridgeConfig = mockManager.getMcdBridge('bridge-not-ready')

  return bridgeConfig?.enabled === true
}

export const mockMcdBridge = () => {
  if (isBridgeDisabled()) {
    return null
  }
  return {
    bridge: {
      message: (bridgeName: BridgeName): MCDBridgeChannel => {
        switch (bridgeName) {
          case 'user':
            return new UserBridge()
          case 'deals':
            return new DealBridge()
          case 'system':
            return new SystemBridge()
          case 'scanner':
            return new ScannerBridge()
          case 'appBar':
            return new AppBarBridge()
          case 'location':
            return new LocationBridge()
          case 'offerActivation':
            return new OfferActivationBridge()
          default:
            throw new Error(`不支援的橋接器名稱: ${bridgeName}`)
        }
      }
    }
  }
}

function getControlFlag(): ControlFlag {
  const route = useRoute()

  // 輔助函數：獲取查詢參數值
  const getQueryValue = (key: string) => {
    const value = route.query[key]
    return Array.isArray(value) ? value[0] : value
  }

  // 輔助函數：統一處理錯誤和自訂回應
  const getErrorConfig = (queryKey: string, errorSource: any) => {
    // 1. 優先檢查 Mock Manager (localStorage)
    if (typeof window !== 'undefined') {
      const mockManager = getMockManager()
      const enabledConfig = mockManager.getEnabledMcdBridgeByApi(queryKey)

      if (enabledConfig) {
        console.log(`[MCD Bridge Mock] 使用 mock 配置: ${queryKey} -> ${enabledConfig.errorKey}`)
        const config = errorSource[enabledConfig.errorKey as keyof typeof errorSource]

        if (config) {
          // ⭐ 統一判斷邏輯：有 success: true 或沒有 code → 自訂回應；有 code → 錯誤
          if (config.success === true || !('code' in config)) {
            return { error: undefined, custom: config }
          }
          return { error: config, custom: undefined }
        }
      }
    }

    // 2. 降級使用 query 參數 (原有邏輯)
    const queryValue = getQueryValue(queryKey)
    if (!queryValue) return { error: undefined, custom: undefined }

    const config = errorSource[queryValue as keyof typeof errorSource]
    if (!config) return { error: undefined, custom: undefined }

    // ⭐ 統一判斷邏輯：有 success: true 或沒有 code → 自訂回應；有 code → 錯誤
    if (config.success === true || !('code' in config)) {
      return { error: undefined, custom: config }
    }
    return { error: config, custom: undefined }
  }

  const getUserConfig = getErrorConfig('getuser', mockGmalError.getuser)
  const promptLoginConfig = getErrorConfig('promptlogin', mockGmalError.promptlogin)
  const addTagsConfig = getErrorConfig('addTags', mockGmalError.addTags)
  const removeTagsConfig = getErrorConfig('removeTags', mockGmalError.removeTags)
  const tagsConfig = getErrorConfig('getTags', mockGmalError.getTags)
  const authCodeConfig = getErrorConfig('getAuthCode', mockGmalError.getAuthCode)
  const pointsConfig = getErrorConfig('getPoints', mockGmalError.getPoints)
  const burnPointsConfig = getErrorConfig('burnPoints', mockGmalError.burnPoints)
  const locationConfig = getErrorConfig('location', mockGmalError.continuous)
  const scannerConfig = getErrorConfig('scanner', mockGmalError.scanner.scanner)
  const addPointConfig = getErrorConfig('addPoint', mockGmalError.addPoint)
  const activateRewardConfig = getErrorConfig('activateReward', mockGmalError.activateReward)
  const androidConfig = getErrorConfig('android', mockGmalError.androidErrors)
  const otherConfig = getErrorConfig('other', mockGmalError.otherErrors)

  return {
    isLogin: route.query.login !== 'false',

    // User API
    getUserError: getUserConfig.error,
    getUserCustom: getUserConfig.custom,
    promptLoginError: promptLoginConfig.error,
    promptLoginCustom: promptLoginConfig.custom,
    addTagsError: addTagsConfig.error,
    addTagsCustom: addTagsConfig.custom,
    removeTagsError: removeTagsConfig.error,
    removeTagsCustom: removeTagsConfig.custom,
    getTagsError: tagsConfig.error,
    getTagsCustom: tagsConfig.custom,
    getAuthCodeError: authCodeConfig.error,
    getAuthCodeCustom: authCodeConfig.custom,

    // Deals API
    getPointsError: pointsConfig.error,
    getPointsCustom: pointsConfig.custom,
    burnPointsError: burnPointsConfig.error,
    burnPointsCustom: burnPointsConfig.custom,

    // Location API
    locationError: locationConfig.error,
    locationCustom: locationConfig.custom,

    // Scanner API
    scannerError: scannerConfig.error,
    scannerCustom: scannerConfig.custom,

    // Offer Activation API
    addPointError: addPointConfig.error,
    addPointCustom: addPointConfig.custom,
    activateRewardError: activateRewardConfig.error,
    activateRewardCustom: activateRewardConfig.custom,

    // Android 錯誤
    androidError: androidConfig.error,

    // 其他錯誤
    otherError: otherConfig.error
  }
}
