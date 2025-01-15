let app = getApp()
Page({
  data: {
    quxian: ['公司领导','网络部','全业支','工建','市场部','集客部','客体部','市职能','涪城', '高新', '游仙', '江油', '三台', '盐亭', '安县', '梓潼', '北川', '平武'],
    quxianIndex: 0,
    pageType: 'login',
    username: '',
    password: '',
    phone: '',
    userInfo: {}
  },
  onLoad(options) {
    // 如果有nocheck参数，不进行自动登录检查
    if (options.nocheck) {
      // 确保清空所有用户信息
      app.globalData = {
        userInfo: {},
        isLogin: false
      }
      
      this.setData({
        pageType: options.pageType || "login",
        username: '',
        phone: '',
        userInfo: {},
        quxianIndex: 0
      })
      
      // 如果是注册页面，直接显示表单
      if (options.pageType === 'regist') {
        this.setData({
          pageType: 'regist'
        })
      }
      return;
    }

    if (options.pageType == 'update') {
      this.setData({
        pageType: "update"
      })
    }
    
    // 只有在非nocheck状态下才进行自动登录查询
    if (!options.nocheck) {
      app.$api.userQuery(options).then(
        res => {
          console.log('userinfo', res)
          if (res.code == 1) {
            app.$db.set('userInfo', res.data)
            app.globalData.userInfo = res.data
            if (res.data.isGrant == 'true') {
              app.globalData.isLogin = true
              if (this.data.pageType != "update") {
                app.$comm.switchTabTo('/pages/index/index')
              }

            } else {
              this.setData({
                pageType: "grant"
              })
            }

          } else {
            this.setData({
              pageType: "regist"
            })
          }
        }

      )

      this.setData({

        pageType: options.pageType,
        username: app.globalData.userInfo.username,
        phone: app.globalData.userInfo.phone,
        quxianIndex: this.data.quxian.findIndex(value => value == app.globalData.userInfo.quxian)

      })
    }
  },
  loadClassifyAdmin() {
    app.$api.getClassifyAdmin().then(res => {
      if (res.code) {
        this.setData({
          classifyList: res.data
        })
      }
    })
  },
  classifyPickerChange(e) {
    this.setData({
      quxianIndex: e.detail.value
    })
  },
  chooseImageHandle(e) {
    this.setData({
      product_img_list: e.detail.imgArr || []
    })
  },
  formSubmit(e) {
    let { value } = e.detail

    let valLoginRes = app.$validate.validate(value, [{
      name: 'username',
      type: 'required',
      errmsg: '真实姓名不能为空'
    }, {
      name: 'phone',
      type: 'phone',
      errmsg: '电话号码不合法'
    }])
    if (!valLoginRes.isOk) {
      app.$comm.errorToShow(valLoginRes.errmsg)
      return false
    }

    if (this.data.pageType == 'login') {
      // 登录时需要验证用户信息
      app.$api.userQuery({ username: value.username, phone: value.phone }).then(res => {
        if (res.code == 1 && res.data) {
          // 登录成功，保存用户信息
          app.$db.set('userInfo', res.data)
          app.globalData.userInfo = res.data
          app.globalData.isLogin = true
          app.$lUtil.setExpiresTime()
          
          if (res.data.isGrant == 'true') {
            app.$comm.switchTabTo('/pages/index/index')
          } else {
            this.setData({
              pageType: 'grant'
            })
          }
        } else {
          app.$comm.errorToShow('用户名或手机号错误')
        }
      })
      return;
    }

    // 构造用户信息，确保手机号是数字类型
    const userInfo = {
      username: value.username,
      phone: parseInt(value.phone),  // 转换为数字
      quxian: this.data.quxian[this.data.quxianIndex] || '网络部',
      isGrant: 'false'
    }

    this.setData({
      userInfo: userInfo
    })
    
    if (this.data.pageType == 'update') {
      this.userUpdate({
        userInfo: this.data.userInfo
      })
    }
    if (this.data.pageType == 'regist') {
      console.log('Submitting user info:', userInfo)
      this.userAdd({
        userInfo: userInfo
      })
    }
  },

  userAdd(userInfo) {
    console.log('开始注册，用户信息：', userInfo)
    app.$api.userAdd(userInfo).then(res => {
      console.log('注册返回结果：', res)
      if (res.code) {
        // 注册成功后，自动更新用户状态为已审核
        const updatedInfo = {
          username: userInfo.userInfo.username,
          phone: userInfo.userInfo.phone,
          quxian: userInfo.userInfo.quxian,
          isGrant: 'true'
        }
        console.log('准备更新用户信息：', updatedInfo)

        // 先查询用户信息
        app.$api.userQuery().then(queryRes => {
          console.log('查询用户信息结果：', queryRes)
          if (queryRes.code === 1) {
            // 更新用户状态
            app.$api.userUpdate({ userInfo: updatedInfo }).then(updateRes => {
              console.log('更新用户状态结果：', updateRes)
              if (updateRes.code) {
                // 更新成功，保存用户信息并跳转
                app.$db.set('userInfo', updatedInfo)
                app.globalData.userInfo = updatedInfo
                app.globalData.isLogin = true
                app.$lUtil.setExpiresTime()
                
                console.log('准备跳转到首页，当前状态：', {
                  globalData: app.globalData,
                  localData: app.$db.get('userInfo')
                })
                
                wx.switchTab({
                  url: '/pages/index/index',
                  fail: function(err) {
                    console.error('跳转失败：', err)
                  }
                })
              } else {
                console.error('更新失败：', updateRes)
                app.$comm.errorToShow("审核失败，请联系管理员")
              }
            }).catch(err => {
              console.error('更新请求异常：', err)
              app.$comm.errorToShow("更新异常，请稍后重试")
            })
          } else {
            console.error('查询用户信息失败：', queryRes)
            app.$comm.errorToShow("获取用户信息失败")
          }
        })
      } else {
        console.error('注册失败，错误信息：', res)
        app.$comm.errorToShow(res.msg || "注册失败，请与管理员联系")
      }
    }).catch(err => {
      console.error('注册请求异常：', err)
      app.$comm.errorToShow("注册异常，请稍后重试")
    })
  },

  userUpdate(userInfo) {
    app.$api.userUpdate(userInfo).then(res => {
      console.log('update', res)
      if (res.code) {
        app.$comm.successToShow("修改成功", () => {})
        this.setData({
          pageType: 'login'
        })
      }
    })
  },
  pageBack() {
    app.$comm.navigateBack()
  }
})