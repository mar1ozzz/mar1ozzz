let app = getApp()
Page({
  data: {
    history: [],
    hot: [],
    key: "",
    showActionSheet: false,
    tips: "确认清空搜索历史吗？"
  },
  onLoad() {
    this.loadSearchHotSearch()
    this.setData({
      history: app.$db.get('history') || []
    })
  },
  loadSearchHotSearch() {
    app.$api.getSearchHotSearch().then(res => {
      if (res.code) {
        this.setData({
          hot: res.data
        })
      }
    })
  },
  searchValHandle: function () {
    let val = this.data.key
    if (!val) {
      return
    }
    if (this.data.history.indexOf(val) == -1) {
      if (this.data.history.length > 10) {
        this.data.history = this.data.history.shift()
      }
      this.setData({
        history: this.data.history.concat(val)
      })
      this.addHot(val)
      app.$db.set('history', this.data.history)
    }
    app.$comm.navigateTo("/pages/product-list/product-list?searchKey=" + val)
  },
  addHot(text) {
    app.$api.addSearchHot({
      hot_search_text: text
    })
  },
  tagClickHandle(e) {
    let key = e.currentTarget.dataset.val
    this.setData({
      key
    })
  },
  input: function (e) {
    let key = e.detail.value.trim();
    this.setData({
      key: key
    })
  },
  cleanKey: function () {
    this.setData({
      key: ''
    });
  },
  closeActionSheet: function () {
    this.setData({
      showActionSheet: false
    })
  },
  openActionSheet: function () {
    this.setData({
      showActionSheet: true
    })
  },
  itemClick: function (e) {
    let index = e.detail.index;
    if (index == 0) {
      this.setData({
        showActionSheet: false,
        history: []
      })
      app.$db.set('history', this.data.history)
    }
  }
})