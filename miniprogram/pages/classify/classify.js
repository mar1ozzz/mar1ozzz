let app = getApp()
Page({
  data: {
    menuList: [],
    productList: [],
    option: {
      page: 1,
      limit: 6,
      loadend: false,
      loading: false
    },
    currentTab: 0,
    scrollTop: 0 
  },
  onLoad() {
    this.loadClassifyMenu()
  },
  loadClassifyMenu() {
    app.$api.getClassifyMenu().then(res => {
      if (res.code) {
        this.setData({
          menuList: res.data
        }, () => {
          this.inintload()
        })
      }
    })
  },
  loadClassifProduct() {
    let {
      page,
      limit,
      loadend
    } = this.data.option
    if (loadend) {
      return
    }
    let product_type = this.data.menuList[this.data.currentTab].product_type_name
    this.setData({
      "option.loading": true
    })
    app.$api.getClassifProduct({
      page: page,
      limit: limit,
      product_type: product_type
    }).then(res => {
      let {
        productList
      } = this.data
      if (res.code) {
        let proList = res.data
        if (productList.length > 0) {
          this.setData({
            productList: productList.concat(proList)
          })
        } else {
          this.setData({
            productList: proList
          })
        }
        if (proList.length < limit) {
          this.setData({
            "option.loadend": true
          })
        }
        this.setData({
          "option.page": ++page,
          "option.loading": false
        })
      }
    })
  },
  inintload() {
    this.setData({
      productList: [],
      option: {
        page: 1,
        limit: 6,
        loadend: false,
        loading: false
      }
    })
    this.loadClassifProduct()
  },
  swichNav: function (e) {
    let cur = e.currentTarget.dataset.current;
    if (this.data.currentTab == cur) {
      return false;
    } else {
      wx.pageScrollTo({
        scrollTop: 0
      })
      this.setData({
        currentTab: cur
      })
      this.inintload()
      this.checkCor();
    }
  },
  checkCor: function () {
    let that = this;
    this.setData({
      scrollTop: (that.data.currentTab - 4) * 55
    })
  },
  onReachBottom() {
    this.loadClassifProduct()
  }
})