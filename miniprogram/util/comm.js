/**
 * 统一跳转
 */
function navigateTo(url, callback, events = {}) {
  if (arguments.length == 2) {
    if (typeof callback !== "function") {
      events = callback
      callback = () => {}
    }
  }
  wx.navigateTo({
    url: url,
    animationType: 'pop-in',
    animationDuration: 300,
    success: callback,
    events: events
  })
}
/**
 * 关闭当前页面统一跳转
 */
function redirectTo(url, callback) {
  wx.redirectTo({
    url: url,
    animationType: 'pop-in',
    animationDuration: 300,
    success: callback
  })
}
/**
 * 关闭所有的页面打开一个页面
 */
function reLaunch(url, callback) {
  wx.reLaunch({
    url: url,
    animationType: 'pop-in',
    animationDuration: 300,
    success: callback
  })
}
/**
 * tabber跳转
 */
function switchTabTo(url, callback) {
  wx.switchTab({
    url: url,
    animationType: 'pop-in',
    animationDuration: 300,
    success: callback
  })
}
/**
 * 跳转的上一级页面
 */
function navigateBack(delta = 1, callback) {
  wx.navigateBack({
    delta,
    animationType: 'pop-in',
    animationDuration: 300,
    success: callback
  })
}
/**
 * 操作失败的提示信息
 */
function errorToShow(msg = '操作失败', callback = function () {}) {
  wx.showToast({
    title: msg,
    icon: 'none',
    duration: 3500
  })
  setTimeout(function () {
    callback()
  }, 3500)
}
/**
 * 操作成功后，的提示信息
 */
function successToShow(msg = '保存成功', callback = function () {}) {
  wx.showToast({
    title: msg,
    icon: 'success',
    duration: 1000
  })
  setTimeout(function () {
    callback()
  }, 500)
}

/**
 * 授权请求
 * @export
 * @param {*} authorizeScope 更多scope参考
 * @param {*} modal modal弹窗参数信息
 */

function setScope(authorizeScope, modal) {
  return new Promise((resolve, reject) => {
    if (!modal) {
      modal = {
        title: '授权',
        content: '需要您设置授权已使用相应功能',
        confirmText: '设置'
      }
    }
    wx.getSetting({
      success(res) {
        // hasAuthor === undefined  表示 初始化进入，从未授权
        // hasAuthor === true       表示 已授权
        // hasAuthor === false      表示 授权拒绝
        const hasAuthor = res.authSetting[authorizeScope]
        switch (hasAuthor) {
          case undefined:
            wx.authorize({
              scope: authorizeScope,
              success: res => {
                resolve(res)
              },
              fail: err => {
                wx.showToast({
                  title: '授权失败',
                  icon: 'none',
                  duration: 3000
                })
                reject(err)
              }
            })
            break
          case true:
            resolve()
            break
          case false:
            //bug 在电脑模拟器会报错，手机不会
            wx.showModal({
              ...modal,
              success: res => {
                if (res.confirm) {
                  wx.openSetting({
                    success: res => {
                      if (res.authSetting[authorizeScope]) {
                        resolve(res)
                      } else {
                        reject(res)
                        wx.showToast({
                          title: '授权失败',
                          icon: 'none',
                          duration: 3000
                        })
                      }
                    },
                    fail: err => {
                      console.log(err)
                      reject(err)
                      wx.showToast({
                        title: '打开设置异常',
                        icon: 'none',
                        duration: 3000
                      })
                    }
                  })
                } else {
                  reject(res)
                  wx.showToast({
                    title: '授权失败',
                    icon: 'none',
                    duration: 3000
                  })
                }
              },
              fail: err => {
                reject(err)
                wx.showToast({
                  title: '弹窗异常',
                  icon: 'none',
                  duration: 3000
                })
              }
            })
            break
        }
      },
      fail: err => {
        reject(err)
        wx.showToast({
          title: '获取当前设置异常',
          icon: 'none',
          duration: 3000
        })
      }
    })
  })
}


/**
 * 处理性别
 */
function isgender(gender) {
  if (gender == 0) {
    return "男"
  } else if (gender == 1) {
    return "女"
  } else {
    return "未知"
  }
}

/**
 * 数据处理公共方法
 */
function optionFormat(data, rules = []) {
  let strategy = [{
    key: "num",
    func: (val) => {
      return parseInt(val)
    }
  }]

  rules.forEach(ruleItem => {
    if (['', undefined, null].indexOf(ruleItem.name) !== -1) {
      return
    }
    if (['', undefined, null].indexOf(ruleItem.rule) !== -1) {
      return
    }

    let nameList = ruleItem.name.split('|')
    let ruleList = ruleItem.rule.split('|')
    nameList.forEach(nameItem => {
      ruleList.forEach(ruleItem => {
        let strategyInfo = strategy.find(strategyItem => ruleItem == strategyItem.key);
        strategyInfo && (data[nameItem] = strategyInfo.func(data[nameItem]))
      })
    })
  })
  return data
}

export {
  navigateTo,
  redirectTo,
  reLaunch,
  switchTabTo,
  navigateBack,
  errorToShow,
  successToShow,
  setScope,
  isgender,
  optionFormat
}