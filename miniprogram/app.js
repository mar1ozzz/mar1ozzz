import * as Comm from './util/comm.js';
import * as Api from './util/api.js';
import * as Db from './util/db.js';
import Validate from './util/validate.js';
import lUtil from './util/loginUtil.js';
import * as Config from './util/config';

let userInfo = Db.get("userInfo") || {}
let isLogin = JSON.stringify(userInfo) != "{}"

App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'wangluozhitongche-6ellgcbb2d138b',
        traceUser: true,
      })
    }

    this.globalData = {
      userInfo: userInfo,
      isLogin: isLogin
    }


    //判断登录过期
    if (!lUtil.checkExpiresTime()) {
      setTimeout(() => {
        this.globalData.userInfo = {}
        this.globalData.isLogin = false
        this.$db.del("userInfo")
      }, 1500)
      app.$api.userQuery(options).then(
        res =>{
          console.log('launch',res)
          if(res.code==1){
            if(res.data.isGrant=='true'){
              app.globalData.isLogin = true
              app.$lUtil.setExpiresTime()
              app.$db.set('userInfo', res.data)            
              app.globalData.userInfo = res.data              
            }else{
              app.$comm.navigateTo("/pages/regist/regist?pageType='grant'")
            }
            
        }else{
          app.$comm.navigateTo("/pages/regist/regist?pageType='regist'")
        }
      })
    }

  },

  $comm: Comm,
  $api: Api,
  $db: Db,
  $validate: Validate,
  $lUtil: lUtil,
  $config:Config
})