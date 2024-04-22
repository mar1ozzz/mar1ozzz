let app = getApp()
Page({
  data: {
    positionList: ['园艺', '高水', '金家岭'],
    positionIndex: 0,
    orderable: 1,
    ordered: 0,
    preorder: {},
    menu_list: [],
    swiperList: [],

    tableColumns: [{
        title: "类别",
        key: "category",
      },
      {
        title: "菜名",
        key: "name",
      }
    ]
  },
  onLoad(options) {
    app.$lUtil.setExpiresTime()
    this.queryMenu()
    this.queryPreorder()
    this.setOderable()
    this.loadIndexSwiper()


  },

  onShow(options) {

    this.setOderable()

  },

  positionPickerChange(e) {
    this.setData({
      positionIndex: e.detail.value
    })
  },

  loadIndexSwiper() {
    app.$api.getIndexSwiper().then(res => {
      if (res.code) {
        this.setData({
          swiperList: res.data
        })
      }
    })
  },

  formSubmit(e) {
    if (!app.globalData.isLogin) {
      app.$comm.errorToShow("请先登录")
      return wx.switchTab({
        url: '/pages/user/user'
      })
    }
    let {
      pageType,
    } = this.data
    let option = e.detail.value

    if (this.data.ordered == 0) {
      this.addPreorder(option)
    } else {
      this.deletePreorder(this.preorder)
    }
    /* 
     if (pageType == 'add') {
       this.addPreorder(option)
     } else if (pageType == 'delete') {
       this.deletePreorder(Object.assign(option, {
         _id: this.data.initData._id
       }))
     } */
  },
  addPreorder(data) {
    app.$api.userPreorder(data).then(res => {
      if (res.code) {
        app.$comm.successToShow("预定成功", () => {
          this.setData({
            ordered: 1,
            preorder: res.data
          })
        })
        this.setOderable()
      } else {
        app.$comm.errorToShow(res.data, () => {})
      }
    })
  },
  deletePreorder(data) {
    app.$api.userPreorderDelete(data).then(res => {
      if (res.code) {
        app.$comm.successToShow("撤销成功", () => {
          this.setData({
            ordered: 0,
            preorder: null
          })

        })
      }
    })
  },


  usePreorder(data) {

    if (!app.globalData.isLogin) {
      app.$comm.errorToShow("请先登录")
      return wx.switchTab({
        url: '/pages/user/user'
      })
    }
    app.$api.userPreorderuse(data).then(res => {
      if (res.code) {
        app.$comm.successToShow("就餐成功", () => {
          this.setData({
            ordered: 0,
            preorder: null
          })
        })
      }
    })
    this.setOderable()
  },

  queryPreorder(data) {
    app.$api.userPreorderQuery(data).then(res => {
      console.log('preorder', res)
      if (res.code > 0) {
        this.setData({
          ordered: 1,
          preorder: res.data[0]
        })
      }
    })
  },

  queryMenu(data) {
    app.$api.userMenuQuery(data).then(res => {
      if (res.code) {
        this.setData({
          menu_list: res.data
        })
      }
    })
  },

  setOderable() {
    var that = this;
    let date = new Date()
    let hour = date.getHours()

    if (hour > 6 & hour < 10) {
      that.setData({
        orderable: '1'
      })
    } else {
      that.setData({
        orderable: '0'
      })
    }
  },

  pageBack() {
    app.$comm.navigateBack()
  }
})