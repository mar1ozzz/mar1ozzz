let MAX_DAY = 7 //过期时间

/**
 * 设置登录过期时间
 */
function setExpiresTime() {
  let expires_time = Date.now()
  wx.setStorageSync("expires_time", expires_time)
}

/**
 * 判断过期时间
 */
function checkExpiresTime() {
  let expires_time = wx.getStorageSync("expires_time", expires_time)
  if (!expires_time) {
    return 1
  }
  var timeNum = Math.floor((parseInt(Date.now() - expires_time) / 1000) / 86400);
  if (timeNum > MAX_DAY) {
    return 0
  } else {
    return 1
  }
}


export default {
  setExpiresTime,
  checkExpiresTime
}