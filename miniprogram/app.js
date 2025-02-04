import * as Comm from './util/comm.js';
import * as Api from './util/api.js';
import * as Db from './util/db.js';
import Validate from './util/validate.js';
import lUtil from './util/loginUtil.js';
import * as Config from './util/config';

// 坐标转换工具
const coordTransform = {
  // WGS84转GCJ02
  toGCJ02(wgsLng, wgsLat) {
    const PI = 3.14159265358979324;
    const A = 6378245.0;
    const EE = 0.00669342162296594323;

    function outOfChina(lng, lat) {
      return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
    }

    function transformLat(x, y) {
      let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
      ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
      ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
      return ret;
    }

    function transformLng(x, y) {
      let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
      ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
      ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
      return ret;
    }

    if (outOfChina(wgsLng, wgsLat)) {
      return [wgsLng, wgsLat];
    }

    let dLat = transformLat(wgsLng - 105.0, wgsLat - 35.0);
    let dLng = transformLng(wgsLng - 105.0, wgsLat - 35.0);
    let radLat = wgsLat / 180.0 * PI;
    let magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    let sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
    dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
    
    return [
      parseFloat((wgsLng + dLng).toFixed(6)), 
      parseFloat((wgsLat + dLat).toFixed(6))
    ];
  },

  // GCJ02转WGS84
  toWGS84(gcjLng, gcjLat) {
    const PI = 3.14159265358979324;
    const A = 6378245.0;
    const EE = 0.00669342162296594323;

    function outOfChina(lng, lat) {
      return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
    }

    function transformLat(x, y) {
      let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
      ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
      ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
      return ret;
    }

    function transformLng(x, y) {
      let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
      ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
      ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
      return ret;
    }

    if (outOfChina(gcjLng, gcjLat)) {
      return {
        lng: gcjLng,
        lat: gcjLat
      };
    }

    let dLat = transformLat(gcjLng - 105.0, gcjLat - 35.0);
    let dLng = transformLng(gcjLng - 105.0, gcjLat - 35.0);
    let radLat = gcjLat / 180.0 * PI;
    let magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    let sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
    dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
    
    return {
      lng: parseFloat((gcjLng - dLng).toFixed(6)),
      lat: parseFloat((gcjLat - dLat).toFixed(6))
    };
  }
};

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

    this.coordTransform = coordTransform;

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