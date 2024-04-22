let app = getApp()
Page({
  data: {
    quxian: ['网络部','涪城', '高新', '游仙', '江油', '三台', '盐亭', '安县', '梓潼', '北川', '平武'],
    quxianIndex: 0,
    pageType: 'login',
    username: '',
    password: '',
    phone: '',
    userInfo: {}


  },
  onLoad(options) {
    if (options.pageType == 'update') {
      this.setData({
        pageType: "update"
      })
    }
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

    let {
      value
    } = e.detail

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
    this.setData({
      userInfo: {
        ...value
      },
    })
    app.$db.set('userInfo', this.data.userInfo)
    app.globalData.userInfo = this.data.userInfo
    if (this.data.pageType == 'update') {
      this.userUpdate({
        userInfo: this.data.userInfo
      })
    }
    if (this.data.pageType == 'regist') {
      this.userAdd({
        userInfo: this.data.userInfo
      })
    }
    if (this.data.pageType == 'login') {
      app.$comm.switchTabTo("/pages/index/index")
    }

  },

  userAdd(userInfo) {
    app.$api.userAdd(userInfo).then(res => {
      if (res.code) {

        app.$comm.successToShow("注册成功,请等待审核", () => {

        })
        app.globalData.userInfo.isGrant = 'false'
        this.setData({
          pageType: 'grant'
        })
        //app.$comm.switchTabTo("/pages/preorder/preorder")
      }else{
        app.$comm.errorToShow("注册失败，请与管理员联系")
      }
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