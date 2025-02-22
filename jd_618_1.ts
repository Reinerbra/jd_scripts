/**
 * 京东骑驴
 * cron: 10 8,15,20 * * *
 * CK1   优先助力HW.ts
 * CK倒1 优先组队HW.ts
 */

import {User, JDHelloWorld} from "./TS_JDHelloWorld";
import {Log_618} from "./utils/log_618";

interface GROUP {
  groupJoinInviteId: string,
  mpin: string
}

class Jd_618 extends JDHelloWorld {
  user: User
  logTool: Log_618 = new Log_618()
  shareCodeSelf: string[] = []

  constructor() {
    super();
    console.log('version: 1300')
  }

  async init() {
    await this.run(this)
  }

  async getLog(): Promise<{ random: string, log: string }> {
    let data = await this.logTool.main()
    await this.wait(4000)
    return data
  }

  async api(fn: string, body: object) {
    let appid: string = fn.includes('promote_') ? 'signed_wh5' : 'wh5'
    return this.post(`https://api.m.jd.com/client.action?functionId=${fn}`, `functionId=${fn}&client=m&clientVersion=1.0.0&appid=${appid}&body=${JSON.stringify(body)}`, {
      'Host': 'api.m.jd.com',
      'Origin': 'https://wbbny.m.jd.com',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': this.user.UserAgent,
      'Referer': 'https://wbbny.m.jd.com/',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': this.user.cookie
    })
  }

  async qryViewkitCallbackResult(taskToken: string) {
    let body: object = {"dataSource": "newshortAward", "method": "getTaskAward", "reqParams": `{\"taskToken\":\"${taskToken}\"}`}
    let data = await this.logTool.qry('qryViewkitCallbackResult', body)
    return await this.post('https://api.m.jd.com/client.action?functionId=qryViewkitCallbackResult', data, {
      'Host': 'api.m.jd.com',
      'Cookie': this.user.cookie,
      'content-type': 'application/x-www-form-urlencoded',
      'User-Agent': this.user.UserAgent,
    })
  }

  async feed(taskId: number, secretp: string) {
    let res: any = await this.api('promote_getFeedDetail', {"taskId": taskId})
    let times: number = res.data.result.addProductVos[0].times, maxTimes: number = res.data.result.addProductVos[0].maxTimes
    for (let tp of res.data.result.addProductVos[0].productInfoVos) {
      if (times === maxTimes) break
      let log: { log: string, random: string } = await this.getLog()
      let data = await this.api('promote_collectScore', {
        "taskId": taskId,
        "taskToken": tp.taskToken,
        "ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random})
      })
      this.o2s(data)
      times++
      await this.wait(3000)
    }
  }

  async main(user: User) {
    this.user = user
    let res: any, data: any, log: { random: string, log: string }
    res = await this.api('promote_getHomeData', {})
    let secretp: string = res.data.result.homeMainInfo.secretp
    let totalScore: number = parseInt(res.data.result.homeMainInfo.raiseInfo.totalScore)
    console.log('当前金币', totalScore)

    res = await this.api('promote_getHomeData', {})
    if (res.data.result.homeMainInfo.todaySignStatus === 0) {
      console.log('开始签到')
      log = await this.getLog()
      data = await this.api('promote_sign', {"ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random})})
      if (data.data?.result?.awardResult?.redPacketResult) {
        console.log('🧧', parseFloat(data.data.result.awardResult.redPacketResult.value))
      } else if (data?.data?.result?.scoreResult) {
        console.log('金币', parseInt(data.data.result.scoreResult.todaySignScore))
      } else {
        this.o2s(data)
      }
      await this.wait(3000)
    } else {
      console.log('已签到')
    }

    for (let i = 0; i < 20; i++) {
      res = await this.api('promote_getHomeData', {})
      let sceneInfo: any = res.data.result.homeMainInfo.raiseInfo.scenceMap.sceneInfo
      sceneInfo.sort((a, b) => parseInt(a.redNum.nextLevelScore) - parseInt(b.redNum.nextLevelScore))
      sceneInfo = sceneInfo[0]
      if (sceneInfo.redNum.nextLevelScore <= totalScore) {
        try {
          console.log('转盘场景', sceneInfo.scenceId)
          log = await this.getLog()
          res = await this.api('promote_raise', {"scenceId": sceneInfo.scenceId, "ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random})})
          if (res.data.result.levelUpAward.redNum) {
            console.log('转盘分红', res.data.result.levelUpAward.redNum)
          } else {
            console.log('转盘其他奖励')
          }
          res = await this.api('promote_getHomeData', {})
          totalScore = parseInt(res.data.result.homeMainInfo.raiseInfo.totalScore)
          await this.wait(3000)
        } catch (e) {
          break
        }
      }
    }

    res = await this.api('qryCompositeMaterials', {"qryParam": "[{\"type\":\"advertGroup\",\"mapTo\":\"brand\",\"id\":\"06306976\"}]", "activityId": "2fUope8TDN3dUJfNzQswkBLc7uE8", "pageId": "", "reqSrc": "", "applyKey": "jd_star"})
    this.o2s(res)
    let qryList: any = res.data.brand.list
    for (let t of qryList) {
      let ActivityId: string = t.extension.venderLink1.match(/Zeus\/(\w*)/)[1]
      console.log('ActivityId', ActivityId)
      data = await this.api('factory_getStaticConfig', {"encryptActivityId": ActivityId, "channelId": 1})
      let appId: string = data.data.result.appId
      res = await this.api('template_mongo_getHomeData', {"taskToken": "", "appId": appId, "actId": ActivityId, "channelId": 1})
      let taskVos: any = res.data.result.taskVos
      for (let tp of taskVos) {
        if (tp.times === 0) {
          if (tp.taskName === '每日签到') {
            log = await this.getLog()
            data = await this.api('template_mongo_collectScore', {"taskToken": tp.simpleRecordInfoVo.taskToken, "taskId": tp.taskId, "actionType": 0, "appId": appId, "safeStr": `{\"random\":\"${log.random}\",\"sceneid\":\"RAGJSYh5\",\"log\":\"${log.log}\"}`})
            console.log('签到成功', parseInt(data.data.result.acquiredScore))
            await this.wait(3000)
          } else if (tp.followShopVo || tp.productInfoVos || tp.shoppingActivityVos || t.brandMemberVos) {
            for (let i = tp.times; i < tp.maxTimes; i++) {
              let vos: any = tp.followShopVo || tp.productInfoVos || tp.shoppingActivityVos || t.brandMemberVos
              console.log(tp.taskName)
              data = await this.api('template_mongo_collectScore', {"taskToken": vos[i].taskToken, "taskId": tp.taskId, "actionType": 0, "appId": appId, "safeStr": `{\"random\":\"${log.random}\",\"sceneid\":\"RAGJSYh5\",\"log\":\"${log.log}\"}`})
              console.log(parseInt(data.data.result.acquiredScore))
              await this.wait(1000)
            }
          } else if (tp.taskName.includes('会员') || tp.taskName.includes('下单')) {
            console.log(tp.taskName, 'pass')
          } else {
            console.log(tp)
          }
        }
      }

      res = await this.api('template_mongo_getHomeData', {"taskToken": "", "appId": appId, "actId": ActivityId, "channelId": 1})
      let userLightChance: number = res.data.result.userInfo.userLightChance, fragmentList: number[] = res.data.result.userInfo.fragmentList
      console.log('可抽奖', userLightChance)
      let lotteryTimes: number = 0
      for (let i = 1; i < 7; i++) {
        if (lotteryTimes === userLightChance)
          break
        if (!fragmentList.includes(i)) {
          data = await this.api('template_mongo_lottery', {"appId": appId, "fragmentId": i})
          if (data.data.result.userAwardDto.couponVo)
            console.log(data.data.result.userAwardDto.couponVo.prizeName)
          else if (data.data.result.userAwardDto.scoreVo)
            console.log(parseInt(data.data.result.userAwardDto.scoreVo.quantity), '金币')
          else
            console.log(data.data.result.userAwardDto)
          await this.wait(2000)
          lotteryTimes++
        }
      }
      await this.wait(1000)
    }

    for (let loop = 0; loop < 3; loop++) {
      try {
        console.log('loop', loop)
        res = await this.api('promote_getTaskDetail', {})
        this.o2s(res)
        if (loop === 0) {
          let inviteId: string = res.data.result.inviteId
          console.log('助力码', inviteId)
          this.shareCodeSelf.push(inviteId)
        }

        for (let t of res.data.result.lotteryTaskVos[0].badgeAwardVos) {
          if (t.status === 3) {
            data = await this.api('promote_getBadgeAward', {"awardToken": t.awardToken})
            console.log(t.awardName, parseInt(data.data.result.myAwardVos[0].pointVo.score))
            await this.wait(3000)
          }
        }

        for (let t of res.data.result.taskVos) {
          if (t.taskName.includes('小程序')) {
            for (let tp of t.shoppingActivityVos) {
              if (tp.status === 1) {
                log = await this.getLog()
                data = await this.api('promote_collectScore', {"taskId": t.taskId, "taskToken": tp.taskToken, "ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random})})
                console.log(parseInt(data.data.result.acquiredScore))
                await this.wait(2000)
              }
            }
          }

          if (t.browseShopVo) {
            for (let tp of t.browseShopVo) {
              if (tp.status === 1) {
                console.log(tp.shopName)
                log = await this.getLog()

                data = await this.api('followShop', {"shopId": tp.shopId, "follow": true, "type": "0"})
                console.log('followShop', data.msg)
                await this.wait(1000)

                data = await this.api('promote_collectScore', {"taskId": t.taskId.toString(), "taskToken": tp.taskToken, "actionType": 1, "ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random})})
                console.log(data.data.bizMsg)

                await this.wait(t.waitDuration * 1000 || 3000)
                data = await this.qryViewkitCallbackResult(tp.taskToken)
                console.log(data.toast.subTitle)
                await this.wait(8000)
              }
            }
          }

          if (t.shoppingActivityVos) {
            for (let tp of t.shoppingActivityVos) {
              if (tp.status === 1) {
                log = await this.getLog()
                console.log(tp.title)
                data = await this.api('promote_collectScore', {"taskId": t.taskId, "taskToken": tp.taskToken, "actionType": 1, "ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random})})
                await this.wait(t.waitDuration * 1000 || 3000)
                if (![3, 26].includes(t.taskType)) {
                  data = await this.qryViewkitCallbackResult(tp.taskToken)
                  console.log(data.toast.subTitle)
                  await this.wait(5000)
                }
              }
              await this.wait(5000)
            }
          }

          if (t.taskName.includes('加购')) {
            console.log(t.taskName)
            data = await this.api('promote_getTaskDetail', {taskId: t.taskId})
            await this.feed(t.taskId, secretp)
          }

          if (t.taskType === 0) {
            console.log(t.taskName)
            log = await this.getLog()
            data = await this.api('promote_collectScore', {"taskId": t.taskId, "taskToken": t.simpleRecordInfoVo.taskToken, "ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random})})
            console.log(parseInt(data.data.result.acquiredScore))
          }

          if (t.taskType === 2) {
            data = await this.api('promote_getFeedDetail', {taskId: t.taskId})
            await this.wait(1000)
            let times: number = data.data.result.addProductVos[0].times, maxTimes: number = data.data.result.addProductVos[0].maxTimes
            for (let tp of data.data.result.addProductVos[0].productInfoVos) {
              if (times === maxTimes) break
              console.log(tp.skuName)
              log = await this.getLog()
              data = await this.api('promote_collectScore', {"taskId": t.taskId, "taskToken": tp.taskToken, "ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random})})
              times++
              console.log(parseInt(data.data.result.acquiredScore))
              await this.wait(1000)
            }
          }

          if (t.taskType === 5) {
            console.log(t.taskName)
            res = await this.api('promote_getFeedDetail', {taskId: t.taskId})
            await this.wait(1000)
            for (let tp of res.data.result.taskVos[0].browseShopVo.slice(0, 4)) {
              if (tp.status === 1) {
                log = await this.getLog()
                data = await this.api('promote_collectScore', {"taskId": t.taskId, "taskToken": tp.taskToken, "ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random})})
                console.log(data.data.result.successToast)
                await this.wait(2000)
              }
            }
          }
        }
      } catch (e) {
        console.log('Error', e)
        break
      }
      await this.wait(6000)
    }
  }

  async help(users: User[]) {
    let shareCodeHW_group: any = [], shareCodeHW: any = [], shareCode: any = [], full: string[] = [], groups: GROUP[] = []
    /*
    for (let user of users) {
      try {
        console.log(`\n开始【京东账号${user.index + 1}】${user.UserName} 获取队伍信息\n`)
        this.user = user
        let res: any
        res = await this.api('promote_pk_getHomeData', {})
        if (res.data.result.groupInfo.memberList) {
          let memberCount: number = res.data.result.groupInfo.memberList.length
          console.log('当前队伍有', memberCount, '人')
          let groupJoinInviteId = ""

          if (memberCount < 30) {
            groupJoinInviteId = res.data.result.groupInfo.groupJoinInviteId
            res = await this.api('getEncryptedPinColor', {})
            groups.push({mpin: res.result, groupJoinInviteId: groupJoinInviteId})
            console.log('队伍未满', groupJoinInviteId)
          }
        }
      } catch (e) {
      }
      await this.wait(2000)
    }

     */

    for (let user of users) {
      try {
        console.log(`\n开始【京东账号${user.index + 1}】${user.UserName}\n`)
        this.user = user
        let res: any, log: { log: string, random: string }
        res = await this.api('promote_getHomeData', {})
        let secretp: string = res.data.result.homeMainInfo.secretp

        if (shareCodeHW.length === 0)
          shareCodeHW = await this.getshareCodeHW('lyb')
        if (user.index === 0) {
          shareCode = Array.from(new Set([...shareCodeHW, ...this.shareCodeSelf]))
        } else {
          shareCode = Array.from(new Set([...this.shareCodeSelf, ...shareCodeHW]))
        }
        this.o2s(this.shareCodeSelf, '内部助力')
        for (let code of shareCode) {
          if (!full.includes(code)) {
            console.log(`账号${user.index + 1} ${user.UserName} 去助力 ${code}`)
            log = await this.getLog()
            res = await this.api('promote_collectScore', {
              "ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random}),
              "actionType": "0",
              "inviteId": code
            })
            if (res.data.bizCode === 0) {
              console.log('助力成功', parseFloat(res.data.result.acquiredScore))
              if (res.data.result?.redpacket?.value)
                console.log('🧧', parseFloat(res.data.result?.redpacket?.value))
            } else if (res.data.bizMsg === '助力次数用完啦~') {
              console.log('上限')
              break
            } else if (res.data.bizMsg === '好友人气爆棚，不需要助力啦~') {
              console.log(res.data.bizMsg)
              full.push(code)
            } else {
              console.log(res.data.bizMsg)
            }
            await this.wait(4000)
          }
        }

        res = await this.api('promote_pk_getHomeData', {})
        if (res.data.result.groupInfo.memberList) {
          if (shareCodeHW_group.length === 0) {
            shareCodeHW_group = await this.getshareCodeHW('lyb_group')
          }
          if (user.index === users.length - 1) {
            groups = [...shareCodeHW_group, ...groups]
          }
          let memberCount: number = res.data.result.groupInfo.memberList.length
          if (memberCount === 1) {
            for (let group of groups) {
              log = await this.getLog()
              res = await this.api('collectFriendRecordColor', {"mpin": group.mpin, "businessCode": "20136", "assistType": "2", "shareSource": 1})
              res = await this.api('promote_pk_joinGroup', {"inviteId": group.groupJoinInviteId, "ss": JSON.stringify({extraData: {log: encodeURIComponent(log.log), sceneid: 'RAhomePageh5'}, secretp: secretp, random: log.random}), "confirmFlag": 1})
              await this.wait(3000)
              if (res.data.bizCode === 0) {
                console.log('加入队伍成功')
                break
              } else {
                console.log(res.data.bizMsg)
              }
              res = await this.api('promote_pk_getHomeData', {})
            }
          }
          await this.wait(3000)
        }
      } catch (e) {
        console.log(e)
      }
    }
  }
}

new Jd_618().init().then()