let app = getApp()
Page({
  data: {
    height: 64,
    top: 0,
    scrollH: 0,
    opcity: 0,

    tabs: [{
      name: "外卖",
      iconName: "icon-fahuo",
      state: -1
    }, {
      name: "午餐",
      iconName: "icon-daishouhuo",
      state: 2
    }],
    isLogin: app.globalData.isLogin,
    userInfo: app.globalData.userInfo
  },
  onShow:function(){
    this.setData({
      isLogin: app.globalData.isLogin,
      userInfo: app.globalData.userInfo
    })
   
  },
  onLoad: function () {
   
    this.initUserInfo()
    console.log('ygm_userInfo',this.data.userInfo)
    let obj = wx.getMenuButtonBoundingClientRect();
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          height: res.statusBarHeight + obj.height + (obj.top - res.statusBarHeight) * 2,
          top: obj.top,
          scrollH: res.windowWidth * 0.6
        })
      }
    })
   /*  if(!this.isLogin){
      app.$comm.switchTabTo("/pages/user/user")
    } */
  },
  initUserInfo() {
    
    let {
      isLogin,
      userInfo
    } = app.globalData
    this.setData({
      userInfo: userInfo,
      isLogin: isLogin
    })
  },
  userLogin(){
    wx.login({
      success(res){
        console.log(res)
      }

})
  },
  userLogin111() {
    wx[wx.getUserProfile ? 'getUserProfile' : 'getUserInfo']({
      desc: '用于完善会员资料',
      success: (e) => {

        if (e.userInfo) {
          let userInfo = e.userInfo
          app.$api.userLogin({
            userInfo: {
              nickName: userInfo.nickName,
              gender: userInfo.gender,
              avatarUrl: userInfo.avatarUrl
            }
          }).then(res => {
            console.log('login', res)
            if (res.code == 1) {
              this.setData({
                userInfo: res.data,
                isLogin: true
              })
              app.$db.set('userInfo', res.data)
              app.$lUtil.setExpiresTime()
              app.globalData.userInfo = res.data
              app.globalData.isLogin = true
              app.$comm.successToShow("登录成功", () => {
                app.$comm.switchTabTo("/pages/preorder/preorder")
              })
            } else {
              app.$comm.navigateTo("/pages/regist/regist")
            }
          })
        } else {
          errorShowModal()
        }
      },
      fail: (err) => {
        errorShowModal()
      }
    })

    function errorShowModal() {
      wx.showModal({
        title: '警告',
        content: '您点击了拒绝授权，将无法进入小程序，请授权之后再进入!!!',
        showCancel: false,
        confirmText: '返回授权',
        success: function (res) {
          if (res.confirm) {}
        }
      });
    }
  },
  toDepositHandle() {
    app.$comm.navigateTo("/pages/deposit/deposit")
  },
  toRegist() {
    app.$comm.navigateTo("/pages/regist/regist?pageType=update")
  },
// 
  toCollectionHandle() {
    app.$comm.navigateTo("/pages/my-collection/my-collection")
  },
  toAddressHandle() {
    app.$comm.navigateTo("/pages/address/address?type=show")
  },
  toFeedbackHandle() {
    app.$comm.navigateTo("/pages/feedback/feedback")
  },
  logout() {
    wx.showModal({
      title: '提示',
      content: '是否确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          // 清除所有登录相关信息
          app.$db.del("userInfo")
          wx.clearStorageSync()  // 清除所有存储
          
          // 重置全局状态
          app.globalData = {
            userInfo: {},
            isLogin: false
          }
          
          // 重置页面状态
          this.setData({
            isLogin: false,
            userInfo: {}
          })

          // 跳转到审核页面
          wx.redirectTo({
            url: '/pages/regist/regist?pageType=regist&nocheck=1'
          })
        }
      }
    })
  },
  toOrderType(e) {
    let state = e.currentTarget.dataset.state
    app.$comm.navigateTo(`/pages/my-order/my-order?state=${state}`)
  },
  toAdminPageHandle() {
    app.$comm.navigateTo(`/pages/admin/menu/menu`)
  },
  onPageScroll(e) {
    let scroll = e.scrollTop <= 0 ? 0 : e.scrollTop;
    let opcity = scroll / this.data.scrollH;
    if (this.data.opcity >= 1 && opcity >= 1) {
      return;
    }
    this.setData({
      opcity: opcity
    })
  },
  tomy(e){    
    let searchType=e.currentTarget.dataset.info
    app.$comm.navigateTo(`/pages/my/my?searchType=${searchType}`)
  }
})